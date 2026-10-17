import type { WorkHistoryEntry } from '@/api';
import { monthsBetween } from '@/shared/lib/format';

/** "2 баталгаажсан ажил · 14 сар" */
export function monthsSummary(history: WorkHistoryEntry[]): string {
  const verified = history.filter((h) => h.verified);
  if (!verified.length) return 'Баталгаажсан түүх алга';
  const months = verified.reduce((s, h) => s + monthsBetween(h.startDate, h.endDate), 0);
  return `${verified.length} баталгаажсан ажил · ${months} сар`;
}
