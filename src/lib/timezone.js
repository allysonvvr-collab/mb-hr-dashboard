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

/** Birthday upcoming check (birthday stored as "Jul 4") */
export function isBirthdayUpcoming(birthdayStr) {
  if (!birthdayStr) return false;
  const today = nowSA();
  const thisYear = today.getFullYear();
  const bday = new Date(`${birthdayStr} ${thisYear}`);
  if (isNaN(bday)) return false;
  const diff = (bday - today) / (1000 * 60 * 60 * 24);
  if (diff >= 0 && diff <= 30) return true;
  const bdayNext = new Date(`${birthdayStr} ${thisYear + 1}`);
  const diffNext = (bdayNext - today) / (1000 * 60 * 60 * 24);
  return diffNext >= 0 && diffNext <= 30;
}

export function daysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const today = nowSA();
  const thisYear = today.getFullYear();
  let bday = new Date(`${birthdayStr} ${thisYear}`);
  if (isNaN(bday)) return null;
  if (bday < today) bday = new Date(`${birthdayStr} ${thisYear + 1}`);
  return Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
}
