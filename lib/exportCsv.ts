// csv export utility - converts all applications to a csv file and shares it
// fields containing commas, quotes or newlines are properly escaped
// the file is written to the cache directory then shared via the native share sheet

import { getApplications } from '@/db/queries';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// escape a csv field value - wraps in quotes if it contains special characters
function escapeField(val: string | null | undefined): string {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportApplicationsCsv(): Promise<void> {
  // fetch all applications from sqlite including category name
  const apps = getApplications();

  // build the header row and map each application to a csv row
  const header = ['Company', 'Role', 'Status', 'Date Applied', 'Category', 'Notes'];
  const rows = apps.map((a) => [
    escapeField(a.company),
    escapeField(a.role),
    escapeField(a.status),
    escapeField(a.dateApplied),
    escapeField(a.categoryName),
    escapeField(a.notes),
  ]);

  // combine header and rows into a single csv string
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // write the csv to a dated file in the app cache directory
  const date = new Date().toISOString().split('T')[0];
  const uri  = `${FileSystem.cacheDirectory}job-applications-${date}.csv`;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  // open the native share sheet so the user can save or send the file
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Applications' });
}