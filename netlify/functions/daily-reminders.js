// netlify/functions/daily-reminders.js
// Runs every day at 8:00 AM CST (San Antonio time)
// Checks for birthdays and work anniversaries in next 7 days
// Sends a digest email via Resend to the office

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role for server-side
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL   = process.env.ALERT_EMAIL || 'office@macariobros.com';
const FROM_EMAIL    = process.env.FROM_EMAIL  || 'hr@macariobrotherslawncare.com';

// ── Helpers ──────────────────────────────────────────────────
function getSADate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
}

function daysUntil(monthDay, refYear) {
  const today = getSADate();
  const year = refYear || today.getFullYear();
  const d = new Date(`${monthDay} ${year}`);
  if (isNaN(d)) return null;
  let diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    const next = new Date(`${monthDay} ${today.getFullYear() + 1}`);
    diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  }
  return diff;
}

function getAnniversaryInfo(startDate) {
  if (!startDate) return null;
  const today = getSADate();
  const start = new Date(startDate);
  if (isNaN(start)) return null;
  const monthDay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const days = daysUntil(monthDay);
  if (days === null) return null;
  const years = today.getFullYear() - start.getFullYear() + (days <= 30 ? 0 : 1);
  return { monthDay, days, years };
}

// ── Email Template ────────────────────────────────────────────
function buildEmailHTML(birthdays, anniversaries, todayStr) {
  const hasSomething = birthdays.length > 0 || anniversaries.length > 0;

  const urgencyBadge = (days) => {
    if (days === 0) return `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;">TODAY</span>`;
    if (days === 1) return `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;">TOMORROW</span>`;
    if (days <= 3)  return `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;">In ${days} days</span>`;
    return `<span style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">In ${days} days</span>`;
  };

  const rowHTML = (name, role, detail, days) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${name}</div>
        <div style="color:#6b7280;font-size:12px;">${role}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${detail}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${urgencyBadge(days)}</td>
    </tr>
  `;

  const birthdayRows = birthdays.map(e => rowHTML(e.name, e.role, `Birthday — ${e.birthday}`, e.days)).join('');
  const anniversaryRows = anniversaries.map(e => rowHTML(e.name, e.role, `${e.years}-Year Work Anniversary — ${e.anniversaryDate}`, e.days)).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f0;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1B3A2D;padding:24px 28px;display:flex;align-items:center;gap:12px;">
      <div style="background:#5db88a;width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#0d1f16;flex-shrink:0;">MB</div>
      <div>
        <div style="color:#fff;font-weight:800;font-size:18px;">Macario Brothers Lawn Care</div>
        <div style="color:rgba(255,255,255,0.55);font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Daily HR Reminder — ${todayStr}</div>
      </div>
    </div>

    <div style="padding:24px 28px;">
      ${!hasSomething ? `
        <p style="color:#6b7280;font-size:14px;text-align:center;padding:20px 0;">No upcoming birthdays or anniversaries in the next 7 days.</p>
      ` : ''}

      ${birthdays.length > 0 ? `
        <h2 style="font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Birthdays</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Employee</th>
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Details</th>
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">When</th>
            </tr>
          </thead>
          <tbody>${birthdayRows}</tbody>
        </table>
      ` : ''}

      ${anniversaries.length > 0 ? `
        <h2 style="font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Work Anniversaries</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Employee</th>
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Details</th>
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">When</th>
            </tr>
          </thead>
          <tbody>${anniversaryRows}</tbody>
        </table>
      ` : ''}

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;font-size:13px;color:#166534;">
        View full dashboard: <a href="https://macariobros-hr.netlify.app" style="color:#1B3A2D;font-weight:600;">macariobros-hr.netlify.app</a>
      </div>
    </div>

    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;color:#9ca3af;font-size:12px;">
      Macario Brothers Lawn Care &mdash; HR Dashboard &mdash; San Antonio, TX
    </div>
  </div>
</body>
</html>`;
}

// ── Main Handler ──────────────────────────────────────────────
exports.handler = async (event) => {
  // Allow manual trigger via GET request too (for testing)
  console.log('Daily reminders function triggered');

  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
    console.error('Missing env vars:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY, RESEND_API_KEY: !!RESEND_API_KEY });
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing environment variables' }) };
  }

  try {
    // 1. Fetch all employees from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: employees, error } = await supabase.from('employees').select('*').eq('active', true);

    if (error) throw new Error('Supabase error: ' + error.message);

    const DAYS_AHEAD = 7;
    const today = getSADate();
    const todayStr = today.toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday:'long', month:'long', day:'numeric', year:'numeric' });

    // 2. Find upcoming birthdays
    const birthdays = (employees || [])
      .filter(e => e.birthday)
      .map(e => ({ ...e, days: daysUntil(e.birthday) }))
      .filter(e => e.days !== null && e.days >= 0 && e.days <= DAYS_AHEAD)
      .sort((a, b) => a.days - b.days);

    // 3. Find upcoming anniversaries
    const anniversaries = (employees || [])
      .filter(e => e.start_date)
      .map(e => {
        const info = getAnniversaryInfo(e.start_date);
        if (!info || info.days < 0 || info.days > DAYS_AHEAD) return null;
        return { ...e, days: info.days, years: info.years, anniversaryDate: info.monthDay };
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);

    // 4. Only send if there's something to report
    if (birthdays.length === 0 && anniversaries.length === 0) {
      console.log('No upcoming events — skipping email');
      return { statusCode: 200, body: JSON.stringify({ message: 'No upcoming events today' }) };
    }

    // 5. Build subject line
    const events = [];
    if (birthdays.length > 0) events.push(`${birthdays.length} birthday${birthdays.length > 1 ? 's' : ''}`);
    if (anniversaries.length > 0) events.push(`${anniversaries.length} anniversary${anniversaries.length > 1 ? 'ies' : ''}`);
    const subject = `MB HR Reminder: ${events.join(' & ')} coming up`;

    // 6. Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Macario Brothers HR <${FROM_EMAIL}>`,
        to: [ALERT_EMAIL],
        subject,
        html: buildEmailHTML(birthdays, anniversaries, todayStr),
      }),
    });

    const result = await res.json();
    console.log('Resend result:', result);

    if (!res.ok) throw new Error('Resend error: ' + JSON.stringify(result));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent', birthdays: birthdays.length, anniversaries: anniversaries.length }),
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
