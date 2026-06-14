import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, BarChart2, List } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', date:todaySA(), description:'', cost:'', status:'Open', docSigned:false };

export default function Incidents() {
  const { data, getEmployee, addIncident, updateIncident, deleteIncident, isAdmin } = useApp();
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(empty);
  const [view, setView]     = useState('list'); // 'list' | 'report'
  const [filterEmp, setFilterEmp] = useState('All');

  const openAdd  = () => { setForm(empty); setModal('add'); };
  const openEdit = (i) => { setForm({ ...i, employeeId:i.employee_id, date:i.incident_date, docSigned:i.doc_signed }); setModal(i); };
  const closeModal = () => setModal(null);
  const save = () => {
    const i = { ...form, employeeId:parseInt(form.employeeId), cost:parseFloat(form.cost)||0 };
    if (modal==='add') addIncident(i); else updateIncident(i);
    closeModal();
  };

  const incidents = data.incidents || [];
  const total = incidents.reduce((s,i) => s + Number(i.cost||0), 0);
  const open  = incidents.filter(i => i.status==='Open').length;

  // Per-employee report
  const empReport = (data.employees||[])
    .map(emp => {
      const empInc = incidents.filter(i => i.employee_id === emp.id);
      if (empInc.length === 0) return null;
      const totalCost = empInc.reduce((s,i) => s + Number(i.cost||0), 0);
      const openCount = empInc.filter(i => i.status==='Open').length;
      return { emp, count: empInc.length, totalCost, openCount, incidents: empInc };
    })
    .filter(Boolean)
    .sort((a,b) => b.totalCost - a.totalCost);

  // Filtered list view
  const filtered = filterEmp === 'All'
    ? incidents
    : incidents.filter(i => i.employee_id === parseInt(filterEmp));

  const riskColor = (cost, count) => {
    if (cost > 500 || count >= 3) return { bg:'#fef2f2', border:'#fecaca', text:'#dc2626', label:'High' };
    if (cost > 200 || count >= 2) return { bg:'#fef3c7', border:'#fde68a', text:'#d97706', label:'Medium' };
    return { bg:'#f0fdf4', border:'#86efac', text:'#16a34a', label:'Low' };
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        <div className="stat-card"><div className="stat-num">{incidents.length}</div><div className="stat-label">Total Cases</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'#f59e0b' }}>{open}</div><div className="stat-label">Open Cases</div></div>
        <div className="stat-card">
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>Total Cost</div>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#dc2626', lineHeight:1 }}>${total.toLocaleString()}</div>
        </div>
      </div>

      <TabHeader title="Incident Log" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Log vehicle damage, property damage, or workplace incidents. Mark doc signed once employee signs the report.</p>}>
        {/* View toggle */}
        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:8, padding:3, gap:2 }}>
          <button onClick={()=>setView('list')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', background:view==='list'?'#fff':'transparent', color:view==='list'?'#1B3A2D':'#6b7280', fontWeight:view==='list'?700:400, fontSize:12, boxShadow:view==='list'?'0 1px 3px rgba(0,0,0,0.1)':'' }}>
            <List size={13}/> Log
          </button>
          <button onClick={()=>setView('report')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', background:view==='report'?'#fff':'transparent', color:view==='report'?'#1B3A2D':'#6b7280', fontWeight:view==='report'?700:400, fontSize:12, boxShadow:view==='report'?'0 1px 3px rgba(0,0,0,0.1)':'' }}>
            <BarChart2 size={13}/> By Employee
          </button>
        </div>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Log Incident</button>}
      </TabHeader>

      {/* ── REPORT VIEW ── */}
      {view === 'report' && (
        <div>
          {empReport.length === 0 && <div className="empty-state">No incidents on record.</div>}
          {empReport.map(({ emp, count, totalCost, openCount, incidents: empInc }) => {
            const risk = riskColor(totalCost, count);
            return (
              <div key={emp.id} style={{ background:'#fff', border:`1px solid ${risk.border}`, borderRadius:10, marginBottom:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                {/* Employee header row */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:`1px solid ${risk.border}`, background:risk.bg }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'#1B3A2D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {emp.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                  {/* Summary badges */}
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:18, fontFamily:'Manrope,sans-serif', color:'#374151' }}>{count}</div>
                      <div style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Incidents</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:18, fontFamily:'Manrope,sans-serif', color:'#dc2626' }}>${totalCost.toLocaleString()}</div>
                      <div style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Cost</div>
                    </div>
                    {openCount > 0 && (
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontWeight:800, fontSize:18, fontFamily:'Manrope,sans-serif', color:'#f59e0b' }}>{openCount}</div>
                        <div style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Open</div>
                      </div>
                    )}
                    <span style={{ background:risk.bg, border:`1px solid ${risk.border}`, color:risk.text, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>{risk.label} Risk</span>
                  </div>
                </div>

                {/* Individual incidents for this employee */}
                {empInc.sort((a,b) => b.incident_date?.localeCompare(a.incident_date||'')).map(inc => (
                  <div key={inc.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 16px', borderBottom:'1px solid #f9fafb', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:'#374151', marginBottom:2 }}>{inc.description}</div>
                      <div style={{ fontSize:11, color:'#6b7280' }}>
                        {inc.incident_date} · {inc.doc_signed ? 'Signed' : 'Awaiting signature'}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <span style={{ fontWeight:700, color:'#dc2626', fontSize:13 }}>${Number(inc.cost).toLocaleString()}</span>
                      <span style={{ background:inc.status==='Closed'?'#dcfce7':'#fef3c7', color:inc.status==='Closed'?'#166534':'#92400e', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div>
          {/* Filter by employee */}
          <div style={{ marginBottom:12 }}>
            <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} style={{ ...inp, fontSize:13, padding:'7px 10px' }}>
              <option value="All">All Employees ({incidents.length} incidents)</option>
              {(data.employees||[])
                .filter(e => incidents.some(i=>i.employee_id===e.id))
                .map(e => {
                  const count = incidents.filter(i=>i.employee_id===e.id).length;
                  const cost  = incidents.filter(i=>i.employee_id===e.id).reduce((s,i)=>s+Number(i.cost||0),0);
                  return <option key={e.id} value={e.id}>{e.name} — {count} incident{count>1?'s':''} · ${cost.toLocaleString()}</option>;
                })
              }
            </select>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.sort((a,b)=>b.incident_date?.localeCompare(a.incident_date||'')).map(inc => {
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
            {filtered.length===0 && <div className="empty-state">No incidents on record.</div>}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Log Incident':'Edit Incident'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select...</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></label>
              <label style={{ gridColumn:'1/-1' }}>Description<textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="Describe what happened..." /></label>
              <label>Cost ($)<input style={inp} type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0.00" /></label>
              <label>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Open</option><option>Closed</option></select></label>
              <label style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:10, gridColumn:'1/-1' }}>
                <input type="checkbox" checked={form.docSigned} onChange={e=>setForm(f=>({...f,docSigned:e.target.checked}))} style={{ width:18, height:18 }} />
                <span>Documentation Signed by Employee</span>
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
