// All dates/times in this app use San Antonio, TX timezone (America/Chicago)
const SA_TZ = 'America/Chicago';

export function nowSA() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SA_TZ }));
}

/** Returns YYYY-MM-DD — used for <input type="date"> default values */
export function todaySA() {
  const d = nowSA();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Display a date string or Date as MM/DD/YYYY
 * Accepts: "YYYY-MM-DD", "2026-06-16", ISO timestamps, or Date objects
 */
export function formatDateSA(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (typeof dateStr === 'string' && !dateStr.includes('T') ? 'T12:00:00Z' : ''));
  if (isNaN(d)) return dateStr; // fallback: show raw value
  return d.toLocaleDateString('en-US', { timeZone: SA_TZ, month: '2-digit', day: '2-digit', year: 'numeric' });
}

/** Format a full timestamp: MM/DD/YYYY 2:45 PM CDT */
export function formatTimestampSA(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    timeZone: SA_TZ,
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}

/** Clock string: "2:45 PM CDT" */
export function clockSA() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: SA_TZ,
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}

/**
 * Extract month/day from a birthday stored as a real date (YYYY-MM-DD).
 * Also tolerates legacy "Jul 21" style strings for old data that hasn't been migrated yet.
 */
function birthdayMonthDay(birthdayStr) {
  if (!birthdayStr) return null;
  // Real date format: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthdayStr);
  if (isoMatch) return { month: parseInt(isoMatch[2], 10) - 1, day: parseInt(isoMatch[3], 10) };
  // Legacy "Jul 21" fallback
  const legacy = new Date(`${birthdayStr} 2000`);
  if (!isNaN(legacy)) return { month: legacy.getMonth(), day: legacy.getDate() };
  return null;
}

/** Birthday upcoming check — birthday stored as a real date (YYYY-MM-DD) */
export function isBirthdayUpcoming(birthdayStr) {
  const md = birthdayMonthDay(birthdayStr);
  if (!md) return false;
  const today = nowSA();
  const thisYear = today.getFullYear();
  const bday = new Date(thisYear, md.month, md.day);
  const diff = (bday - today) / (1000 * 60 * 60 * 24);
  if (diff >= 0 && diff <= 30) return true;
  const bdayNext = new Date(thisYear + 1, md.month, md.day);
  const diffNext = (bdayNext - today) / (1000 * 60 * 60 * 24);
  return diffNext >= 0 && diffNext <= 30;
}

export function daysUntilBirthday(birthdayStr) {
  const md = birthdayMonthDay(birthdayStr);
  if (!md) return null;
  const today = nowSA();
  const thisYear = today.getFullYear();
  let bday = new Date(thisYear, md.month, md.day);
  if (bday < today) bday = new Date(thisYear + 1, md.month, md.day);
  return Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
}

/** Format a YYYY-MM value (from <input type="month">) as "May 2026" */
export function formatMonthSA(monthStr) {
  if (!monthStr) return '—';
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m) return monthStr; // fallback for old free-text entries like "May 2026"
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Month name only, no year — for tight UI columns where the year would be clutter */
export function formatMonthOnlySA(monthStr) {
  if (!monthStr) return '—';
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m) return monthStr.split(' ')[0] || monthStr; // fallback for old "May 2026" text
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

/** Returns the current month as YYYY-MM, for <input type="month"> default values */
export function thisMonthSA() {
  const d = nowSA();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
export function formatBirthdaySA(birthdayStr) {
  const md = birthdayMonthDay(birthdayStr);
  if (!md) return '—';
  return `${String(md.month + 1).padStart(2,'0')}/${String(md.day).padStart(2,'0')}`;
}

/** Format month/day as "Jul 11" style — used on the Celebrations dashboard */
export function formatBirthdayShort(birthdayStr) {
  const md = birthdayMonthDay(birthdayStr);
  if (!md) return '—';
  const d = new Date(2000, md.month, md.day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format a work-anniversary start_date (real YYYY-MM-DD) as "Jul 11" style */
export function formatAnniversaryShort(startDateStr) {
  if (!startDateStr) return '—';
  const d = new Date(startDateStr + 'T12:00:00Z');
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { timeZone: SA_TZ, month: 'short', day: 'numeric' });
}

/** Days until a work anniversary (next occurrence), based on a real start_date */
export function daysUntilAnniversary(startDateStr) {
  if (!startDateStr) return null;
  const start = new Date(startDateStr + 'T12:00:00Z');
  if (isNaN(start)) return null;
  const today = nowSA();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, start.getMonth(), start.getDate());
  if (next < today) next = new Date(thisYear + 1, start.getMonth(), start.getDate());
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}

/** Years of service as of the next upcoming anniversary */
export function anniversaryYears(startDateStr) {
  if (!startDateStr) return null;
  const start = new Date(startDateStr + 'T12:00:00Z');
  if (isNaN(start)) return null;
  const today = nowSA();
  let years = today.getFullYear() - start.getFullYear();
  const daysAway = daysUntilAnniversary(startDateStr);
  // If the anniversary already passed this year (daysAway counts toward next year's date), bump by 1
  const thisYearAnniv = new Date(today.getFullYear(), start.getMonth(), start.getDate());
  if (thisYearAnniv < today) years += 1;
  return years;
}
