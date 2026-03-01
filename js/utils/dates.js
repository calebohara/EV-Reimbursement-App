/**
 * Date utilities — centralized date parsing and formatting.
 * Eliminates timezone-related offset bugs by always parsing
 * YYYY-MM-DD strings into local dates (not UTC).
 */

/** Parse a "YYYY-MM-DD" string into a local Date (no timezone shift). */
export function parseLocalDate(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  return isNaN(d.getTime()) ? null : d;
}

/** Format a Date as "YYYY-MM-DD" using local values. */
export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Return true when both dates are valid and start <= end. */
export function isValidDateRange(startStr, endStr) {
  const s = parseLocalDate(startStr);
  const e = parseLocalDate(endStr);
  return s !== null && e !== null && s <= e;
}

/**
 * Iterate from startDate to endDate (inclusive), calling fn(date)
 * for each day. Returns an array of fn results.
 */
export function forEachDay(startDate, endDate, fn) {
  const results = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    results.push(fn(new Date(d)));
    d.setDate(d.getDate() + 1);
  }
  return results;
}

/** Count total days between two dates (inclusive). */
export function dayCount(startDate, endDate) {
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}
