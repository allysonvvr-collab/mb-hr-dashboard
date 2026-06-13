import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { TabHeader } from './TabHeader';

const CERT_NAMES = ['OSHA 10','OSHA 30','Pesticide Applicator License','QuickBooks Certified','First Aid/CPR',"Driver's License",'CDL'];
const STATUSES = ['Active','Expired','In Progress','Pending Renewal'];
const STATUS_COLORS = { Active:'#16a34a', Expired:'#dc2626', 'In Progress':'#3b82f6', 'Pending Renewal':'#f59e0b' };
const empty = { employeeId:'', name:'OSHA 10', earned:'', expires:'', status:'Active' };

export default function Certifications() {
  const { data, getEmployee, addCertification, updateCertification, deleteCertification, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c, employeeId: c.employee_id, earned: c.earned_date||'', expires: c.expires_date||'' }); setModal(c); };
  const closeModal = () => setModal(null);
  const save = () => {
    const c = { ...form, employeeId: parseInt(form.employeeId) };
    if (modal==='add') addCertification(c); else updateCertification(c);
    closeModal();
  };

  return (
    <div>
      <TabHeader title="Certifications" settings={<p style={{color:'#6b7280',fontSize:13}}>Track OSHA, pesticide licenses, and other certifications. Expired certs are flagged automatically. Coverage by employee is shown below the table.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Certification</button>}
      </TabHeader>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Certification</th><th>Earned</th><th>Expires</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {(data.certifications||[]).map(c => {
              const emp = getEmployee(c.employee_id);
              return (
                <tr key={c.id}>
                  <td><strong>{emp?.name||'—'}</strong></td>
                  <td>{c.name}</td>
                  <td style={{ fontSize:13, color:'#6b7280' }}>{c.earned_date||'—'}</td>
                  <td style={{ fontSize:13, color:'#6b7280' }}>{c.expires_date||'No expiry'}</td>
                  <td><span className="status-pill" style={{ background:(STATUS_COLORS[c.status]||'#6b7280')+'20', color:STATUS_COLORS[c.status]||'#6b7280', border:`1px solid ${(STATUS_COLORS[c.status]||'#6b7280')}40` }}>{c.status}</span></td>
                  {isAdmin && <td><div style={{ display:'flex', gap:6 }}><button className="btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button><button className="btn-icon danger" onClick={() => deleteCertification(c.id)}><Trash2 size={14} /></button></div></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data.certifications||[]).length===0 && <div className="empty-state">No certifications on file.</div>}
      </div>
      <h3 style={{ marginTop:32, marginBottom:12, fontSize:14, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.05em' }}>Coverage by Employee</h3>
      <div className="card-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {(data.employees||[]).map(emp => {
          const certs = (data.certifications||[]).filter(c => c.employee_id===emp.id);
          return (
            <div key={emp.id} className="emp-card" style={{ padding:'14px 16px' }}>
              <div style={{ fontWeight:700, marginBottom:2 }}>{emp.name}</div>
              <div style={{ color:'#6b7280', fontSize:12, marginBottom:8 }}>{emp.role}</div>
              {certs.length===0 ? <div style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic' }}>No certs on file</div>
                : certs.map(c => <div key={c.id} style={{ fontSize:13, display:'flex', alignItems:'center', gap:4, marginBottom:2 }}><span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_COLORS[c.status]||'#6b7280', display:'inline-block', flexShrink:0 }} /><span style={{ color:STATUS_COLORS[c.status]||'#6b7280' }}>{c.name}</span></div>)
              }
            </div>
          );
        })}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Add Certification':'Edit Certification'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Certification<select value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}>{CERT_NAMES.map(n=><option key={n}>{n}</option>)}</select></label>
              <label>Date Earned<input type="date" value={form.earned} onChange={e => setForm(f=>({...f,earned:e.target.value}))} /></label>
              <label>Expiry (blank if none)<input type="date" value={form.expires} onChange={e => setForm(f=>({...f,expires:e.target.value}))} /></label>
              <label>Status<select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
