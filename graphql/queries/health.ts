// graphql/queries/health.ts — dashboard + health feature queries.
import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments';

// One round trip for everything the dashboard needs (kind to slow networks).
// `date` is today's YYYY-MM-DD so we know which doses are already logged.
export const DASHBOARD = gql`
  query Dashboard($date: String, $weekAgo: String) {
    me { ${USER_FIELDS} }
    myHealthRecords { id type name }
    myMedications { id name dosage times frequency active }
    myMedicationLogs(date: $date) { id medicationId status takenAt }
    habitSummary {
      date
      waterToday
      waterGoal
      waterGoalMet
      waterStreak
      sleepLastNight
      latestWeight
      bmi
      bmiCategory
    }
    # last seven days of water, for the sparkline on the habits card
    myHabitLogs(type: "water", from: $weekAgo) { id value date }
  }
`;

// Women only — the backend rejects this for other users (WOMEN_ONLY), so the
// caller must skip it unless gender is "Woman".
export const CYCLE_PREDICTION = gql`
  query CyclePrediction {
    cyclePrediction {
      basedOnCycles
      averageCycleLength
      averagePeriodLength
      cycleVariation
      confidence
      regularity
      irregularityFlag
      nextPeriodDate
      fertileWindowStart
      fertileWindowEnd
      daysUntilNextPeriod
      daysUntilFertileWindow
    }
  }
`;

export const MY_HEALTH_RECORDS = gql`
  query MyHealthRecords($type: String) {
    myHealthRecords(type: $type) {
      id
      type
      name
      note
      attachments { id url name }
    }
  }
`;

export const MY_MEDICATIONS = gql`
  query MyMedications {
    myMedications { id name dosage times frequency active }
  }
`;

// Women only — same WOMEN_ONLY guard as cyclePrediction.
export const MY_CYCLES = gql`
  query MyCycles {
    myCycles { id startDate endDate }
  }
`;

// The whole directory, optionally narrowed by area — this is what the Find
// care list shows. No location permission needed, unlike nearbyHospitals.
export const HOSPITALS = gql`
  query Hospitals($city: String, $province: String, $type: String) {
    hospitals(city: $city, province: $province, type: $type) {
      id
      name
      address
      phone
      latitude
      longitude
      city
      province
      type
    }
  }
`;

// Everything the Find care screen needs, in one response. The backend applies
// the filter, runs the search, measures the distances, sorts the result and
// works out where the map should open — the app just renders it.
export const CARE_MAP = gql`
  query CareMap($input: CareMapInput) {
    careMap(input: $input) {
      facilities {
        id
        name
        address
        phone
        latitude
        longitude
        city
        province
        type
        distanceKm
      }
      region {
        latitude
        longitude
        latitudeDelta
        longitudeDelta
      }
      totalCount
      count
      radiusKm
      sortedByDistance
    }
  }
`;

export const NEARBY_HOSPITALS = gql`
  query NearbyHospitals($latitude: Float!, $longitude: Float!, $radiusKm: Float) {
    nearbyHospitals(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
      id
      name
      address
      phone
      latitude
      longitude
      distanceKm
    }
  }
`;
