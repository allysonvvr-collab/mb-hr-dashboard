import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, Star, Ban, AlertOctagon } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import Avatar from './Avatar';

const STATUSES = ['Applied','Phone Screen','Interview','Offer','Hired','Rejected'];
const ROLES    = ['Crew Leader','Crew Worker','Doorhanger Distributor','CSR'];
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
const emptyBlacklist = { name:'', phone:'', reason:'', date:todaySA() };

export default function Hiring() {
  const { data, addApplicant, updateApplicant, deleteApplicant, isAdmin } = useApp();
  const [tab, setTab]               = useState('pipeline'); // 'pipeline' | 'blacklist'
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(emptyApp);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRole, setFilterRole]     = useState('All');

  // Blacklist stored in localStorage (no DB table needed — simple & fast)
  const [blacklist, setBlacklist]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_blacklist') || '[]'); } catch { return []; }
  });
  const [blModal, setBlModal]       = useState(null); // null | 'add' | item
  const [blForm, setBlForm]         = useState(emptyBlacklist);

  const saveBlacklist = (list) => {
    setBlacklist(list);
    localStorage.setItem('mb_blacklist', JSON.stringify(list));
  };
  const addToBlacklist = () => {
    const item = { ...blForm, id: Date.now() };
    saveBlacklist([...blacklist, item]);
    setBlModal(null);
    setBlForm(emptyBlacklist);
  };
  const removeFromBlacklist = (id) => saveBlacklist(blacklist.filter(x => x.id !== id));

  const openEdit = (a) => { setForm({ ...a, applied:a.applied_date }); setModal(a); };
  const closeModal = () => setModal(null);
  const save = () => {
    const a = { ...form, applied_date:form.applied };
    if (modal==='add') addApplicant(a); else updateApplicant(a);
    closeModal();
  };

  const allApps = data.applicants || [];
  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s] = allApps.filter(a=>a.status===s).length; });
  const roleCounts = {};
  ROLES.forEach(r => { roleCounts[r] = allApps.filter(a=>a.role===r).length; });

  const filtered = allApps
    .filter(a => filterStatus==='All' || a.status===filterStatus)
    .filter(a => filterRole==='All'   || a.role===filterRole);

  return (
    <div>
      {/* Top tab switcher — Pipeline vs Blacklist */}
      <div style={{ display:'flex', gap:8, marginBottom:16, borderBottom:'1px solid #e5e7eb', paddingBottom:0 }}>
        <button onClick={()=>setTab('pipeline')} style={{ padding:'8px 16px', border:'none', background:'none', fontSize:13, fontWeight:700, cursor:'pointer', color:tab==='pipeline'?'#1B3A2D':'#6b7280', borderBottom:tab==='pipeline'?'2px solid #1B3A2D':'2px solid transparent', marginBottom:-1 }}>
          Applicant Pipeline
          <span style={{ marginLeft:6, background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:600, padding:'1px 6px', borderRadius:10 }}>{allApps.length}</span>
        </button>
        <button onClick={()=>setTab('blacklist')} style={{ padding:'8px 16px', border:'none', background:'none', fontSize:13, fontWeight:700, cursor:'pointer', color:tab==='blacklist'?'#dc2626':'#6b7280', borderBottom:tab==='blacklist'?'2px solid #dc2626':'2px solid transparent', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>
          <Ban size={14} />
          Blacklist
          {blacklist.length > 0 && <span style={{ background:'#fee2e2', color:'#dc2626', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{blacklist.length}</span>}
        </button>
      </div>

      {/* ── PIPELINE TAB ── */}
      {tab === 'pipeline' && (
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
                    {s} {count>0&&`(${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role filter + Add button */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Role</div>
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
              const srcColor = SOURCE_COLORS[app.source]||'#6b7280';
              return (
                <div key={app.id} className="list-card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <Avatar name={app.name} size={38} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{app.name}</div>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:4 }}>
                            <span style={{ background:sc+'18', color:sc, border:`1px solid ${sc}40`, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{app.status}</span>
                            <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{app.role}</span>
                            {app.source && <span style={{ background:srcColor+'15', color:srcColor, border:`1px solid ${srcColor}30`, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{app.source}</span>}
                          </div>
                          <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>
                            {app.phone && <span>{app.phone} · </span>}{app.email && <span>{app.email} · </span>}Applied {app.applied_date}
                          </div>
                          <StarRating value={app.stars} />
                          {app.notes && <div style={{ fontSize:13, color:'#374151', fontStyle:'italic', marginTop:4 }}>{app.notes}</div>}
                        </div>
                      </div>
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

      {/* ── BLACKLIST TAB ── */}
      {tab === 'blacklist' && (
        <>
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <AlertOctagon size={16} color="#dc2626" style={{ flexShrink:0 }} />
            <span style={{ fontSize:13, color:'#991b1b' }}>
              <strong>Blacklisted individuals</strong> — Do not hire. Kept separate from the applicant pipeline.
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 className="section-title">Blacklist <span style={{ color:'#9ca3af', fontWeight:400, fontSize:13 }}>({blacklist.length})</span></h2>
            {isAdmin && (
              <button onClick={()=>{ setBlForm(emptyBlacklist); setBlModal('add'); }}
                style={{ display:'flex', alignItems:'center', gap:6, background:'#dc2626', color:'#fff', border:'none', padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <Ban size={14}/> Add to Blacklist
              </button>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {blacklist.length === 0 && (
              <div className="empty-state">No one on the blacklist.</div>
            )}
            {blacklist.map(person => (
              <div key={person.id} className="list-card" style={{ borderLeft:'3px solid #dc2626' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'#fee2e2', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                      {person.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{person.name}</div>
                      {person.phone && <div style={{ fontSize:12, color:'#6b7280', marginBottom:2 }}>{person.phone}</div>}
                      {person.reason && (
                        <div style={{ fontSize:13, color:'#991b1b', background:'#fef2f2', padding:'4px 10px', borderRadius:6, display:'inline-block', marginTop:2 }}>
                          {person.reason}
                        </div>
                      )}
                      {person.date && <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Added {person.date}</div>}
                    </div>
                  </div>
                  {isAdmin && (
                    <button className="btn-icon danger" onClick={()=>removeFromBlacklist(person.id)} title="Remove from blacklist">
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Applicant Add/Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Add Applicant':'Edit Applicant'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="form-grid">
              <label>Full Name<input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></label>
              <label>Role<select style={inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label>
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

      {/* ── Blacklist Add Modal ── */}
      {blModal && (
        <div className="modal-overlay" onClick={()=>setBlModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color:'#dc2626', display:'flex', alignItems:'center', gap:8 }}><Ban size={18}/> Add to Blacklist</h3>
              <button className="btn-icon" onClick={()=>setBlModal(null)}><X size={18}/></button>
            </div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:14 }}>This person will be kept separate from the applicant pipeline.</p>
            <div className="form-grid">
              <label>Full Name<input style={inp} value={blForm.name} onChange={e=>setBlForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></label>
              <label>Phone (optional)<input style={inp} value={blForm.phone} onChange={e=>setBlForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" /></label>
              <label style={{ gridColumn:'1/-1' }}>Reason for Blacklist
                <textarea value={blForm.reason} onChange={e=>setBlForm(f=>({...f,reason:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="e.g. No-showed twice, theft, aggressive behavior..." />
              </label>
              <label>Date Added<input style={inp} type="date" value={blForm.date} onChange={e=>setBlForm(f=>({...f,date:e.target.value}))} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setBlModal(null)}>Cancel</button>
              <button onClick={addToBlacklist} disabled={!blForm.name.trim()}
                style={{ display:'flex', alignItems:'center', gap:6, background:'#dc2626', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14, opacity:!blForm.name.trim()?0.5:1 }}>
                <Ban size={14}/> Add to Blacklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
