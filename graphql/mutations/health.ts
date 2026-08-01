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

export const UPDATE_HEALTH_RECORD = gql`
  mutation UpdateHealthRecord($id: ID!, $input: UpdateHealthRecordInput!) {
    updateHealthRecord(id: $id, input: $input) { id type name note }
  }
`;

export const REMOVE_HEALTH_RECORD = gql`
  mutation RemoveHealthRecord($id: ID!) {
    removeHealthRecord(id: $id)
  }
`;

export const ADD_MEDICATION = gql`
  mutation AddMedication($input: AddMedicationInput!) {
    addMedication(input: $input) { id name dosage times frequency active }
  }
`;

export const UPDATE_MEDICATION = gql`
  mutation UpdateMedication($id: ID!, $input: UpdateMedicationInput!) {
    updateMedication(id: $id, input: $input) { id name dosage times frequency active }
  }
`;

export const REMOVE_MEDICATION = gql`
  mutation RemoveMedication($id: ID!) {
    removeMedication(id: $id)
  }
`;

export const LOG_PERIOD = gql`
  mutation LogPeriod($input: LogPeriodInput!) {
    logPeriod(input: $input) { id startDate endDate }
  }
`;

export const UPDATE_PERIOD = gql`
  mutation UpdatePeriod($id: ID!, $input: UpdatePeriodInput!) {
    updatePeriod(id: $id, input: $input) { id startDate endDate }
  }
`;

export const SET_CYCLE_REGULARITY = gql`
  mutation SetCycleRegularity($regularity: String!) {
    setCycleRegularity(regularity: $regularity) { id cycleRegularity }
  }
`;

export const REMOVE_PERIOD = gql`
  mutation RemovePeriod($id: ID!) {
    removePeriod(id: $id)
  }
`;
