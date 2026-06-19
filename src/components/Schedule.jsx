import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

// Fixed crew list — order matters, this is the row order shown
const CREWS = [
  { id: 'MC1', label: 'MC1' },
  { id: 'MC2', label: 'MC2' },
  { id: 'MC3', label: 'MC3' },
  { id: 'DOORHANGERS', label: 'Door Hangers' },
  { id: 'FWC1', label: 'FWC1' },
  { id: 'FWC2', label: 'FWC2' },
];

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Week runs Thursday through Wednesday, matching how the crew actually plans the week
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToThu = (day - 4 + 7) % 7; // days since most recent Thursday
  d.setDate(d.getDate() - diffToThu);
  return d;
}

function fmtCell(date) {
  const dow = DAY_NAMES[date.getDay()];
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const dd = String(date.getDate()).padStart(2,'0');
  return { dow, mmdd: `${mm}/${dd}`, key: `${date.getFullYear()}-${mm}-${dd}` };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function Schedule() {
  const { data, addScheduleEntry, removeScheduleEntry, isAdmin } = useApp();
  const [weekStart, setWeekStart] = useState(getWeekStart(todaySA()));
  const [picker, setPicker] = useState(null); // { crewId, dateKey, current: [id,id] }

  // Work week: Thu, Fri, Sat, Mon, Tue, Wed — Sunday is the day off, so it's skipped
  const days = useMemo(() => {
    const offsets = [0, 1, 2, 4, 5, 6]; // skip offset 3, which is Sunday when starting on Thursday
    return offsets.map(off => fmtCell(addDays(weekStart, off)));
  }, [weekStart]);

  // Only Crew Leaders and Crew Workers are eligible to be scheduled
  const eligible = (data.employees || [])
    .filter(e => e.role === 'Crew Leader' || e.role === 'Crew Worker')
    .sort((a,b) => a.name.localeCompare(b.name));

  const getEmployee = (id) => (data.employees || []).find(e => e.id === id);

  // schedule entries keyed by `${crewId}|${dateKey}` -> array of employee_id
  const scheduleMap = useMemo(() => {
    const map = {};
    (data.schedule || []).forEach(s => {
      const key = `${s.crew_id}|${s.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [data.schedule]);

  const openPicker = (crewId, dateKey) => {
    if (!isAdmin) return;
    const entries = scheduleMap[`${crewId}|${dateKey}`] || [];
    setPicker({ crewId, dateKey, current: entries.map(e => e.employee_id) });
  };

  const togglePerson = (empId) => {
    setPicker(p => {
      const has = p.current.includes(empId);
      if (has) return { ...p, current: p.current.filter(id => id !== empId) };
      if (p.current.length >= 2) return p; // max 2 per cell
      return { ...p, current: [...p.current, empId] };
    });
  };

  const savePicker = async () => {
    const { crewId, dateKey, current } = picker;
    const existing = scheduleMap[`${crewId}|${dateKey}`] || [];
    const existingIds = existing.map(e => e.employee_id);
    // Remove anyone unticked
    for (const entry of existing) {
      if (!current.includes(entry.employee_id)) await removeScheduleEntry(entry.id);
    }
    // Add anyone newly ticked
    for (const empId of current) {
      if (!existingIds.includes(empId)) await addScheduleEntry({ crewId, date: dateKey, employeeId: empId });
    }
    setPicker(null);
  };

  const weekLabel = `${days[0].mmdd} – ${days[5].mmdd}`;

  return (
    <div>
      <TabHeader title="Weekly Schedule" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Tap a cell to assign crew members for that day. Only Crew Leaders and Crew Workers can be scheduled. Week runs Thursday through Wednesday.</p>}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button className="btn-icon" onClick={()=>setWeekStart(w=>addDays(w,-7))}><ChevronLeft size={16}/></button>
          <span style={{ fontSize:13, fontWeight:700, color:'#1B3A2D', minWidth:120, textAlign:'center' }}>{weekLabel}</span>
          <button className="btn-icon" onClick={()=>setWeekStart(w=>addDays(w,7))}><ChevronRight size={16}/></button>
          <button className="btn-secondary" style={{ fontSize:12, padding:'6px 10px' }} onClick={()=>setWeekStart(getWeekStart(todaySA()))}>This Week</button>
        </div>
      </TabHeader>

      <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'10px 14px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:700, color:'#6b7280', position:'sticky', left:0, minWidth:110 }}>Crew</th>
              {days.map(d => (
                <th key={d.key} style={{ textAlign:'center', padding:'10px 8px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:700, color:'#374151', minWidth:110 }}>
                  <div>{d.dow}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{d.mmdd}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CREWS.map((crew, ri) => (
              <tr key={crew.id} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding:'10px 14px', fontWeight:700, fontSize:13, color:'#1B3A2D', borderBottom:'1px solid #f3f4f6', position:'sticky', left:0, background:'inherit' }}>
                  {crew.label}
                </td>
                {days.map(d => {
                  const entries = scheduleMap[`${crew.id}|${d.key}`] || [];
                  return (
                    <td key={d.key} onClick={()=>openPicker(crew.id, d.key)}
                      style={{ padding:'8px', textAlign:'center', borderBottom:'1px solid #f3f4f6', cursor:isAdmin?'pointer':'default', verticalAlign:'middle' }}>
                      {entries.length === 0 ? (
                        <span style={{ color:'#d1d5db', fontSize:12 }}>{isAdmin ? '+ Assign' : '—'}</span>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                          {entries.map(entry => {
                            const emp = getEmployee(entry.employee_id);
                            return (
                              <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:5, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'2px 8px 2px 2px' }}>
                                <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={20} />
                                <span style={{ fontSize:12, fontWeight:600, color:'#166534', whiteSpace:'nowrap' }}>{emp?.name?.split(' ')[0] || '—'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assignment picker modal */}
      {picker && (
        <div className="modal-overlay" onClick={()=>setPicker(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{CREWS.find(c=>c.id===picker.crewId)?.label} · {days.find(d=>d.key===picker.dateKey)?.dow} {days.find(d=>d.key===picker.dateKey)?.mmdd}</h3>
              <button className="btn-icon" onClick={()=>setPicker(null)}><X size={18}/></button>
            </div>
            <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 10px' }}>Select up to 2 people for this crew on this day.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:320, overflowY:'auto' }}>
              {eligible.map(emp => {
                const checked = picker.current.includes(emp.id);
                const disabled = !checked && picker.current.length >= 2;
                return (
                  <div key={emp.id} onClick={()=>!disabled && togglePerson(emp.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:disabled?'default':'pointer', background:checked?'#f0fdf4':'transparent', opacity:disabled?0.4:1, border:checked?'1px solid #bbf7d0':'1px solid transparent' }}>
                    <span style={{
                      width:18, height:18, borderRadius:5, flexShrink:0,
                      border: checked ? '2px solid #1B3A2D' : '2px solid #d1d5db',
                      background: checked ? '#1B3A2D' : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
                    </span>
                    <Avatar name={emp.name} photoUrl={emp.photo_url} size={28} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{emp.name}</div>
                      <div style={{ fontSize:11, color:'#6b7280' }}>{emp.role}</div>
                    </div>
                  </div>
                );
              })}
              {eligible.length === 0 && <div className="empty-state">No Crew Leaders or Crew Workers on file yet. Add them in the Team tab.</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setPicker(null)}>Cancel</button>
              <button className="btn-primary" onClick={savePicker}><Check size={15}/> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
