import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Trash2, X, Check, Clock } from 'lucide-react';
import { TabHeader } from './TabHeader';

const TYPES = ['Vacation','Sick','Personal','Other'];
const STATUS_COLORS = { Approved:'#16a34a', Pending:'#f59e0b', Denied:'#dc2626' };
const empty = { employeeId:'', type:'Vacation', dates:'', days:1, status:'Pending', notes:'' };

export default function TimeOff() {
  const { data, getEmployee, addTimeOff, updateTimeOff, deleteTimeOff, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const pending = (data.timeOff||[]).filter(t => t.status==='Pending');
  const save = () => { addTimeOff({ ...form, employeeId: parseInt(form.employeeId), days: parseInt(form.days) }); setModal(false); };
  const setStatus = (t, status) => updateTimeOff({ ...t, employeeId: t.employee_id, status });

  return (
    <div>
      {pending.length > 0 && (
        <div className="alert-banner" style={{ background:'#fffbeb', borderColor:'#f59e0b', color:'#92400e' }}>
          <Clock size={16} style={{ flexShrink:0 }} />
          <strong>{pending.length} request{pending.length>1?'s':''} pending approval</strong>
        </div>
      )}
      <TabHeader title="Time Off Requests" settings={<p style={{color:'#6b7280',fontSize:13}}>Approve or deny requests from the table below. Pending requests show as alerts on the tab badge.</p>}>
        <button className="btn-primary" onClick={() => { setForm(empty); setModal(true); }}><Plus size={16} /> Add Request</button>
      </TabHeader>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {(data.timeOff||[]).map(t => {
              const emp = getEmployee(t.employee_id);
              return (
                <tr key={t.id}>
                  <td><strong>{emp?.name||'—'}</strong></td>
                  <td>{t.type}</td>
                  <td>{t.dates}</td>
                  <td>{t.days}</td>
                  <td><span className="status-pill" style={{ background:(STATUS_COLORS[t.status]||'#6b7280')+'20', color:STATUS_COLORS[t.status]||'#6b7280', border:`1px solid ${(STATUS_COLORS[t.status]||'#6b7280')}40` }}>{t.status}</span></td>
                  <td style={{ color:'#6b7280', fontSize:13 }}>{t.notes}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {isAdmin && t.status==='Pending' && <>
                        <button className="btn-sm green" onClick={() => setStatus(t,'Approved')}>Approve</button>
                        <button className="btn-sm red" onClick={() => setStatus(t,'Denied')}>Deny</button>
                      </>}
                      {isAdmin && <button className="btn-icon danger" onClick={() => deleteTimeOff(t.id)}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data.timeOff||[]).length===0 && <div className="empty-state">No time off requests.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Time Off Request</h3><button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Type<select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label>Dates (e.g. Jul 2 – Jul 6)<input value={form.dates} onChange={e => setForm(f=>({...f,dates:e.target.value}))} /></label>
              <label>Days<input type="number" min="1" value={form.days} onChange={e => setForm(f=>({...f,days:e.target.value}))} /></label>
              <label>Status<select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>{['Pending','Approved','Denied'].map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Notes<input value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
