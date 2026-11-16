import { Schema, Table, column } from '@powersync/react-native';

export const POWERSYNC_SCHEMA = new Schema([
  new Table({
    name: 'profiles',
    columns: [
      column.text('username'),
      column.text('full_name'),
      column.text('website'),
      column.text('avatar_url'),
      column.text('updated_at'),
    ],
  }),
  new Table({
    name: 'sync_admission_receipts',
    columns: [
      column.text('job_id'),
      column.text('job_type'),
      column.text('entity_id'),
      column.text('payload_hash'),
      column.text('previous_receipt_hash'),
      column.text('receipt_hash'),
      column.text('admitted_at'),
      column.text('status'),
      column.text('error'),
      column.text('created_at'),
    ],
  }),
  new Table({
    name: 'sync_job_quarantine',
    columns: [
      column.text('job_type'),
      column.text('payload'),
      column.text('entity_id'),
      column.text('rejection_reason'),
      column.text('verdict'),
      column.text('created_at'),
    ],
  }),
]);
