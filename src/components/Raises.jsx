import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Trash2, X, Check, TrendingUp } from 'lucide-react';
import { TabHeader } from './TabHeader';

const empty = { employeeId:'', date:todaySA(), previous:'', newRate:'', increase:'', reason:'' };

export default function Raises() {
  const { data, getEmployee, addRaise, deleteRaise, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const calcIncrease = (f) => {
    const p = parseFloat(f.previous), n = parseFloat(f.newRate);
    return (!isNaN(p) && !isNaN(n)) ? (n - p).toFixed(2) : '';
  };
  const save = () => { addRaise({ ...form, employeeId: parseInt(form.employeeId), previous: parseFloat(form.previous), newRate: parseFloat(form.newRate), increase: parseFloat(form.increase) }); setModal(false); };

  return (
    <div>
      <div className="alert-banner" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#166534' }}>
        <TrendingUp size={16} style={{ flexShrink:0 }} />
        <div>
          <strong>Annual Raise Window — End of June (review all employees)</strong>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
            {(data.employees||[]).map(emp => (
              <span key={emp.id} style={{ background:'#dcfce7', padding:'2px 10px', borderRadius:20, fontSize:13, color:'#166534', border:'1px solid #86efac' }}>{emp.name} · ${Number(emp.wage).toFixed(2)}/hr</span>
            ))}
          </div>
        </div>
      </div>
      <TabHeader title="Raise History" settings={<p style={{color:'#6b7280',fontSize:13}}>Log raises here to keep a permanent history. The Annual Raise Window reminder shows current wages for all employees.</p>}>
        {isAdmin && <button className="btn-primary" onClick={() => { setForm(empty); setModal(true); }}><Plus size={16} /> Add Raise</button>}
      </TabHeader>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Date</th><th>Previous</th><th>New Rate</th><th>Increase</th><th>Reason</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {(data.raises||[]).map(r => {
              const emp = getEmployee(r.employee_id);
              return (
                <tr key={r.id}>
                  <td><strong>{emp?.name||'—'}</strong></td>
                  <td style={{ color:'#6b7280', fontSize:13 }}>{r.raise_date}</td>
                  <td>${Number(r.previous_rate).toFixed(2)}</td>
                  <td style={{ color:'#2d6a1f', fontWeight:700 }}>${Number(r.new_rate).toFixed(2)}</td>
                  <td style={{ color:'#16a34a', fontWeight:700 }}>+${Number(r.increase).toFixed(2)}</td>
                  <td style={{ color:'#6b7280', fontSize:13 }}>{r.reason}</td>
                  {isAdmin && <td><button className="btn-icon danger" onClick={() => deleteRaise(r.id)}><Trash2 size={14} /></button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data.raises||[]).length===0 && <div className="empty-state">No raises recorded yet.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Raise</h3><button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name} (${Number(e.wage).toFixed(2)}/hr)</option>)}</select></label>
              <label>Date<input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></label>
              <label>Previous Rate ($)<input type="number" step="0.25" value={form.previous} onChange={e => setForm(f=>({...f,previous:e.target.value,increase:calcIncrease({...f,previous:e.target.value})}))} /></label>
              <label>New Rate ($)<input type="number" step="0.25" value={form.newRate} onChange={e => setForm(f=>({...f,newRate:e.target.value,increase:calcIncrease({...f,newRate:e.target.value})}))} /></label>
              <label>Increase ($)<input type="number" step="0.25" value={form.increase} readOnly style={{ background:'#f9fafb' }} /></label>
              <label style={{ gridColumn:'1/-1' }}>Reason<input value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))} /></label>
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
