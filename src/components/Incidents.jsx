import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp, AlertTriangle, DollarSign, User } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', date:todaySA(), description:'', cost:'', status:'Open', docSigned:false };

function EmployeeSummaryCard({ emp, incidents, onViewAll }) {
  const total = incidents.reduce((s,i) => s + Number(i.cost||0), 0);
  const open  = incidents.filter(i => i.status==='Open').length;
  const hasOpen = open > 0;

  return (
    <div className="emp-card" style={{ cursor:'pointer', borderLeft:`3px solid ${hasOpen?'#f59e0b':'#e5e7eb'}` }} onClick={onViewAll}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Avatar name={emp.name} photoUrl={emp.photo_url} size={38} />
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>{emp.name}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:800, color: total>0?'#dc2626':'#9ca3af', fontFamily:'Manrope,sans-serif' }}>
            ${total.toLocaleString()}
          </div>
          <div style={{ fontSize:11, color:'#6b7280' }}>total cost</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
        <span style={{ background:'#f3f4f6', color:'#374151', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
          {incidents.length} incident{incidents.length!==1?'s':''}
        </span>
        {open > 0 && (
          <span style={{ background:'#fef3c7', color:'#92400e', fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
            {open} open
          </span>
        )}
        {incidents.filter(i=>!i.doc_signed).length > 0 && (
          <span style={{ background:'#fef2f2', color:'#dc2626', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
            {incidents.filter(i=>!i.doc_signed).length} unsigned
          </span>
        )}
        {incidents.length > 0 && open === 0 && (
          <span style={{ background:'#f0fdf4', color:'#166534', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
            All closed
          </span>
        )}
      </div>

      {incidents.length > 0 && (
        <div style={{ marginTop:8, fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}>
          <span>Tap to view details</span>
        </div>
      )}
    </div>
  );
}

export default function Incidents() {
  const { data, getEmployee, addIncident, updateIncident, deleteIncident, isAdmin } = useApp();
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(empty);
  const [view, setView]         = useState('summary'); // 'summary' | 'all'
  const [selectedEmp, setSelectedEmp] = useState(null); // employee id to drill into

  const openAdd  = () => { setForm(empty); setModal('add'); };
  const openEdit = (i) => { setForm({ ...i, employeeId:i.employee_id, date:i.incident_date, docSigned:i.doc_signed }); setModal(i); };
  const closeModal = () => setModal(null);
  const save = () => {
    const i = { ...form, employeeId:parseInt(form.employeeId), cost:parseFloat(form.cost)||0 };
    if (modal==='add') addIncident(i); else updateIncident(i);
    closeModal();
  };

  const allIncidents = data.incidents || [];
  const total = allIncidents.reduce((s,i) => s + Number(i.cost||0), 0);
  const open  = allIncidents.filter(i => i.status==='Open').length;

  // Group incidents by employee
  const byEmployee = (data.employees||[])
    .map(emp => ({ emp, incidents: allIncidents.filter(i => i.employee_id === emp.id) }))
    .filter(x => x.incidents.length > 0)
    .sort((a,b) => b.incidents.reduce((s,i)=>s+Number(i.cost||0),0) - a.incidents.reduce((s,i)=>s+Number(i.cost||0),0));

  // Displayed incidents (all or filtered by employee)
  const displayedIncidents = selectedEmp
    ? allIncidents.filter(i => i.employee_id === selectedEmp)
    : allIncidents;

  const selectedEmpObj = selectedEmp ? (data.employees||[]).find(e => e.id === selectedEmp) : null;

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        <div className="stat-card">
          <div className="stat-num">{allIncidents.length}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'#f59e0b' }}>{open}</div>
          <div className="stat-label">Open Cases</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>Total Cost</div>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#dc2626', lineHeight:1 }}>${total.toLocaleString()}</div>
        </div>
      </div>

      <TabHeader title="Incident Log" settings={
        <div style={{ fontSize:13, color:'#6b7280' }}>
          <p>Log all vehicle damage, property damage, or workplace incidents.</p>
          <p style={{ marginTop:8 }}>Use <strong>Summary View</strong> to see totals per employee at a glance. Use <strong>All Incidents</strong> to see the full log.</p>
        </div>
      }>
        {/* View toggle */}
        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:8, padding:2, gap:2 }}>
          <button onClick={()=>{ setView('summary'); setSelectedEmp(null); }}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:view==='summary'?'#fff':'none', color:view==='summary'?'#1B3A2D':'#6b7280', boxShadow:view==='summary'?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
            By Employee
          </button>
          <button onClick={()=>{ setView('all'); setSelectedEmp(null); }}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:view==='all'?'#fff':'none', color:view==='all'?'#1B3A2D':'#6b7280', boxShadow:view==='all'?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
            All Incidents
          </button>
        </div>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Log Incident</button>}
      </TabHeader>

      {/* Summary View */}
      {view === 'summary' && !selectedEmp && (
        <div>
          {byEmployee.length === 0 && <div className="empty-state">No incidents on record yet.</div>}
          <div className="card-grid">
            {byEmployee.map(({ emp, incidents }) => (
              <EmployeeSummaryCard key={emp.id} emp={emp} incidents={incidents}
                onViewAll={() => { setSelectedEmp(emp.id); setView('all'); }} />
            ))}
          </div>

          {/* Employees with zero incidents */}
          {(data.employees||[]).filter(e => !allIncidents.find(i=>i.employee_id===e.id)).length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>No Incidents</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(data.employees||[])
                  .filter(e => !allIncidents.find(i=>i.employee_id===e.id))
                  .map(e => (
                    <span key={e.id} style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#166534', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>
                      {e.name}
                    </span>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Incidents / Filtered View */}
      {view === 'all' && (
        <div>
          {/* Breadcrumb if filtered */}
          {selectedEmp && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb' }}>
              <button onClick={()=>{ setSelectedEmp(null); setView('summary'); }}
                style={{ background:'none', border:'none', color:'#1B3A2D', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>
                All Employees
              </button>
              <span style={{ color:'#9ca3af' }}>›</span>
              <span style={{ fontSize:13, fontWeight:700 }}>{selectedEmpObj?.name}</span>
              <span style={{ marginLeft:'auto', fontSize:12, color:'#6b7280' }}>
                {displayedIncidents.length} incident{displayedIncidents.length!==1?'s':''} · 
                ${displayedIncidents.reduce((s,i)=>s+Number(i.cost||0),0).toLocaleString()} total
              </span>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {displayedIncidents.sort((a,b)=>b.incident_date?.localeCompare(a.incident_date||'')).map(inc => {
              const emp = getEmployee(inc.employee_id);
              return (
                <div key={inc.id} className="list-card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                        <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={32} />
                        <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                        <span style={{ fontSize:12, color:'#6b7280' }}>{inc.incident_date}</span>
                        <span style={{ fontWeight:800, color:'#dc2626', fontSize:14, fontFamily:'Manrope,sans-serif' }}>${Number(inc.cost).toLocaleString()}</span>
                        <span style={{ background:inc.status==='Closed'?'#dcfce7':'#fef3c7', color:inc.status==='Closed'?'#166534':'#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
                          {inc.status}
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:'#374151', marginBottom:4 }}>{inc.description}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:inc.doc_signed?'#16a34a':'#f59e0b' }}>
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
            {displayedIncidents.length===0 && <div className="empty-state">No incidents on record.</div>}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Log Incident':'Edit Incident'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="form-grid">
              <label>Employee
                <select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}>
                  <option value="">Select...</option>
                  {(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label>Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></label>
              <label style={{ gridColumn:'1/-1' }}>Description
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="Describe what happened..." />
              </label>
              <label>Cost ($)<input style={inp} type="number" step="1" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0" /></label>
              <label>Status
                <select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  <option>Open</option><option>Closed</option>
                </select>
              </label>
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
