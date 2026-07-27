// graphql/mutations/health.ts — health feature mutations.
import { gql } from '@apollo/client';

// Records a dose as taken (or skipped) — powers the "Medications today" list.
export const MARK_MEDICATION_TAKEN = gql`
  mutation MarkMedicationTaken($medicationId: ID!, $takenAt: String, $status: String) {
    markMedicationTaken(medicationId: $medicationId, takenAt: $takenAt, status: $status) {
      id
      medicationId
      status
      takenAt
    }
  }
`;

export const ADD_HEALTH_RECORD = gql`
  mutation AddHealthRecord($input: AddHealthRecordInput!) {
    addHealthRecord(input: $input) { id type name note }
  }
`;

export const ADD_MEDICATION = gql`
  mutation AddMedication($input: AddMedicationInput!) {
    addMedication(input: $input) { id name dosage times frequency active }
  }
`;

export const LOG_PERIOD = gql`
  mutation LogPeriod($input: LogPeriodInput!) {
    logPeriod(input: $input) { id startDate endDate }
  }
`;
