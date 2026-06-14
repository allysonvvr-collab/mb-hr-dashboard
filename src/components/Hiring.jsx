import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, Star } from 'lucide-react';
import { todaySA } from '../lib/timezone';

const STATUSES = ['Applied','Phone Screen','Interview','Offer','Hired','Rejected'];
const ROLES    = ['Crew Leader','Crew Worker','Doorhanger Distributor'];
const SOURCES  = ['Indeed','Referral','Craigslist','Web Form','Walk-in','Other'];

const STATUS_COLORS = {
  Applied:'#6b7280','Phone Screen':'#f59e0b',Interview:'#3b82f6',
  Offer:'#8b5cf6',Hired:'#16a34a',Rejected:'#dc2626'
};
const SOURCE_COLORS = {
  Indeed:'#2563eb',Referral:'#16a34a',Craigslist:'#7c3aed',
  'Web Form':'#0891b2','Walk-in':'#b45309',Other:'#6b7280'
};

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };

function StarRating({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n=>(
        <Star key={n} size={16} fill={n<=value?'#f59e0b':'none'} color={n<=value?'#f59e0b':'#d1d5db'}
          style={{ cursor:onChange?'pointer':'default' }} onClick={()=>onChange&&onChange(n)} />
      ))}
    </div>
  );
}

const emptyApp = { name:'', role:'Crew Worker', phone:'', email:'', applied:todaySA(), status:'Applied', source:'Indeed', stars:3, notes:'' };

export default function Hiring() {
  const { data, addApplicant, updateApplicant, deleteApplicant, isAdmin } = useApp();
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(emptyApp);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole]     = useState('All');

  const openEdit = (a) => { setForm({ ...a, applied:a.applied_date }); setModal(a); };
  const closeModal = () => setModal(null);
  const save = () => {
    const a = { ...form, applied_date:form.applied };
    if (modal==='add') addApplicant(a); else updateApplicant(a);
    closeModal();
  };

  const allApps = data.applicants || [];

  // Counts for status chips
  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s] = allApps.filter(a=>a.status===s).length; });
  const roleCounts = {};
  ROLES.forEach(r => { roleCounts[r] = allApps.filter(a=>a.role===r).length; });

  const filtered = allApps
    .filter(a => filterStatus==='All' || a.status===filterStatus)
    .filter(a => filterRole==='All'   || a.role===filterRole);

  return (
    <div>
      {/* Status filter */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Filter by Status</div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {['All',...STATUSES].map(s => {
            const active = filterStatus===s;
            const color  = STATUS_COLORS[s]||'#374151';
            const count  = s==='All'?allApps.length:statusCounts[s]||0;
            if (s!=='All' && count===0) return null;
            return (
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{ padding:'4px 10px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?(s==='All'?'#1B3A2D':color):'#fff', color:active?'#fff':(s==='All'?'#374151':color), borderColor:active?(s==='All'?'#1B3A2D':color):(s==='All'?'#e5e7eb':color+'60') }}>
                {s} {count>0&&`(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role filter */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Filter by Role</div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
          {['All',...ROLES].map(r => {
            const active = filterRole===r;
            const count  = r==='All'?allApps.length:roleCounts[r]||0;
            return (
              <button key={r} onClick={()=>setFilterRole(r)}
                style={{ padding:'4px 10px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?'#1B3A2D':'#fff', color:active?'#fff':'#374151', borderColor:active?'#1B3A2D':'#e5e7eb' }}>
                {r} {count>0&&`(${count})`}
              </button>
            );
          })}
          {isAdmin && (
            <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={()=>{ setForm(emptyApp); setModal('add'); }}>
              <Plus size={14}/> Add Applicant
            </button>
          )}
        </div>
      </div>

      {/* Applicant cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(app => {
          const sc = STATUS_COLORS[app.status]||'#6b7280';
          const src = app.source;
          const srcColor = SOURCE_COLORS[src]||'#6b7280';
          return (
            <div key={app.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Name + status */}
                  <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#1B3A2D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>
                      {app.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{app.name}</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:2 }}>
                        <span style={{ background:sc+'18', color:sc, border:`1px solid ${sc}40`, fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>{app.status}</span>
                        <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20 }}>{app.role}</span>
                        {src && <span style={{ background:srcColor+'15', color:srcColor, border:`1px solid ${srcColor}30`, fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20 }}>{src}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:3 }}>
                    {app.phone&&<span>{app.phone} · </span>}{app.email&&<span>{app.email} · </span>}Applied {app.applied_date}
                  </div>

                  {/* Stars */}
                  <div style={{ marginBottom:app.notes?4:0 }}><StarRating value={app.stars} /></div>

                  {app.notes && <div style={{ fontSize:13, color:'#374151', fontStyle:'italic' }}>{app.notes}</div>}
                </div>

                {isAdmin && (
                  <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(app)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deleteApplicant(app.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length===0 && <div className="empty-state">No applicants match this filter.</div>}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Add Applicant':'Edit Applicant'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="form-grid">
              <label>Full Name<input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></label>
              <label>Role
                <select style={inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </label>
              <label>Source
                <select style={inp} value={form.source||'Indeed'} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
                  {SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Status
                <select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Phone<input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" /></label>
              <label>Email<input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" /></label>
              <label>Applied Date<input style={inp} type="date" value={form.applied} onChange={e=>setForm(f=>({...f,applied:e.target.value}))} /></label>
              <label>Rating
                <div style={{ marginTop:6 }}><StarRating value={form.stars} onChange={n=>setForm(f=>({...f,stars:n}))} /></div>
              </label>
              <label style={{ gridColumn:'1/-1' }}>Notes<textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} /></label>
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
