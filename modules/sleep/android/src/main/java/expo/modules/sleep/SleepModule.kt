package expo.modules.sleep

import android.annotation.SuppressLint
import android.content.Context
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.SleepSegmentRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Automatic sleep on Android via Google's Sleep API, which estimates sleep from the
// phone's motion and light sensors. Needs the ACTIVITY_RECOGNITION permission.
class SleepModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  override fun definition() = ModuleDefinition {
    Name("Sleep")

    // True when Google Play Services is available (it runs the Sleep API).
    Function("isAvailable") {
      val ctx = context ?: return@Function false
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(ctx) == ConnectionResult.SUCCESS
    }

    // Starts (or renews) sleep updates. Resolves false if the permission is missing.
    AsyncFunction("subscribeAsync") { promise: Promise ->
      val ctx = context
      if (ctx == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      try {
        @SuppressLint("MissingPermission")
        val task = ActivityRecognition.getClient(ctx).requestSleepSegmentUpdates(
          SleepReceiver.pendingIntent(ctx),
          SleepSegmentRequest.getDefaultSleepSegmentRequest()
        )
        task.addOnSuccessListener { promise.resolve(true) }
        task.addOnFailureListener { promise.resolve(false) }
      } catch (e: SecurityException) {
        promise.resolve(false)
      }
    }

    AsyncFunction("unsubscribeAsync") { promise: Promise ->
      val ctx = context
      if (ctx == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      try {
        ActivityRecognition.getClient(ctx)
          .removeSleepSegmentUpdates(SleepReceiver.pendingIntent(ctx))
          .addOnCompleteListener { promise.resolve(null) }
      } catch (e: SecurityException) {
        promise.resolve(null)
      }
    }

    // Stored segments: [{ start, end, status }] with times in ms; status 0 = detected.
    Function("getSegments") {
      val ctx = context ?: return@Function emptyList<Map<String, Double>>()
      SleepReceiver.read(ctx).map { (start, end, status) ->
        mapOf("start" to start.toDouble(), "end" to end.toDouble(), "status" to status.toDouble())
      }
    }

    // Stored classify readings: [{ time, confidence }], time in ms, confidence 0-100.
    Function("getClassifications") {
      val ctx = context ?: return@Function emptyList<Map<String, Double>>()
      SleepReceiver.readClassify(ctx).map { (time, confidence) ->
        mapOf("time" to time.toDouble(), "confidence" to confidence.toDouble())
      }
    }

    Function("clearSegments") {
      context?.let { SleepReceiver.clear(it) }
    }
  }
}
