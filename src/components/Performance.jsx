import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, TrendingUp, BarChart3, ArrowLeft } from 'lucide-react';
import { TabHeader } from './TabHeader';
import { ratingColor } from '../lib/statusColors';
import { formatMonthSA, thisMonthSA } from '../lib/timezone';
import EmptyState from './EmptyState';
import { idsMatch } from '../lib/ids';
import { NON_TRACKED_ROLES } from '../lib/roles';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };
const empty = { employeeId:'', month: thisMonthSA(), jobsCompleted:'', complaints:0, rating:4 };

const toMonthInputValue = (m) => {
  if (!m) return thisMonthSA();
  if (/^\d{4}-\d{2}$/.test(m)) return m;
  const parsed = new Date(`1 ${m}`);
  if (isNaN(parsed)) return thisMonthSA();
  return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}`;
};

function RatingBadge({ rating }) {
  const color = ratingColor(rating);
  return (
    <span style={{ background: color+'18', color, border:`1px solid ${color}40`, fontSize:13, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
      {rating}/5
    </span>
  );
}

export default function Performance({ goToObservation }) {
  const { data, getEmployee, addPerformance, updatePerformance, deletePerformance, isAdmin } = useApp();
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(empty);
  const [saveError, setSaveError] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [selected, setSelected]   = useState(null); // employee id for drill-in

  const entries   = data.performance || [];
  const employees = (data.employees || [])
    .filter(e => !NON_TRACKED_ROLES.includes(e.role) && e.employment_status !== 'Terminated');
  const roles     = [...new Set(employees.map(e => e.role))].sort();

  const openAdd      = ()         => { setForm(empty); setSaveError(''); setModal('add'); };
  const openAddFor   = (empId)    => { setForm({ ...empty, employeeId: String(empId) }); setSaveError(''); setModal('add'); };
  const openEdit     = (p)        => { setForm({ employeeId:p.employee_id, month:toMonthInputValue(p.month), jobsCompleted:p.jobs_completed, complaints:p.complaints, rating:p.rating, id:p.id }); setSaveError(''); setModal(p); };
  const closeModal   = ()         => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const payload = { ...form, employeeId:parseInt(form.employeeId), jobsCompleted:parseInt(form.jobsCompleted)||0, complaints:parseInt(form.complaints)||0, rating:parseInt(form.rating) };
      if (modal === 'add') await addPerformance(payload); else await updatePerformance(payload);
      closeModal();
    } catch(e) { setSaveError(e.message || 'Save failed.'); }
  };

  const totalJobs       = entries.reduce((s,p) => s + Number(p.jobs_completed||0), 0);
  const totalComplaints = entries.reduce((s,p) => s + Number(p.complaints||0), 0);
  const avgRating       = entries.length ? (entries.reduce((s,p) => s + Number(p.rating||0), 0) / entries.length) : 0;
  const topEntry        = entries.length ? [...entries].sort((a,b) => (b.rating-a.rating)||(b.jobs_completed-a.jobs_completed))[0] : null;
  const topEmp          = topEntry ? getEmployee(topEntry.employee_id) : null;

  // ── Drill-in view ──────────────────────────────────────────────────────
  if (selected) {
    const emp        = employees.find(e => idsMatch(e.id, selected));
    const empEntries = entries.filter(p => idsMatch(p.employee_id, selected)).sort((a,b) => toMonthInputValue(b.month).localeCompare(toMonthInputValue(a.month)));

    if (!emp) { setSelected(null); return null; }

    return (
      <div>
        <button onClick={()=>setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>
          <ArrowLeft size={15}/> All Employees
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:16 }}>
          <Avatar name={emp.name} photoUrl={emp.photo_url} size={52} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:17 }}>{emp.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{emp.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:28, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#1B3A2D' }}>{empEntries.length}</div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>entries</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button className="btn-primary" onClick={()=>openAddFor(selected)}><Plus size={14}/> Add Entry</button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {empEntries.map(p => (
            <div key={p.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'#1B3A2D' }}>{formatMonthSA(p.month)}</span>
                    <RatingBadge rating={p.rating} />
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:13 }}>
                    <span><span style={{ color:'#6b7280' }}>Jobs: </span><strong>{p.jobs_completed}</strong></span>
                    <span><span style={{ color:'#6b7280' }}>Complaints: </span><strong style={{ color: p.complaints > 0 ? '#dc2626' : '#16a34a' }}>{p.complaints}</strong></span>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(p)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deletePerformance(p.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {empEntries.length === 0 && <EmptyState icon={BarChart3} message="No entries logged yet." />}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><h3>{modal==='add'?'Add Entry':'Edit Entry'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
              {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
              <div className="form-grid">
                <label>Month<input style={inp} type="month" value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} /></label>
                <label>Jobs Done<input style={inp} type="number" min="0" value={form.jobsCompleted} onChange={e=>setForm(f=>({...f,jobsCompleted:e.target.value}))} /></label>
                <label>Complaints<input style={inp} type="number" min="0" value={form.complaints} onChange={e=>setForm(f=>({...f,complaints:e.target.value}))} /></label>
                <label>Rating (1–5)<input style={inp} type="number" min="1" max="5" value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} /></label>
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

  // ── Card grid view ─────────────────────────────────────────────────────
  const filteredEmps = employees
    .filter(e => filterRole === 'All' || e.role === filterRole)
    .sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* Stats */}
      {entries.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:10, marginBottom:16 }}>
          <div className="stat-card"><div className="stat-num">{entries.length}</div><div className="stat-label">Entries Logged</div></div>
          <div className="stat-card"><div className="stat-num">{totalJobs.toLocaleString()}</div><div className="stat-label">Total Jobs Done</div></div>
          <div className="stat-card"><div className="stat-num" style={{ color: totalComplaints>0?'#dc2626':'#16a34a' }}>{totalComplaints}</div><div className="stat-label">Total Complaints</div></div>
          <div className="stat-card"><div className="stat-num" style={{ color: ratingColor(Math.round(avgRating)) }}>{avgRating.toFixed(1)}/5</div><div className="stat-label">Avg Rating</div></div>
        </div>
      )}

      {topEmp && (
        <div className="alert-banner" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#166534', marginBottom:16 }}>
          <TrendingUp size={15} style={{ flexShrink:0 }}/>
          <div><strong>{topEmp.name}</strong> is the top performer — {topEntry.jobs_completed} jobs, {topEntry.rating}/5 rating ({formatMonthSA(topEntry.month)})</div>
        </div>
      )}

      <TabHeader title="Monthly Performance" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Tap an employee card to see their full history and add entries.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add Entry</button>}
      </TabHeader>

      {/* Role filter */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {['All', ...roles].map(r => {
          const active = filterRole === r;
          const count  = r==='All' ? filteredEmps.length : employees.filter(e=>e.role===r).length;
          return (
            <button key={r} onClick={()=>setFilterRole(r)}
              style={{ padding:'4px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?'#1B3A2D':'#fff', color:active?'#fff':'#374151', borderColor:active?'#1B3A2D':'#e5e7eb' }}>
              {r} ({count})
            </button>
          );
        })}
      </div>

      {/* Employee cards */}
      <div className="card-grid">
        {filteredEmps.map(emp => {
          const empEntries = entries.filter(p => idsMatch(p.employee_id, emp.id)).sort((a,b)=>toMonthInputValue(b.month).localeCompare(toMonthInputValue(a.month)));
          const latest     = empEntries[0] || null;
          const hasEntry   = !!latest;
          const rc         = hasEntry ? ratingColor(latest.rating) : '#9ca3af';
          const totalEmpJobs = empEntries.reduce((s,p)=>s+Number(p.jobs_completed||0),0);

          return (
            <div key={emp.id} className="emp-card" style={{ cursor:'pointer' }} onClick={()=>setSelected(emp.id)}>
              {/* Header */}
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                </div>
                {hasEntry
                  ? <RatingBadge rating={latest.rating} />
                  : <span style={{ background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>—/5</span>
                }
              </div>

              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                {[
                  { label:'Month',      value: hasEntry ? formatMonthSA(latest.month) : '—', color:'#374151' },
                  { label:'Jobs',       value: hasEntry ? totalEmpJobs.toLocaleString() : '—', color:'#1B3A2D' },
                  { label:'Complaints', value: hasEntry ? latest.complaints : '—', color: hasEntry && latest.complaints>0?'#dc2626':'#16a34a' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'#f9fafb', borderRadius:7, padding:'7px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Entry count */}
              {empEntries.length > 1 && (
                <div style={{ marginTop:8, fontSize:11, color:'#9ca3af', textAlign:'right' }}>
                  {empEntries.length} entries total
                </div>
              )}

              {/* Add button for empty */}
              {!hasEntry && isAdmin && (
                <button className="btn-icon" style={{ marginTop:8, fontSize:12, color:'#1B3A2D', background:'none', border:'1px dashed #d1d5db', borderRadius:7, padding:'6px', width:'100%', cursor:'pointer' }}
                  onClick={e=>{e.stopPropagation(); openAddFor(emp.id);}}>
                  <Plus size={13}/> Log first entry
                </button>
              )}
            </div>
          );
        })}
        {filteredEmps.length === 0 && <div style={{ gridColumn:'1/-1' }}><EmptyState icon={BarChart3} message="No employees match this filter." /></div>}
      </div>

      {/* Add modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Add Performance Entry':'Edit Entry'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee
                <select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}>
                  <option value="">Select…</option>
                  {employees.sort((a,b)=>a.name.localeCompare(b.name)).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label>Month<input style={inp} type="month" value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} /></label>
              <label>Jobs Done<input style={inp} type="number" min="0" value={form.jobsCompleted} onChange={e=>setForm(f=>({...f,jobsCompleted:e.target.value}))} /></label>
              <label>Complaints<input style={inp} type="number" min="0" value={form.complaints} onChange={e=>setForm(f=>({...f,complaints:e.target.value}))} /></label>
              <label>Rating (1–5)<input style={inp} type="number" min="1" max="5" value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} /></label>
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
