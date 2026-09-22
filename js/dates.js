// Small date helpers.
//
// Dates are stored as plain 'YYYY-MM-DD' strings, never as Date objects.
// Strings are easy to save in LocalStorage, easy to compare ('2026-09-18' <
// '2026-09-22' is true), and never shift by a timezone.
//
// Everything here works in the browser's local time, because "today" for the
// business owner is the date on her own phone.

/**
 * Turns a Date object into a 'YYYY-MM-DD' string.
 * Built by hand from the local year/month/day – toISOString() would convert to
 * UTC first and could land on the wrong day.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** @returns {string} Today's date as 'YYYY-MM-DD'. */
export function today() {
  return toISO(new Date());
}

/**
 * A date relative to today. Negative is in the past, positive in the future.
 *
 * @param {number} offset Number of days. daysFromToday(-3) is three days ago.
 * @returns {string}
 */
export function daysFromToday(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toISO(date);
}

/**
 * A given day of the current month, never in the future.
 * Used for demo sales, so "revenue this month" is never empty – even on the
 * first of the month.
 *
 * @param {number} dayOfMonth
 * @returns {string}
 */
export function dayOfThisMonth(dayOfMonth) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  return toISO(date > now ? now : date);
}

/**
 * Whole days from one date to another. Positive means `to` is later.
 *
 * @param {string} fromISO
 * @param {string} toISODate
 * @returns {number}
 */
export function daysBetween(fromISO, toISODate) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISODate}T00:00:00`);
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * Short display format, as used throughout the SPEC: 15/09.
 *
 * @param {string} [iso]
 * @returns {string} '' when there is no date.
 */
export function formatShortDate(iso) {
  if (!iso) return '';
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

/**
 * Full display format: 15/09/2026.
 *
 * @param {string} [iso]
 * @returns {string} '' when there is no date.
 */
export function formatFullDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
