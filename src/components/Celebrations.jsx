import { useApp } from '../context/AppContext';
import { nowSA } from '../lib/timezone';

function daysUntil(monthDay, yearOverride) {
  const today = nowSA();
  const year = yearOverride || today.getFullYear();
  const d = new Date(`${monthDay} ${year}`);
  if (isNaN(d)) return null;
  let diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    const next = new Date(`${monthDay} ${today.getFullYear() + 1}`);
    diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  }
  return diff;
}

function anniversaryInfo(startDate) {
  if (!startDate) return null;
  const today = nowSA();
  const start = new Date(startDate);
  if (isNaN(start)) return null;
  const years = today.getFullYear() - start.getFullYear();
  const monthDay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const days = daysUntil(monthDay);
  return { years: days <= 30 ? years : years + 1, monthDay, days };
}

function birthdayInfo(birthday) {
  if (!birthday) return null;
  const days = daysUntil(birthday);
  return { monthDay: birthday, days };
}

function urgencyColor(days) {
  if (days <= 3)  return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'This week' };
  if (days <= 7)  return { bg: '#fef3c7', border: '#fde68a', text: '#d97706', label: 'This week' };
  if (days <= 14) return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'Next 2 weeks' };
  return { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: 'This month' };
}

function EventRow({ name, role, type, monthDay, days, extra }) {
  const colors = urgencyColor(days);
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #f3f4f6', flexWrap:'wrap', gap:8 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'#1B3A2D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
          {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:14 }}>{name}</div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{role} &middot; {type}{extra ? ` — ${extra}` : ''}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:700, fontSize:13, color:'#1B3A2D' }}>{monthDay}</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>{days === 0 ? 'Today!' : `${days}d away`}</div>
        </div>
        <span style={{ background:colors.bg, border:`1px solid ${colors.border}`, color:colors.text, fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
          {days === 0 ? 'Today' : days <= 7 ? 'This week' : days <= 14 ? '2 weeks' : 'This month'}
        </span>
      </div>
    </div>
  );
}

export default function Celebrations() {
  const { data } = useApp();
  const employees = data.employees || [];

  // Collect upcoming birthdays (next 30 days)
  const upcomingBirthdays = employees
    .map(emp => {
      const info = birthdayInfo(emp.birthday);
      if (!info || info.days === null || info.days > 30) return null;
      return { ...emp, days: info.days, monthDay: info.monthDay, type: 'Birthday' };
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days);

  // Collect upcoming anniversaries (next 30 days)
  const upcomingAnniversaries = employees
    .map(emp => {
      const info = anniversaryInfo(emp.start_date);
      if (!info || info.days === null || info.days > 30) return null;
      return { ...emp, days: info.days, monthDay: info.monthDay, type: 'Work Anniversary', extra: `${info.years} yr${info.years !== 1 ? 's' : ''}` };
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days);

  const allUpcoming = [...upcomingBirthdays, ...upcomingAnniversaries].sort((a, b) => a.days - b.days);

  // Full calendar: all employees sorted by next occurrence
  const allBirthdays = employees
    .filter(e => e.birthday)
    .map(e => ({ ...e, info: birthdayInfo(e.birthday), type: 'Birthday' }))
    .filter(e => e.info)
    .sort((a, b) => a.info.days - b.info.days);

  const allAnniversaries = employees
    .filter(e => e.start_date)
    .map(e => ({ ...e, info: anniversaryInfo(e.start_date), type: 'Anniversary' }))
    .filter(e => e.info)
    .sort((a, b) => a.info.days - b.info.days);

  return (
    <div>
      {/* Alert section */}
      {allUpcoming.length > 0 && (
        <div className="alert-banner" style={{ marginBottom: 20 }}>
          <strong>{allUpcoming.length} upcoming event{allUpcoming.length > 1 ? 's' : ''} in the next 30 days</strong>
          {' — '}{allUpcoming.map(e => e.name).join(', ')}
        </div>
      )}

      {allUpcoming.length === 0 && (
        <div className="alert-banner" style={{ background:'#f9fafb', borderColor:'#e5e7eb', color:'#6b7280', marginBottom:20 }}>
          No birthdays or anniversaries in the next 30 days.
        </div>
      )}

      {/* Upcoming events */}
      {allUpcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            Coming Up — Next 30 Days
          </h3>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            {allUpcoming.map((e, i) => (
              <EventRow key={`${e.id}-${e.type}-${i}`} name={e.name} role={e.role} type={e.type} monthDay={e.monthDay} days={e.days} extra={e.extra} />
            ))}
          </div>
        </div>
      )}

      {/* Birthday calendar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>
        <div>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            All Birthdays
          </h3>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            {allBirthdays.length === 0 && <div className="empty-state">No birthdays on file. Add them in the Team tab.</div>}
            {allBirthdays.map((e, i) => (
              <EventRow key={`bday-${e.id}-${i}`} name={e.name} role={e.role} type="Birthday" monthDay={e.info.monthDay} days={e.info.days} />
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            Work Anniversaries
          </h3>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            {allAnniversaries.length === 0 && <div className="empty-state">No anniversaries on file. Add start dates in the Team tab.</div>}
            {allAnniversaries.map((e, i) => (
              <EventRow key={`ann-${e.id}-${i}`} name={e.name} role={e.role} type="Anniversary" monthDay={e.info.monthDay} days={e.info.days} extra={`${e.info.years} yr${e.info.years !== 1 ? 's' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Resend email note */}
      <div style={{ marginTop:28, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:16, fontSize:13, color:'#6b7280' }}>
        <strong style={{ color:'#374151' }}>Automated Alerts</strong>
        <p style={{ marginTop:4 }}>
          Email alerts via Resend can be set up to notify you automatically 7 days before each birthday and anniversary.
          Ask your developer to configure the Resend API key in Netlify environment variables — the alert logic is already built in.
        </p>
      </div>
    </div>
  );
}
