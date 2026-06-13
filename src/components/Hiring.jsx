import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Edit2, Trash2, X, Check, Star } from 'lucide-react';
const STATUSES=['Applied','Phone Screen','Interview','Offer','Hired','Rejected'];
const ROLES=['Crew Member','Crew Leader','Foreman','Office Assistant','Office Manager'];
const STATUS_COLORS={ Applied:'#6b7280','Phone Screen':'#f59e0b',Interview:'#3b82f6',Offer:'#8b5cf6',Hired:'#16a34a',Rejected:'#dc2626' };
function StarRating({ value, onChange }) {
  return <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(n=><Star key={n} size={16} fill={n<=value?'#f59e0b':'none'} color={n<=value?'#f59e0b':'#d1d5db'} style={{ cursor:onChange?'pointer':'default' }} onClick={()=>onChange&&onChange(n)} />)}</div>;
}
const emptyApp={ name:'', role:'Crew Member', phone:'', email:'', applied:todaySA(), status:'Applied', stars:3, notes:'' };
export default function Hiring() {
  const { data, addApplicant, updateApplicant, deleteApplicant, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyApp);
  const [filter, setFilter] = useState('All');
  const openEdit = (a) => { setForm({ ...a, applied: a.applied_date }); setModal(a); };
  const closeModal = () => setModal(null);
  const save = () => {
    const a = { ...form, applied_date: form.applied };
    if(modal==='add') addApplicant(a); else updateApplicant(a);
    closeModal();
  };
  const counts={};
  STATUSES.forEach(s=>{counts[s]=(data.applicants||[]).filter(a=>a.status===s).length;});
  const filtered = filter==='All'?(data.applicants||[]):(data.applicants||[]).filter(a=>a.status===filter);
  return (
    <div>
      <div className="status-tabs">
        <button className={`status-chip ${filter==='All'?'active':''}`} onClick={()=>setFilter('All')}>All <span className="count-badge">{(data.applicants||[]).length}</span></button>
        {STATUSES.map(s=>(
          <button key={s} className={`status-chip ${filter===s?'active':''}`} style={filter===s?{background:STATUS_COLORS[s],color:'#fff',borderColor:STATUS_COLORS[s]}:{}} onClick={()=>setFilter(s)}>
            {s} {counts[s]>0&&<span className="count-badge">{counts[s]}</span>}
          </button>
        ))}
        {isAdmin && <button className="btn-primary ml-auto" onClick={()=>{setForm(emptyApp);setModal('add');}}><Plus size={16} /> Add Applicant</button>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
        {filtered.map(app=>(
          <div key={app.id} className="list-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div className="avatar-sm">{app.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700 }}>{app.name}</span>
                    <span style={{ color:'#6b7280', fontSize:13 }}>{app.role}</span>
                    <span className="status-pill" style={{ background:STATUS_COLORS[app.status]+'20', color:STATUS_COLORS[app.status], border:`1px solid ${STATUS_COLORS[app.status]}40` }}>{app.status}</span>
                    <StarRating value={app.stars} />
                  </div>
                  <div style={{ color:'#6b7280', fontSize:13, marginTop:2 }}>{app.phone} · {app.email} · Applied {app.applied_date}</div>
                  <div style={{ color:'#374151', fontSize:13, marginTop:4 }}>{app.notes}</div>
                </div>
              </div>
              {isAdmin && <div style={{ display:'flex', gap:6 }}><button className="btn-icon" onClick={()=>openEdit(app)}><Edit2 size={14} /></button><button className="btn-icon danger" onClick={()=>deleteApplicant(app.id)}><Trash2 size={14} /></button></div>}
            </div>
          </div>
        ))}
        {filtered.length===0&&<div className="empty-state">No applicants in this stage.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Add Applicant':'Edit Applicant'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            <div className="form-grid">
              <label>Full Name<input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></label>
              <label>Role<select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label>
              <label>Phone<input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></label>
              <label>Email<input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></label>
              <label>Applied Date<input type="date" value={form.applied} onChange={e=>setForm(f=>({...f,applied:e.target.value}))} /></label>
              <label>Status<select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Rating<div style={{ marginTop:6 }}><StarRating value={form.stars} onChange={n=>setForm(f=>({...f,stars:n}))} /></div></label>
              <label style={{ gridColumn:'1/-1' }}>Notes<textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={16}/> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
