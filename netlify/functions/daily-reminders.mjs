// daily-reminders.mjs
// Uses fetch to call Gmail API — no external dependencies needed

const SUPABASE_URL       = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_USER         = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ALERT_EMAIL        = process.env.ALERT_EMAIL || 'office@macariobros.com';

// ── Helpers ──────────────────────────────────────────────────
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

// ── Send email via SMTP2GO (free, no domain needed) ──────────
// Actually use fetch to call smtp2go API — totally free, 1000 emails/mo
// OR we use Supabase's built-in email if configured
// Simplest: use fetch to call a simple SMTP relay via smtpjs pattern

// ── Send via Gmail SMTP using raw SMTP over fetch isn't possible
// Use smtp2go free API instead — sign up free at smtp2go.com
// OR use mailersend free tier
// 
// BEST FREE NO-DOMAIN OPTION: Use Supabase Edge Functions
// OR: Use smtp2go free API

async function sendViaSmtp2go({ to, subject, html, from, fromName }) {
  const SMTP2GO_KEY = process.env.SMTP2GO_API_KEY;
  
  const res = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: SMTP2GO_KEY,
      to: [to],
      sender: `${fromName} <${from}>`,
      subject,
      html_body: html,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.data?.error) throw new Error(JSON.stringify(data));
  return data;
}

// ── Email HTML ───────────────────────────────────────────────
function buildHTML(birthdays, anniversaries, todayStr) {
  const badge = (days) => {
    const color = days === 0 ? '#dc2626' : days <= 3 ? '#d97706' : '#166534';
    const bg    = days === 0 ? '#fee2e2' : days <= 3 ? '#fef3c7' : '#f0fdf4';
    const label = days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `In ${days} days`;
    return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${label}</span>`;
  };

  const row = (name, role, detail, days) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${name}</div>
        <div style="color:#6b7280;font-size:12px;">${role}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${detail}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${badge(days)}</td>
    </tr>`;

  const table = (title, rows) => `
    <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;margin:24px 0 10px;">${title}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      <thead><tr style="background:#f9fafb;">
        <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Employee</th>
        <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Details</th>
        <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;">When</th>
      </tr></thead>
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
    Macario Brothers Lawn Care — San Antonio, TX — Automated HR Alert
  </div>
</div>
</body></html>`;
}

// ── Main ─────────────────────────────────────────────────────
export const handler = async (event) => {
  console.log('daily-reminders triggered');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase env vars' }) };
  }

  if (!process.env.SMTP2GO_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing SMTP2GO_API_KEY' }) };
  }

  try {
    // 1. Fetch employees from Supabase using fetch (no SDK needed)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&active=eq.true`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    const employees = await res.json();
    if (!Array.isArray(employees)) throw new Error('Bad Supabase response: ' + JSON.stringify(employees));

    const DAYS = 7;
    const today = getSADate();
    const todayStr = today.toLocaleDateString('en-US', {
      timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    // 2. Birthdays
    const birthdays = employees
      .filter(e => e.birthday)
      .map(e => ({ ...e, days: daysUntil(e.birthday) }))
      .filter(e => e.days !== null && e.days >= 0 && e.days <= DAYS)
      .sort((a, b) => a.days - b.days);

    // 3. Anniversaries
    const anniversaries = employees
      .filter(e => e.start_date)
      .map(e => {
        const info = getAnniversaryInfo(e.start_date);
        if (!info || info.days < 0 || info.days > DAYS) return null;
        return { ...e, days: info.days, years: info.years, anniversaryDate: info.monthDay };
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);

    if (birthdays.length === 0 && anniversaries.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No upcoming events today' }) };
    }

    // 4. Subject
    const parts = [];
    if (birthdays.length)     parts.push(`${birthdays.length} birthday${birthdays.length > 1 ? 's' : ''}`);
    if (anniversaries.length) parts.push(`${anniversaries.length} anniversary${anniversaries.length > 1 ? 'ies' : ''}`);
    const subject = `MB HR: ${parts.join(' & ')} coming up`;

    // 5. Send via smtp2go
    await sendViaSmtp2go({
      to: ALERT_EMAIL,
      from: 'hr@macariobros-hr.netlify.app',
      fromName: 'Macario Brothers HR',
      subject,
      html: buildHTML(birthdays, anniversaries, todayStr),
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent', birthdays: birthdays.length, anniversaries: anniversaries.length }) };

  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
