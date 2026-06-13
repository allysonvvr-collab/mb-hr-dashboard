// All dates/times in this app use San Antonio, TX timezone (America/Chicago)
// This applies regardless of the device's local timezone setting

const SA_TZ = 'America/Chicago';

/**
 * Get current date/time in San Antonio time
 */
export function nowSA() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SA_TZ }));
}

/**
 * Get today's date string in SA time as YYYY-MM-DD
 */
export function todaySA() {
  const d = nowSA();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Format a date string or Date object for display in SA time
 * Returns e.g. "Jun 13, 2026"
 */
export function formatDateSA(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00Z'))
    .toLocaleDateString('en-US', { timeZone: SA_TZ, month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a timestamp for display in SA time
 * Returns e.g. "Jun 13, 2026 2:45 PM CDT"
 */
export function formatTimestampSA(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    timeZone: SA_TZ,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}

/**
 * Get current SA time as a readable clock string
 * Returns e.g. "2:45 PM CDT"
 */
export function clockSA() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: SA_TZ,
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}

/**
 * Check if a birthday (e.g. "Jul 4") falls within next 30 days in SA time
 */
export function isBirthdayUpcoming(birthdayStr) {
  if (!birthdayStr) return false;
  const today = nowSA();
  const thisYear = today.getFullYear();
  const bday = new Date(`${birthdayStr} ${thisYear}`);
  if (isNaN(bday)) return false;
  const diff = (bday - today) / (1000 * 60 * 60 * 24);
  if (diff >= 0 && diff <= 30) return true;
  // Check next year wrap (e.g. Dec birthday, today is Dec 20)
  const bdayNext = new Date(`${birthdayStr} ${thisYear + 1}`);
  const diffNext = (bdayNext - today) / (1000 * 60 * 60 * 24);
  return diffNext >= 0 && diffNext <= 30;
}

/**
 * Days until birthday in SA time
 */
export function daysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const today = nowSA();
  const thisYear = today.getFullYear();
  let bday = new Date(`${birthdayStr} ${thisYear}`);
  if (isNaN(bday)) return null;
  if (bday < today) bday = new Date(`${birthdayStr} ${thisYear + 1}`);
  return Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
}
