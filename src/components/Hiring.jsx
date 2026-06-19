import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, Star, Ban } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import Avatar from './Avatar';

const STATUSES = ['Applied','Phone Screen','Interview','Offer','Hired','Rejected'];
const ROLES    = ['Crew Leader','Crew Worker','Doorhanger Distributor','CSR','VA'];
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
const emptyBL  = { name:'', position:'', phone:'', reason:'' };

export default function Hiring() {
  const { data, addApplicant, updateApplicant, deleteApplicant, addBlacklist, deleteBlacklist, isAdmin } = useApp();
  const [activeView, setActiveView]     = useState('applicants'); // 'applicants' | 'blacklist'
  const [modal, setModal]               = useState(null);
  const [blModal, setBlModal]           = useState(false);
  const [form, setForm]                 = useState(emptyApp);
  const [blForm, setBlForm]             = useState(emptyBL);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole]     = useState('All');

  const openEdit = (a) => { setForm({ ...a, applied:a.applied_date }); setModal(a); };
  const closeModal = () => setModal(null);
  const save = () => {
    const a = { ...form, applied_date:form.applied };
    if (modal==='add') addApplicant(a); else updateApplicant(a);
    closeModal();
  };
  const saveBlacklist = () => {
    addBlacklist(blForm);
    setBlForm(emptyBL);
    setBlModal(false);
  };

  const allApps = data.applicants || [];
  const blacklist = data.blacklist || [];

  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s] = allApps.filter(a=>a.status===s).length; });
  const roleCounts = {};
  ROLES.forEach(r => { roleCounts[r] = allApps.filter(a=>a.role===r).length; });

  const filtered = allApps
    .filter(a => filterStatus==='All' || a.status===filterStatus)
    .filter(a => filterRole==='All'   || a.role===filterRole);

  return (
    <div>
      {/* Main view toggle: Applicants vs Blacklist */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <button onClick={()=>setActiveView('applicants')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:activeView==='applicants'?'#1B3A2D':'#f3f4f6', color:activeView==='applicants'?'#fff':'#374151' }}>
          Applicants
          <span style={{ background:activeView==='applicants'?'rgba(255,255,255,0.25)':'#e5e7eb', color:activeView==='applicants'?'#fff':'#6b7280', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{allApps.length}</span>
        </button>
        <button onClick={()=>setActiveView('blacklist')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid', fontSize:13, fontWeight:600, cursor:'pointer', background:activeView==='blacklist'?'#374151':'#fff', color:activeView==='blacklist'?'#fff':'#374151', borderColor:activeView==='blacklist'?'#374151':'#e5e7eb' }}>
          <Ban size={14} /> Blacklist
          {blacklist.length > 0 && <span style={{ background:activeView==='blacklist'?'rgba(255,255,255,0.2)':'#f3f4f6', color:activeView==='blacklist'?'#fff':'#6b7280', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{blacklist.length}</span>}
        </button>
        <div style={{ marginLeft:'auto' }}>
          {activeView==='applicants' && isAdmin && (
            <button className="btn-primary" onClick={()=>{ setForm(emptyApp); setModal('add'); }}>
              <Plus size={14}/> Add Applicant
            </button>
          )}
          {activeView==='blacklist' && isAdmin && (
            <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #374151', fontSize:13, fontWeight:600, cursor:'pointer', background:'#374151', color:'#fff' }}
              onClick={()=>{ setBlForm(emptyBL); setBlModal(true); }}>
              <Plus size={14}/> Add to Blacklist
            </button>
          )}
        </div>
      </div>

      {/* ── APPLICANTS VIEW ── */}
      {activeView==='applicants' && (
        <>
          {/* Status filter */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Status</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {['All',...STATUSES].map(s => {
                const active = filterStatus===s;
                const color  = STATUS_COLORS[s]||'#374151';
                const count  = s==='All'?allApps.length:statusCounts[s]||0;
                if (s!=='All' && count===0) return null;
                return (
                  <button key={s} onClick={()=>setFilterStatus(s)}
                    style={{ padding:'4px 10px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?(s==='All'?'#1B3A2D':color):'#fff', color:active?'#fff':(s==='All'?'#374151':color), borderColor:active?(s==='All'?'#1B3A2D':color):(s==='All'?'#e5e7eb':color+'60') }}>
                    {s} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role filter */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Position</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {['All',...ROLES].map(r => {
                const active = filterRole===r;
                const count  = r==='All'?allApps.length:roleCounts[r]||0;
                return (
                  <button key={r} onClick={()=>setFilterRole(r)}
                    style={{ padding:'4px 10px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?'#1B3A2D':'#fff', color:active?'#fff':'#374151', borderColor:active?'#1B3A2D':'#e5e7eb' }}>
                    {r} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Applicant cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(app => {
              const sc = STATUS_COLORS[app.status]||'#6b7280';
              const srcColor = SOURCE_COLORS[app.source]||'#6b7280';
              return (
                <div key={app.id} className="list-card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:6 }}>
                        <Avatar name={app.name} size={38} />
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{app.name}</div>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            <span style={{ background:sc+'18', color:sc, border:`1px solid ${sc}40`, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{app.status}</span>
                            <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{app.role}</span>
                            {app.source && <span style={{ background:srcColor+'15', color:srcColor, border:`1px solid ${srcColor}30`, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{app.source}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>
                        {app.phone&&<span>{app.phone} · </span>}{app.email&&<span>{app.email} · </span>}Applied {formatDateSA(app.applied_date)}
                      </div>
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
        </>
      )}

      {/* ── BLACKLIST VIEW ── */}
      {activeView==='blacklist' && (
        <>
          <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <Ban size={15} color="#9ca3af" style={{ flexShrink:0 }} />
            <div style={{ fontSize:13, color:'#6b7280' }}>Internal use only — these individuals will not appear in the applicant pipeline.</div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {blacklist.map(b => (
              <div key={b.id} className="list-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background:'#374151', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {b.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{b.name}</div>
                        <div style={{ display:'flex', gap:6, marginTop:2, flexWrap:'wrap' }}>
                          {b.position && <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{b.position}</span>}
                          {b.phone && <span style={{ fontSize:12, color:'#6b7280' }}>{b.phone}</span>}
                        </div>
                      </div>
                    </div>
                    {b.reason && (
                      <div style={{ fontSize:13, color:'#374151', padding:'8px 10px', background:'#f9fafb', borderRadius:6, borderLeft:'3px solid #e5e7eb' }}>
                        <span style={{ color:'#6b7280', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginRight:6 }}>Reason</span>{b.reason}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>Added {formatDateSA(b.created_at)}</div>
                  </div>
                  {isAdmin && (
                    <button className="btn-icon danger" onClick={()=>deleteBlacklist(b.id)} title="Remove">
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {blacklist.length===0 && <div className="empty-state">No one on the blacklist.</div>}
          </div>
        </>
      )}

      {/* Applicant Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Add Applicant':'Edit Applicant'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="form-grid">
              <label>Full Name<input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></label>
              <label>Position<select style={inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label>
              <label>Source<select style={inp} value={form.source||'Indeed'} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Phone<input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" /></label>
              <label>Email<input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" /></label>
              <label>Applied Date<input style={inp} type="date" value={form.applied} onChange={e=>setForm(f=>({...f,applied:e.target.value}))} /></label>
              <label>Rating<div style={{ marginTop:6 }}><StarRating value={form.stars} onChange={n=>setForm(f=>({...f,stars:n}))} /></div></label>
              <label style={{ gridColumn:'1/-1' }}>Notes<textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={15}/> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Add Modal */}
      {blModal && (
        <div className="modal-overlay" onClick={()=>setBlModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8, color:'#374151' }}><Ban size={16} color="#6b7280"/> Add to Blacklist</h3>
              <button className="btn-icon" onClick={()=>setBlModal(false)}><X size={18}/></button>
            </div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>This person will be flagged internally and won't appear in the hiring pipeline.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ display:'flex', flexDirection:'column', gap:5, fontSize:13, fontWeight:600, color:'#374151' }}>
                Full Name <span style={{ color:'#dc2626', fontSize:11 }}>Required</span>
                <input style={inp} value={blForm.name} onChange={e=>setBlForm(f=>({...f,name:e.target.value}))} placeholder="e.g. John Doe" />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:5, fontSize:13, fontWeight:600, color:'#374151' }}>
                Position <span style={{ color:'#9ca3af', fontSize:11, fontWeight:400 }}>Optional</span>
                <select style={inp} value={blForm.position} onChange={e=>setBlForm(f=>({...f,position:e.target.value}))}>
                  <option value="">Select position...</option>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:5, fontSize:13, fontWeight:600, color:'#374151' }}>
                Phone <span style={{ color:'#9ca3af', fontSize:11, fontWeight:400 }}>Optional</span>
                <input style={inp} value={blForm.phone} onChange={e=>setBlForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:5, fontSize:13, fontWeight:600, color:'#374151' }}>
                Reason / Notes <span style={{ color:'#dc2626', fontSize:11 }}>Required</span>
                <textarea value={blForm.reason} onChange={e=>setBlForm(f=>({...f,reason:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="Why are they blacklisted?" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setBlModal(false)}>Cancel</button>
              <button onClick={saveBlacklist} disabled={!blForm.name.trim()||!blForm.reason.trim()}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:(!blForm.name.trim()||!blForm.reason.trim())?'#f3f4f6':'#374151', color:(!blForm.name.trim()||!blForm.reason.trim())?'#9ca3af':'#fff' }}>
                <Check size={14}/> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
