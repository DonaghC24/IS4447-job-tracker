import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getApplications } from '@/db/queries';

function escapeField(val: string | null | undefined): string {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportApplicationsCsv(): Promise<void> {
  const apps = getApplications();

  const header = ['Company', 'Role', 'Status', 'Date Applied', 'Category', 'Notes'];
  const rows = apps.map((a) => [
    escapeField(a.company),
    escapeField(a.role),
    escapeField(a.status),
    escapeField(a.dateApplied),
    escapeField(a.categoryName),
    escapeField(a.notes),
  ]);

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const date = new Date().toISOString().split('T')[0];
  const uri  = `${FileSystem.cacheDirectory}job-applications-${date}.csv`;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Applications' });
}
