// hooks/use-records.ts — health records list + add / edit / remove, in one place.
//
//   const { records, add, update, remove, loading } = useRecords();
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  ADD_HEALTH_RECORD,
  MY_HEALTH_RECORDS,
  REMOVE_HEALTH_RECORD,
  UPDATE_HEALTH_RECORD,
  type AddHealthRecordData,
  type AddHealthRecordInput,
  type MyHealthRecordsData,
  type RemoveHealthRecordData,
  type UpdateHealthRecordData,
  type UpdateHealthRecordInput,
} from '@/graphql';

// matches the backend enum on healthRecord.type
export const RECORD_TYPES = ['Condition', 'Allergy', 'Medication'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export function useRecords() {
  // null = show everything; otherwise filter by one type
  const [filter, setFilter] = useState<RecordType | null>(null);

  const { data, loading, error, refetch } = useQuery<MyHealthRecordsData>(MY_HEALTH_RECORDS, {
    variables: { type: filter ?? undefined },
    fetchPolicy: 'cache-and-network',
  });

  // every mutation refetches the list it just changed
  const refresh = [{ query: MY_HEALTH_RECORDS, variables: { type: filter ?? undefined } }];

  const [addMutation, { loading: adding }] = useMutation<AddHealthRecordData>(ADD_HEALTH_RECORD, {
    refetchQueries: refresh,
  });
  const [updateMutation, { loading: updating }] = useMutation<UpdateHealthRecordData>(
    UPDATE_HEALTH_RECORD,
    { refetchQueries: refresh },
  );
  const [removeMutation, { loading: removing }] = useMutation<RemoveHealthRecordData>(
    REMOVE_HEALTH_RECORD,
    { refetchQueries: refresh },
  );

  const records = data?.myHealthRecords ?? [];

  // group by type so the screen can show sections instead of one long list
  const grouped = useMemo(() => {
    return RECORD_TYPES.map((type) => ({
      type,
      items: records.filter((r) => r.type === type),
    })).filter((section) => section.items.length > 0);
  }, [records]);

  const add = (input: AddHealthRecordInput) => addMutation({ variables: { input } });
  const update = (id: string, input: UpdateHealthRecordInput) =>
    updateMutation({ variables: { id, input } });
  const remove = (id: string) => removeMutation({ variables: { id } });

  return {
    records,
    grouped,
    count: records.length,
    filter,
    setFilter,
    add,
    update,
    remove,
    saving: adding || updating,
    removing,
    loading,
    error,
    refetch,
  };
}

export default useRecords;
