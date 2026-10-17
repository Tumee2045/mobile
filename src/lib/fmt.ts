import { parseDate, shortDate, todayISO, addDays } from '@/shared/lib/format';

export { money, pay, shortDate, weekdayShort, relativeTime, chatStamp, monthDot, longDate, todayISO, addDays, weekStart, timeHM } from '@/shared/lib/format';

const WEEKDAYS_LONG = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

/** "312к₮", "1.6сая₮" — compact amounts for tiles (design). */
export function moneyCompact(n: number): string {
  if (n >= 1_000_000) return `${(Math.round(n / 100_000) / 10).toString()}сая₮`;
  if (n >= 10_000) return `${Math.round(n / 1000)}к₮`;
  return `${Math.round(n).toLocaleString('en-US')}₮`;
}

/** "8,500₮/цаг" | "1.6сая₮/сар" — compact pay for job cards (design). */
export function payCompact(type: 'hourly' | 'monthly', amount: number): string {
  return type === 'hourly' ? `${amount.toLocaleString('en-US')}₮/цаг` : `${moneyCompact(amount)}/сар`;
}

/** "Ням 10/18" or "Өнөөдөр" / "Маргааш". */
export function dayLabel(iso: string): string {
  if (iso === todayISO()) return 'Өнөөдөр';
  if (iso === addDays(todayISO(), 1)) return 'Маргааш';
  return `${WEEKDAYS_LONG[parseDate(iso).getDay()]} ${shortDate(iso)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Өглөөний мэнд' : h < 18 ? 'Өдрийн мэнд' : 'Оройн мэнд';
}

export function distanceLabel(m: number): string {
  return m >= 1000 ? `${(Math.round(m / 100) / 10).toString()} км` : `${Math.round(m)} м`;
}

export function dayNumber(iso: string): number {
  return parseDate(iso).getDate();
}
