// netlify/functions/daily-reminders.js
// Runs every day at 8:00 AM CST (14:00 UTC)
// Sends via Gmail SMTP — no domain verification needed

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const SUPABASE_URL       = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_USER         = process.env.GMAIL_USER;         // e.g. allysonvvr@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD; // 16-char app password
const ALERT_EMAIL        = process.env.ALERT_EMAIL || 'office@macariobros.com';

// ── Timezone helpers ─────────────────────────────────────────
function getSADate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
}

function daysUntil(monthDay) {
  const today = getSADate();
  let d = new Date(`${monthDay} ${today.getFullYear()}`);
  if (isNaN(d)) return null;
  let diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    d = new Date(`${monthDay} ${today.getFullYear() + 1}`);
    diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
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
  const years = today.getFullYear() - start.getFullYear() + (days <= 60 ? 0 : 1);
  return { monthDay, days, years };
}

// ── Email HTML ───────────────────────────────────────────────
function buildHTML(birthdays, anniversaries, todayStr) {
  const badge = (days) => {
    const color = days === 0 ? '#dc2626' : days <= 3 ? '#d97706' : days <= 7 ? '#ca8a04' : '#166534';
    const bg    = days === 0 ? '#fee2e2' : days <= 3 ? '#fef3c7' : days <= 7 ? '#fef9c3' : '#f0fdf4';
    const label = days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `In ${days} days`;
    return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${label}</span>`;
  };

  const row = (name, role, detail, days) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${name}</div>
        <div style="color:#6b7280;font-size:12px;margin-top:2px;">${role}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;vertical-align:middle;">${detail}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;white-space:nowrap;">${badge(days)}</td>
    </tr>`;

  const table = (title, rows) => `
    <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;margin:24px 0 10px;">${title}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Employee</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Details</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">When</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
  <div style="background:#1B3A2D;padding:22px 28px;">
    <div style="color:#fff;font-weight:800;font-size:18px;">Macario Brothers Lawn Care</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px;text-transform:uppercase;letter-spacing:0.05em;">Daily HR Reminder — ${todayStr}</div>
  </div>
  <div style="padding:8px 28px 28px;">
    ${birthdays.length > 0 ? table('Birthdays', birthdays.map(e => row(e.name, e.role, `Birthday — ${e.birthday}`, e.days)).join('')) : ''}
    ${anniversaries.length > 0 ? table('Work Anniversaries', anniversaries.map(e => row(e.name, e.role, `${e.years}-Year Anniversary — ${e.anniversaryDate}`, e.days)).join('')) : ''}
    <div style="margin-top:20px;padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:13px;color:#166534;">
      View dashboard: <a href="https://macariobros-hr.netlify.app" style="color:#1B3A2D;font-weight:700;">macariobros-hr.netlify.app</a>
    </div>
  </div>
  <div style="padding:14px 28px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;color:#9ca3af;font-size:12px;">
    Macario Brothers Lawn Care &mdash; San Antonio, TX &mdash; Automated HR Alert
  </div>
</div>
</body></html>`;
}

// ── Main ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log('daily-reminders triggered');

  if (!SUPABASE_URL || !SUPABASE_KEY || !GMAIL_USER || !GMAIL_APP_PASSWORD) {
    const missing = { SUPABASE_URL:!!SUPABASE_URL, SUPABASE_KEY:!!SUPABASE_KEY, GMAIL_USER:!!GMAIL_USER, GMAIL_APP_PASSWORD:!!GMAIL_APP_PASSWORD };
    console.error('Missing env vars:', missing);
    return { statusCode:500, body: JSON.stringify({ error:'Missing env vars', missing }) };
  }

  try {
    // 1. Fetch employees
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: employees, error } = await supabase.from('employees').select('*').eq('active', true);
    if (error) throw new Error('Supabase: ' + error.message);

    const DAYS = 7;
    const today = getSADate();
    const todayStr = today.toLocaleDateString('en-US', { timeZone:'America/Chicago', weekday:'long', month:'long', day:'numeric', year:'numeric' });

    // 2. Birthdays in next 7 days
    const birthdays = (employees || [])
      .filter(e => e.birthday)
      .map(e => ({ ...e, days: daysUntil(e.birthday) }))
      .filter(e => e.days !== null && e.days >= 0 && e.days <= DAYS)
      .sort((a, b) => a.days - b.days);

    // 3. Anniversaries in next 7 days
    const anniversaries = (employees || [])
      .filter(e => e.start_date)
      .map(e => {
        const info = getAnniversaryInfo(e.start_date);
        if (!info || info.days < 0 || info.days > DAYS) return null;
        return { ...e, days: info.days, years: info.years, anniversaryDate: info.monthDay };
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);

    if (birthdays.length === 0 && anniversaries.length === 0) {
      console.log('No upcoming events');
      return { statusCode:200, body: JSON.stringify({ message:'No upcoming events today' }) };
    }

    // 4. Build subject
    const parts = [];
    if (birthdays.length)     parts.push(`${birthdays.length} birthday${birthdays.length > 1 ? 's' : ''}`);
    if (anniversaries.length) parts.push(`${anniversaries.length} anniversary${anniversaries.length > 1 ? 'ies' : ''}`);
    const subject = `MB HR: ${parts.join(' & ')} coming up — ${todayStr}`;

    // 5. Send via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `Macario Brothers HR <${GMAIL_USER}>`,
      to: ALERT_EMAIL,
      subject,
      html: buildHTML(birthdays, anniversaries, todayStr),
    });

    console.log(`Email sent to ${ALERT_EMAIL}`);
    return { statusCode:200, body: JSON.stringify({ message:'Email sent', birthdays: birthdays.length, anniversaries: anniversaries.length }) };

  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
};
