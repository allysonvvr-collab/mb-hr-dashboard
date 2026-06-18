import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, X, Check, Clock } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const TYPES = ['Vacation','Sick','Personal','Other'];
const DURATIONS = ['Full Day','Half Day'];
const STATUS_COLORS = { Approved:'#16a34a', Pending:'#f59e0b', Denied:'#dc2626' };
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', type:'Vacation', duration:'Full Day', startDate:todaySA(), endDate:todaySA(), days:1, status:'Pending', notes:'' };

// Inclusive day count between two YYYY-MM-DD strings
function calcDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

// Build the display string: "06/19/2026" or "07/02/2026 – 07/06/2026"
function formatRange(start, end) {
  if (!start) return '—';
  if (!end || end === start) return formatDateSA(start);
  return `${formatDateSA(start)} – ${formatDateSA(end)}`;
}

export default function TimeOff() {
  const { data, getEmployee, addTimeOff, updateTimeOff, deleteTimeOff, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(empty);

  const pending = (data.timeOff||[]).filter(t => t.status==='Pending');

  const handleDurationChange = (val) => {
    setForm(f => {
      const next = { ...f, duration: val };
      if (val === 'Half Day') {
        next.endDate = f.startDate;
        next.days = 0.5;
      } else {
        next.days = calcDays(f.startDate, f.endDate || f.startDate);
      }
      return next;
    });
  };

  const handleStartDate = (val) => {
    setForm(f => {
      const next = { ...f, startDate: val };
      if (f.duration === 'Half Day') {
        next.endDate = val;
        next.days = 0.5;
      } else {
        if (!f.endDate || f.endDate < val) next.endDate = val;
        next.days = calcDays(val, next.endDate);
      }
      return next;
    });
  };

  const handleEndDate = (val) => {
    setForm(f => ({ ...f, endDate: val, days: calcDays(f.startDate, val) }));
  };

  const save = () => {
    addTimeOff({
      ...form,
      employeeId: parseInt(form.employeeId),
      dates: formatRange(form.startDate, form.duration === 'Half Day' ? form.startDate : form.endDate),
      days: form.duration === 'Half Day' ? 0.5 : calcDays(form.startDate, form.endDate)
    });
    setModal(false);
  };

  const setStatus = (t, status) => updateTimeOff({ ...t, employeeId:t.employee_id, status });

  return (
    <div>
      {pending.length > 0 && (
        <div className="alert-banner" style={{ background:'#fffbeb', borderColor:'#f59e0b', color:'#92400e' }}>
          <Clock size={15} style={{ flexShrink:0 }} />
          <strong>{pending.length} request{pending.length>1?'s':''} pending approval</strong>
        </div>
      )}

      <TabHeader title="Time Off" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Approve or deny requests below. Pending requests show a badge on the tab.</p>}>
        <button className="btn-primary" onClick={()=>{ setForm(empty); setModal(true); }}><Plus size={15}/> Add Request</button>
      </TabHeader>

      {/* Mobile-friendly cards instead of table */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(data.timeOff||[]).map(t => {
          const emp = getEmployee(t.employee_id);
          const sc = STATUS_COLORS[t.status]||'#6b7280';
          const daysLabel = t.days === 0.5 ? 'Half Day' : `${t.days} day${t.days>1?'s':''}`;
          return (
            <div key={t.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                    <span style={{ background:sc+'18', color:sc, border:`1px solid ${sc}40`, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{t.status}</span>
                    {t.duration === 'Half Day' && (
                      <span style={{ background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>Half Day</span>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:'#374151', marginBottom:2 }}>
                    {t.type} · {t.start_date ? formatRange(t.start_date, t.end_date) : t.dates} · {daysLabel}
                  </div>
                  {t.notes && t.notes!=='—' && <div style={{ fontSize:12, color:'#6b7280' }}>{t.notes}</div>}
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  {isAdmin && t.status==='Pending' && (
                    <>
                      <button className="btn-sm green" onClick={()=>setStatus(t,'Approved')}>Approve</button>
                      <button className="btn-sm red" onClick={()=>setStatus(t,'Denied')}>Deny</button>
                    </>
                  )}
                  {isAdmin && <button className="btn-icon danger" onClick={()=>deleteTimeOff(t.id)}><Trash2 size={13}/></button>}
                </div>
              </div>
            </div>
          );
        })}
        {(data.timeOff||[]).length===0 && <div className="empty-state">No time off requests.</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Add Time Off Request</h3><button className="btn-icon" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select...</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Type<select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label>Duration<select style={inp} value={form.duration} onChange={e=>handleDurationChange(e.target.value)}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></label>
              <label>Start Date<input style={inp} type="date" value={form.startDate} onChange={e=>handleStartDate(e.target.value)} /></label>
              {form.duration === 'Full Day' && (
                <label>End Date<input style={inp} type="date" value={form.endDate} min={form.startDate} onChange={e=>handleEndDate(e.target.value)} /></label>
              )}
              <label>Days<input style={inp} type="number" min="0.5" step="0.5" value={form.days} disabled style={{ ...inp, background:'#f9fafb' }} /></label>
              <label>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{['Pending','Approved','Denied'].map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Notes<input style={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional" /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={15}/> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
