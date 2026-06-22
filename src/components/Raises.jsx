import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, X, Check, TrendingUp } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', date:todaySA(), previous:'', newRate:'', increase:'', reason:'' };

export default function Raises() {
  const { data, getEmployee, addRaise, deleteRaise, isAdmin } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(empty);
  const [saveError, setSaveError] = useState('');

  const calcInc = (f) => { const p=parseFloat(f.previous),n=parseFloat(f.newRate); return (!isNaN(p)&&!isNaN(n))?(n-p).toFixed(2):''; };
  const save = async () => {
    try {
      await addRaise({ ...form, employeeId:parseInt(form.employeeId), previous:parseFloat(form.previous), newRate:parseFloat(form.newRate), increase:parseFloat(form.increase) });
      setModal(false);
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  return (
    <div>
      <div className="alert-banner" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#166534' }}>
        <TrendingUp size={15} style={{ flexShrink:0 }} />
        <div>
          <strong>Annual Raise Window — End of June</strong>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:5 }}>
            {(data.employees||[]).filter(e=>e.role!=='Owner').map(e=>(
              <span key={e.id} style={{ background:'#dcfce7', padding:'2px 8px', borderRadius:20, fontSize:11, color:'#166534', border:'1px solid #86efac', whiteSpace:'nowrap' }}>
                {e.name.split(' ')[0]} · ${Number(e.wage||0).toFixed(2)}/hr
              </span>
            ))}
          </div>
        </div>
      </div>

      <TabHeader title="Raise History" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Log raises here to keep a permanent history tied to each employee.</p>}>
        {isAdmin && <button className="btn-primary" onClick={()=>{ setForm(empty); setModal(true); }}><Plus size={15}/> Add Raise</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(data.raises||[]).map(r => {
          const emp = getEmployee(r.employee_id);
          return (
            <div key={r.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={32} />
                    <span style={{ fontWeight:700, fontSize:14 }}>{emp?.name||'—'}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{formatDateSA(r.raise_date)}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, color:'#6b7280' }}>${Number(r.previous_rate).toFixed(2)}</span>
                    <span style={{ color:'#9ca3af' }}>→</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'#1B3A2D' }}>${Number(r.new_rate).toFixed(2)}/hr</span>
                    <span style={{ background:'#dcfce7', color:'#166534', fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>+${Number(r.increase).toFixed(2)}</span>
                  </div>
                  {r.reason && <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{r.reason}</div>}
                </div>
                {isAdmin && <button className="btn-icon danger" onClick={()=>deleteRaise(r.id)}><Trash2 size={13}/></button>}
              </div>
            </div>
          );
        })}
        {(data.raises||[]).length===0 && <EmptyState icon={TrendingUp} message="No raises recorded yet." />}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Add Raise</h3><button className="btn-icon" onClick={()=>{ setModal(false); setSaveError(''); }}><X size={18}/></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee
                <select style={inp} value={form.employeeId} onChange={e => {
                  const emp = (data.employees||[]).find(x=>String(x.id)===e.target.value);
                  const currentWage = emp ? String(emp.wage||0) : '';
                  setForm(f => ({ ...f, employeeId:e.target.value, previous:currentWage, increase:'' }));
                }}>
                  <option value="">Select...</option>
                  {(data.employees||[]).filter(e=>e.role!=='Owner').map(e=><option key={e.id} value={e.id}>{e.name} (${Number(e.wage||0).toFixed(2)}/hr)</option>)}
                </select>
              </label>
              <label>Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></label>
              <label>Previous Rate ($)<input style={inp} type="number" step="0.25" value={form.previous} onChange={e=>setForm(f=>({...f,previous:e.target.value,increase:calcInc({...f,previous:e.target.value})}))} /></label>
              <label>New Rate ($)<input style={inp} type="number" step="0.25" value={form.newRate} onChange={e=>setForm(f=>({...f,newRate:e.target.value,increase:calcInc({...f,newRate:e.target.value})}))} /></label>
              <label>Increase ($)<input style={{ ...inp, background:'#f9fafb' }} type="number" value={form.increase} readOnly /></label>
              <label style={{ gridColumn:'1/-1' }}>Reason<input style={inp} value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Annual raise" /></label>
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
