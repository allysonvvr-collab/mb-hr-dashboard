import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { TabHeader } from './TabHeader';

const empty = { employeeId:'', date:todaySA(), description:'', cost:'', status:'Open', docSigned:false };

export default function Incidents() {
  const { data, getEmployee, addIncident, updateIncident, deleteIncident, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (inc) => { setForm({ ...inc, employeeId: inc.employee_id, date: inc.incident_date, docSigned: inc.doc_signed }); setModal(inc); };
  const closeModal = () => setModal(null);
  const save = () => {
    const inc = { ...form, employeeId: parseInt(form.employeeId), cost: parseFloat(form.cost)||0 };
    if (modal==='add') addIncident(inc); else updateIncident(inc);
    closeModal();
  };

  const totalCost = (data.incidents||[]).reduce((sum,i) => sum + (Number(i.cost)||0), 0);
  const openCases = (data.incidents||[]).filter(i => i.status==='Open').length;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <div className="stat-card"><div className="stat-num">{(data.incidents||[]).length}</div><div className="stat-label">Total Cases</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'#f59e0b' }}>{openCases}</div><div className="stat-label">Open Cases</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'#dc2626' }}>${totalCost.toLocaleString()}</div><div className="stat-label">Total Cost</div></div>
      </div>
      <TabHeader title="Incident Log" settings={<p style={{color:'#6b7280',fontSize:13}}>Log all vehicle damage, property damage, or workplace incidents here. Mark doc_signed once the employee has signed the incident report.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Log Incident</button>}
      </TabHeader>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {(data.incidents||[]).map(inc => {
          const emp = getEmployee(inc.employee_id);
          return (
            <div key={inc.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                    <strong>{emp?.name||'—'}</strong>
                    <span style={{ color:'#6b7280', fontSize:13 }}>{inc.incident_date}</span>
                    <span style={{ color:'#dc2626', fontWeight:700 }}>${Number(inc.cost).toLocaleString()}</span>
                    <span className="status-pill" style={{ background:inc.status==='Closed'?'#dcfce7':'#fef3c7', color:inc.status==='Closed'?'#166534':'#92400e', border:`1px solid ${inc.status==='Closed'?'#86efac':'#fcd34d'}` }}>{inc.status}</span>
                  </div>
                  <div style={{ color:'#374151', fontSize:14, marginBottom:6 }}>{inc.description}</div>
                  <div style={{ fontSize:13 }}>
                    {inc.doc_signed ? <span style={{ color:'#16a34a' }}>✓ Documentation signed</span> : <span style={{ color:'#f59e0b' }}>⚠ Awaiting employee signature</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn-icon" onClick={() => openEdit(inc)}><Edit2 size={14} /></button>
                    <button className="btn-icon danger" onClick={() => deleteIncident(inc.id)}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(data.incidents||[]).length===0 && <div className="empty-state">No incidents on record.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Log Incident':'Edit Incident'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Date<input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></label>
              <label style={{ gridColumn:'1/-1' }}>Description<textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ padding:8, borderRadius:6, border:'1px solid #e5e7eb', fontSize:14, fontFamily:'inherit', width:'100%', boxSizing:'border-box' }} /></label>
              <label>Cost ($)<input type="number" value={form.cost} onChange={e => setForm(f=>({...f,cost:e.target.value}))} /></label>
              <label>Status<select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}><option>Open</option><option>Closed</option></select></label>
              <label style={{ display:'flex', alignItems:'center', gap:8, flexDirection:'row', gridColumn:'1/-1' }}>
                <input type="checkbox" checked={form.docSigned} onChange={e => setForm(f=>({...f,docSigned:e.target.checked}))} />
                Documentation Signed
              </label>
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
