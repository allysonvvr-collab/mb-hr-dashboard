import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import {
  daysUntilBirthday, formatBirthdayShort,
  daysUntilAnniversary, formatAnniversaryShort, anniversaryYears
} from '../lib/timezone';

function urgencyColor(days) {
  if (days === 0)  return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
  if (days <= 3)   return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
  if (days <= 7)   return { bg: '#fef3c7', border: '#fde68a', text: '#d97706' };
  if (days <= 30)  return { bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
  if (days <= 90)  return { bg: '#f0fdf4', border: '#86efac', text: '#166534' };
  return { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' };
}

function urgencyLabel(days) {
  if (days === 0)  return 'Today!';
  if (days === 1)  return 'Tomorrow';
  if (days <= 30)  return `${days}d away`;
  if (days <= 60)  return `~${Math.ceil(days/7)}wk away`;
  if (days <= 365) return `${Math.ceil(days/30)}mo away`;
  return `${Math.ceil(days/365)}yr away`;
}

function EventRow({ name, role, type, monthDay, days, extra, photoUrl }) {
  const colors = urgencyColor(days);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #f3f4f6' }}>
      <Avatar name={name} photoUrl={photoUrl} size={38} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
        <div style={{ color:'#6b7280', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{role} · {type}{extra ? ` · ${extra}` : ''}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#1B3A2D', whiteSpace:'nowrap' }}>{monthDay}</div>
        <span style={{ background:colors.bg, border:`1px solid ${colors.border}`, color:colors.text, fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, whiteSpace:'nowrap' }}>
          {urgencyLabel(days)}
        </span>
      </div>
    </div>
  );
}

export default function Celebrations() {
  const { data } = useApp();
  const employees = data.employees || [];

  // Birthdays — works whether birthday is a real YYYY-MM-DD date or a legacy "Jul 21" string
  const allBirthdays = employees
    .filter(e => e.birthday)
    .map(e => {
      const days = daysUntilBirthday(e.birthday);
      if (days === null) return null;
      return { ...e, days, monthDay: formatBirthdayShort(e.birthday), type: 'Birthday' };
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days);

  // Anniversaries — based on real start_date
  const allAnniversaries = employees
    .filter(e => e.start_date)
    .map(e => {
      const days = daysUntilAnniversary(e.start_date);
      if (days === null) return null;
      const years = anniversaryYears(e.start_date);
      return { ...e, days, monthDay: formatAnniversaryShort(e.start_date), years, type: 'Work Anniversary' };
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days);

  const upcomingBirthdays = allBirthdays.filter(e => e.days <= 30);
  const upcomingAnniversaries = allAnniversaries.filter(e => e.days <= 30);
  const allUpcoming = [...upcomingBirthdays, ...upcomingAnniversaries].sort((a, b) => a.days - b.days);

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
              <EventRow key={`${e.id}-${e.type}-${i}`} name={e.name} role={e.role} type={e.type} monthDay={e.monthDay} days={e.days}
                extra={e.type === 'Work Anniversary' ? `${e.years} yr${e.years !== 1 ? 's' : ''}` : undefined} photoUrl={e.photo_url} />
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
              <EventRow key={`bday-${e.id}-${i}`} name={e.name} role={e.role} type="Birthday" monthDay={e.monthDay} days={e.days} photoUrl={e.photo_url} />
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
              <EventRow key={`ann-${e.id}-${i}`} name={e.name} role={e.role} type="Anniversary" monthDay={e.monthDay} days={e.days} extra={`${e.years} yr${e.years !== 1 ? 's' : ''}`} photoUrl={e.photo_url} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
