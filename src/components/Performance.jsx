import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { TabHeader } from './TabHeader';
const empty = { employeeId:'', month:'', jobsCompleted:'', complaints:0, rating:4 };
export default function Performance() {
  const { data, getEmployee, addPerformance, deletePerformance, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saveError, setSaveError] = useState('');
  const save = async () => {
    try {
      await addPerformance({ ...form, employeeId:parseInt(form.employeeId), jobsCompleted:parseInt(form.jobsCompleted), complaints:parseInt(form.complaints), rating:parseInt(form.rating) });
      setModal(false);
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };
  const ratingColor = (r) => r>=4?'#16a34a':r===3?'#f59e0b':'#dc2626';
  return (
    <div>
      <TabHeader title="Monthly Performance" settings={<p style={{color:'#6b7280',fontSize:13}}>Log monthly jobs completed, complaints received, and overall rating per employee. Use this to track trends over time.</p>}>
        {isAdmin && <button className="btn-primary" onClick={() => { setForm(empty); setModal(true); }}><Plus size={16} /> Add Entry</button>}
      </TabHeader>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Month</th><th>Jobs Done</th><th>Complaints</th><th>Rating</th>{isAdmin&&<th></th>}</tr></thead>
          <tbody>
            {(data.performance||[]).map(p => {
              const emp = getEmployee(p.employee_id);
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={30} />
                      <div><div style={{ fontWeight:600 }}>{emp?.name||'—'}</div><div style={{ fontSize:11, color:'#6b7280' }}>{emp?.role}</div></div>
                    </div>
                  </td>
                  <td>{p.month}</td>
                  <td style={{ fontWeight:600 }}>{p.jobs_completed}</td>
                  <td style={{ color:p.complaints>0?'#dc2626':'#16a34a', fontWeight:600 }}>{p.complaints}</td>
                  <td><span style={{ background:ratingColor(p.rating)+'20', color:ratingColor(p.rating), padding:'2px 10px', borderRadius:20, fontWeight:700, fontSize:13 }}>{p.rating}/5</span></td>
                  {isAdmin&&<td><button className="btn-icon danger" onClick={() => deletePerformance(p.id)}><Trash2 size={14} /></button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data.performance||[]).length===0 && <div className="empty-state">No performance records yet.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Performance Entry</h3><button className="btn-icon" onClick={() => { setModal(false); setSaveError(''); }}><X size={18} /></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Month (e.g. May 2026)<input value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))} /></label>
              <label>Jobs Completed<input type="number" value={form.jobsCompleted} onChange={e => setForm(f=>({...f,jobsCompleted:e.target.value}))} /></label>
              <label>Complaints<input type="number" min="0" value={form.complaints} onChange={e => setForm(f=>({...f,complaints:e.target.value}))} /></label>
              <label>Rating (1–5)<input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(f=>({...f,rating:e.target.value}))} /></label>
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
