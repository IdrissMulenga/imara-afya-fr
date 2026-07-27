// graphql/queries/health.ts — dashboard + health feature queries.
import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments';

// One round trip for everything the dashboard needs (kind to slow networks).
// `date` is today's YYYY-MM-DD so we know which doses are already logged.
export const DASHBOARD = gql`
  query Dashboard($date: String) {
    me { ${USER_FIELDS} }
    myHealthRecords { id type name }
    myMedications { id name dosage times frequency active }
    myMedicationLogs(date: $date) { id medicationId status takenAt }
  }
`;

// Women only — the backend rejects this for other users (WOMEN_ONLY), so the
// caller must skip it unless gender is "Woman".
export const CYCLE_PREDICTION = gql`
  query CyclePrediction {
    cyclePrediction {
      basedOnCycles
      averageCycleLength
      nextPeriodDate
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
