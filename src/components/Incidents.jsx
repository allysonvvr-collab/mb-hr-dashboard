import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', date:todaySA(), description:'', cost:'', status:'Open', docSigned:false };

export default function Incidents() {
  const { data, getEmployee, addIncident, updateIncident, deleteIncident, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(empty);

  const openAdd  = () => { setForm(empty); setModal('add'); };
  const openEdit = (i) => { setForm({ ...i, employeeId:i.employee_id, date:i.incident_date, docSigned:i.doc_signed }); setModal(i); };
  const closeModal = () => setModal(null);
  const save = () => { const i={...form,employeeId:parseInt(form.employeeId),cost:parseFloat(form.cost)||0}; if(modal==='add') addIncident(i); else updateIncident(i); closeModal(); };

  const total = (data.incidents||[]).reduce((s,i)=>s+Number(i.cost||0),0);
  const open  = (data.incidents||[]).filter(i=>i.status==='Open').length;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        <div className="stat-card"><div className="stat-num">{(data.incidents||[]).length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'#f59e0b' }}>{open}</div><div className="stat-label">Open</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'#dc2626', fontSize:20 }}>${total.toLocaleString()}</div><div className="stat-label">Cost</div></div>
      </div>

      <TabHeader title="Incident Log" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Log vehicle damage, property damage, or workplace incidents. Mark doc signed once employee signs the report.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Log Incident</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(data.incidents||[]).map(inc => {
          const emp = getEmployee(inc.employee_id);
          return (
            <div key={inc.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                    <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                    <span style={{ fontSize:12, color:'#6b7280' }}>{inc.incident_date}</span>
                    <span style={{ fontWeight:700, color:'#dc2626', fontSize:13 }}>${Number(inc.cost).toLocaleString()}</span>
                    <span style={{ background:inc.status==='Closed'?'#dcfce7':'#fef3c7', color:inc.status==='Closed'?'#166534':'#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{inc.status}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#374151', marginBottom:4 }}>{inc.description}</div>
                  <div style={{ fontSize:12, color:inc.doc_signed?'#16a34a':'#f59e0b', fontWeight:600 }}>
                    {inc.doc_signed ? 'Documentation signed' : 'Awaiting employee signature'}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(inc)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deleteIncident(inc.id)}><Trash2 size={13}/></button>
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
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Log Incident':'Edit Incident'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select...</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></label>
              <label style={{ gridColumn:'1/-1' }}>Description<textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} /></label>
              <label>Cost ($)<input style={inp} type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} /></label>
              <label>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Open</option><option>Closed</option></select></label>
              <label style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:10, gridColumn:'1/-1' }}>
                <input type="checkbox" checked={form.docSigned} onChange={e=>setForm(f=>({...f,docSigned:e.target.checked}))} style={{ width:18, height:18 }} />
                <span>Documentation Signed</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={15}/> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
