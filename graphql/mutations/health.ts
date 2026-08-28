// graphql/mutations/health.ts — health feature mutations.
import { gql } from '@apollo/client';

// Records a dose as taken (or skipped) — powers the "Medications today" list.
// `slot` says WHICH of the day's doses this is — "08:00" vs "20:00". Without it
// a twice-daily medicine went fully "done" on one tap.
export const MARK_MEDICATION_TAKEN = gql`
  mutation MarkMedicationTaken($medicationId: ID!, $slot: String, $takenAt: String, $status: String) {
    markMedicationTaken(medicationId: $medicationId, slot: $slot, takenAt: $takenAt, status: $status) {
      id
      medicationId
      status
      takenAt
      slot
      localDate
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

// undo a mis-tap — without this a wrong tick stands until midnight
export const UNMARK_MEDICATION_TAKEN = gql`
  mutation UnmarkMedicationTaken($medicationId: ID!, $slot: String, $date: String) {
    unmarkMedicationTaken(medicationId: $medicationId, slot: $slot, date: $date)
  }
`;

/* ---------------------- record attachments ------------------------ */

// Both return the whole record, so the cache updates the attachment list
// without a second query.
export const ADD_ATTACHMENT = gql`
  mutation AddAttachment($recordId: ID!, $input: AddAttachmentInput!) {
    addAttachment(recordId: $recordId, input: $input) {
      id type name note
      attachments { id url name }
    }
  }
`;

export const REMOVE_ATTACHMENT = gql`
  mutation RemoveAttachment($recordId: ID!, $attachmentId: ID!) {
    removeAttachment(recordId: $recordId, attachmentId: $attachmentId) {
      id type name note
      attachments { id url name }
    }
  }
`;
