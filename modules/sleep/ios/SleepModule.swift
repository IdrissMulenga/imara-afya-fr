import ExpoModulesCore
import HealthKit

// Sleep on iOS, read from Apple Health (filled in by the iPhone's Sleep Schedule
// or an Apple Watch). Apps cannot estimate sleep from sensors on iOS.
public class SleepModule: Module {
  private let store = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("Sleep")

    Function("isAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    // Shows the Health permission sheet. iOS never reveals whether reading was
    // allowed; a refusal just returns no samples.
    AsyncFunction("requestAuthorizationAsync") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(),
            let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
        promise.resolve(false)
        return
      }
      self.store.requestAuthorization(toShare: nil, read: [type]) { success, _ in
        promise.resolve(success)
      }
    }

    // Sleep samples between two times (ms since epoch): [{ start, end, value }].
    // value: 0 in bed, 1 asleep, 2 awake, 3 core, 4 deep, 5 REM.
    AsyncFunction("getSamplesAsync") { (startMs: Double, endMs: Double, promise: Promise) in
      guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
        promise.resolve([])
        return
      }
      let predicate = HKQuery.predicateForSamples(
        withStart: Date(timeIntervalSince1970: startMs / 1000),
        end: Date(timeIntervalSince1970: endMs / 1000),
        options: []
      )
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
      let query = HKSampleQuery(
        sampleType: type,
        predicate: predicate,
        limit: HKObjectQueryNoLimit,
        sortDescriptors: [sort]
      ) { _, samples, _ in
        let result: [[String: Double]] = (samples as? [HKCategorySample] ?? []).map { sample in
          [
            "start": sample.startDate.timeIntervalSince1970 * 1000,
            "end": sample.endDate.timeIntervalSince1970 * 1000,
            "value": Double(sample.value),
          ]
        }
        promise.resolve(result)
      }
      self.store.execute(query)
    }
  }
}
