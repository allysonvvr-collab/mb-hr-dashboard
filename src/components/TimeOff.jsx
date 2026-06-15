import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, X, Check, Clock } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const TYPES = ['Vacation','Sick','Personal','Other'];
const STATUS_COLORS = { Approved:'#16a34a', Pending:'#f59e0b', Denied:'#dc2626' };
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', type:'Vacation', dates:'', days:1, status:'Pending', notes:'' };

export default function TimeOff() {
  const { data, getEmployee, addTimeOff, updateTimeOff, deleteTimeOff, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(empty);

  const pending = (data.timeOff||[]).filter(t => t.status==='Pending');
  const save = () => { addTimeOff({ ...form, employeeId:parseInt(form.employeeId), days:parseInt(form.days) }); setModal(false); };
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
          return (
            <div key={t.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                    <span style={{ background:sc+'18', color:sc, border:`1px solid ${sc}40`, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#374151', marginBottom:2 }}>{t.type} · {t.dates} · {t.days} day{t.days>1?'s':''}</div>
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
              <label>Dates (e.g. Jul 2 – Jul 6)<input style={inp} value={form.dates} onChange={e=>setForm(f=>({...f,dates:e.target.value}))} placeholder="Jul 2 – Jul 6" /></label>
              <label>Days<input style={inp} type="number" min="1" value={form.days} onChange={e=>setForm(f=>({...f,days:e.target.value}))} /></label>
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
