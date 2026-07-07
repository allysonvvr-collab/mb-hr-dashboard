import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, Camera, Search, UserCheck } from 'lucide-react';
import { isBirthdayUpcoming, daysUntilBirthday, formatDateSA, formatBirthdaySA } from '../lib/timezone';
import EmptyState from './EmptyState';

const ROLES = ['Owner','Operations Manager','Office Manager','Crew Leader','Crew Worker','CSR','VA'];

const ROLE_STYLE = {
  'Owner':              { dot:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', text:'#5b21b6' },
  'Operations Manager': { dot:'#1B3A2D', bg:'#f0fdf4', border:'#86efac', text:'#166534' },
  'Office Manager':     { dot:'#0369a1', bg:'#f0f9ff', border:'#bae6fd', text:'#075985' },
  'Crew Leader':        { dot:'#b45309', bg:'#fffbeb', border:'#fde68a', text:'#92400e' },
  'Crew Worker':        { dot:'#374151', bg:'#f9fafb', border:'#e5e7eb', text:'#374151' },
  'Crew Member':        { dot:'#374151', bg:'#f9fafb', border:'#e5e7eb', text:'#374151' },
  'CSR':                { dot:'#0891b2', bg:'#f0f9ff', border:'#bae6fd', text:'#0369a1' },
  'VA':                 { dot:'#db2777', bg:'#fdf2f8', border:'#fbcfe8', text:'#9d174d' },
};

const EMP_STATUS      = ['Good Standing','Warning','Final Warning','Terminated'];
const EMP_STATUS_STYLE = {
  'Good Standing': { bg:'#f0fdf4', border:'#86efac', text:'#166534' },
  'Warning':       { bg:'#fffbeb', border:'#fde68a', text:'#92400e' },
  'Final Warning': { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
};

const AVATAR_BG = ['#1B3A2D','#224d3a','#2d6349','#0d2d1a','#3a7a5c','#4d9973','#163025'];
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };

// Safely coerce Supabase boolean (can return true/false/null/"true"/"false")
const toBool = v => {
  if (v === true  || v === 'true'  || v === 1) return true;
  if (v === false || v === 'false' || v === 0) return false;
  return null;
};

function Avatar({ name, photoUrl, size=44, grayscale=false }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const bg = AVATAR_BG[initials.charCodeAt(0) % AVATAR_BG.length];
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb', filter:grayscale?'grayscale(1)':'none', opacity:grayscale?0.65:1 }} />;
  return <div style={{ width:size, height:size, borderRadius:'50%', background:grayscale?'#9ca3af':bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size>40?14:11, flexShrink:0 }}>{initials}</div>;
}

function RolePill({ role }) {
  const st = ROLE_STYLE[role] || ROLE_STYLE['Crew Worker'];
  return (
    <span style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.text, fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:3 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:st.dot, display:'inline-block' }} />{role}
    </span>
  );
}

const emptyEmp = { name:'', role:'Crew Worker', phone:'', email:'', start_date:'', birthday:'', wage:'', employment_status:'Good Standing', rehireable:null, photo_url:'' };

export default function Team() {
  const { data, addEmployee, updateEmployee, deleteEmployee, isAdmin, isSuperAdmin, uploadEmployeePhoto } = useApp();
  const [tab, setTab]                   = useState('active');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(emptyEmp);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('All');
  const [filterRehire, setFilterRehire] = useState('all'); // 'all' | 'yes' | 'no' | 'unset'
  const [confirmDel, setConfirmDel]         = useState(null);
  const [confirmReactivate, setConfirmReactivate] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');

  const allEmps        = data.employees || [];
  const activeEmps     = allEmps.filter(e => e.employment_status !== 'Terminated');
  const terminatedEmps = allEmps.filter(e => e.employment_status === 'Terminated');
  const upcomingBdays  = activeEmps.filter(e => isBirthdayUpcoming(e.birthday));

  const openAdd  = () => { setForm(emptyEmp); setError(''); setModal('add'); };
  const openEdit = (emp) => {
    setForm({ id:emp.id, name:emp.name||'', role:emp.role||'Crew Worker', phone:emp.phone||'', email:emp.email||'', start_date:emp.start_date||'', birthday:emp.birthday||'', wage:emp.wage!==undefined?String(emp.wage):'', employment_status:emp.employment_status||'Good Standing', termination_reason:emp.termination_reason||'', termination_date:emp.termination_date||'', rehireable:toBool(emp.rehireable), photo_url:emp.photo_url||'', avatar:emp.avatar||'' });
    setError(''); setModal(emp);
  };
  const closeModal = () => { setModal(null); setError(''); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.employment_status === 'Terminated' && !form.termination_reason?.trim()) { setError('Termination reason is required.'); return; }
    setSaving(true); setError('');
    try {
      const emp = { ...form, name:form.name.trim(), wage:parseFloat(form.wage)||0, avatar:form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), active:form.employment_status!=='Terminated', termination_date:form.employment_status==='Terminated'?(form.termination_date||new Date().toISOString().split('T')[0]):null, termination_reason:form.employment_status==='Terminated'?form.termination_reason:null, rehireable:form.employment_status==='Terminated'?(form.rehireable===null||form.rehireable===undefined?null:Boolean(form.rehireable)):null };
      if (modal==='add') await addEmployee(emp); else await updateEmployee(emp);
      closeModal();
    } catch(e) { setError('Save failed.'); }
    setSaving(false);
  };

  const handleReactivate = async (emp) => {
    await updateEmployee({ ...emp, employment_status:'Good Standing', termination_reason:null, termination_date:null, rehireable:null, active:true });
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5*1024*1024) { if(file) alert('Max 5MB'); return; }
    setUploading(true);
    try { const url = await uploadEmployeePhoto(form.id, file); setForm(f=>({...f, photo_url:url+'?t='+Date.now()})); }
    catch(err) { alert('Upload failed: '+err.message); }
    setUploading(false);
  };

  // Filtered lists
  const roleFilter = e => filterRole==='All' || e.role===filterRole || (filterRole==='Crew Worker' && e.role==='Crew Member');
  const nameFilter = e => !search || e.name.toLowerCase().includes(search.toLowerCase());
  const sortEmps   = arr => [...arr].sort((a,b) => { const ri=r=>ROLES.indexOf(r)===-1?99:ROLES.indexOf(r); return ri(a.role)-ri(b.role)||a.name.localeCompare(b.name); });

  const rehireFilter = e => {
    const r = toBool(e.rehireable);
    if (filterRehire==='yes')   return r===true;
    if (filterRehire==='no')    return r===false;
    if (filterRehire==='unset') return r===null;
    return true;
  };

  const activeFiltered     = sortEmps(activeEmps.filter(roleFilter).filter(nameFilter));
  const terminatedFiltered = sortEmps(terminatedEmps.filter(nameFilter).filter(rehireFilter));
  const allFiltered        = sortEmps(allEmps.filter(roleFilter).filter(nameFilter));

  const displayed = tab==='active' ? activeFiltered : tab==='terminated' ? terminatedFiltered : allFiltered;

  const roleCounts = {};
  ROLES.forEach(r => { roleCounts[r] = activeEmps.filter(e=>e.role===r||(r==='Crew Worker'&&e.role==='Crew Member')).length; });

  return (
    <div>
      {/* Birthday alert — active only */}
      {upcomingBdays.length > 0 && (
        <div className="alert-banner">
          <strong>Upcoming Birthdays — Next 30 Days:</strong>{' '}
          {upcomingBdays.map(e=>`${e.name} — ${formatBirthdaySA(e.birthday)} (${daysUntilBirthday(e.birthday)}d away)`).join(', ')}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:10, padding:3, gap:2 }}>
          {[
            { key:'active',     label:'Active',     count:activeEmps.length },
            { key:'terminated', label:'Terminated', count:terminatedEmps.length },
            { key:'all',        label:'All',        count:allEmps.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={()=>{ setTab(key); setFilterRole('All'); setSearch(''); setFilterRehire('all'); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:tab===key?'#fff':'transparent', color:tab===key?'#1B3A2D':'#6b7280', boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {label}
              <span style={{ background:tab===key?'#e8f5e9':'#e5e7eb', color:tab===key?'#1B3A2D':'#9ca3af', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:8 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }} />
            <input style={{ ...inp, paddingLeft:32, width:150, padding:'8px 10px 8px 32px', fontSize:13 }}
              placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {isAdmin && tab!=='terminated' && (
            <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add</button>
          )}
        </div>
      </div>

      {/* ── Role filter chips (active + all) ── */}
      {tab !== 'terminated' && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
          <button onClick={()=>setFilterRole('All')}
            style={{ padding:'4px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:filterRole==='All'?'#1B3A2D':'#fff', color:filterRole==='All'?'#fff':'#374151', borderColor:filterRole==='All'?'#1B3A2D':'#e5e7eb' }}>
            All
          </button>
          {ROLES.filter(r=>roleCounts[r]>0).map(r => {
            const st=ROLE_STYLE[r]; const active=filterRole===r;
            return (
              <button key={r} onClick={()=>setFilterRole(r)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?st.dot:'#fff', color:active?'#fff':st.text, borderColor:active?st.dot:st.border }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:active?'rgba(255,255,255,0.7)':st.dot, display:'inline-block' }} />
                {r} ({roleCounts[r]})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Rehireable filter chips (terminated only) ── */}
      {tab === 'terminated' && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, marginRight:2 }}>Filter:</span>
          {[
            { key:'all',   label:'All',            color:'#374151', activeBg:'#374151' },
            { key:'yes',   label:'Rehireable',     color:'#166534', activeBg:'#16a34a' },
            { key:'no',    label:'Non-Rehireable', color:'#991b1b', activeBg:'#dc2626' },
            { key:'unset', label:'Not Set',        color:'#6b7280', activeBg:'#6b7280' },
          ].map(({ key, label, activeBg }) => (
            <button key={key} onClick={()=>setFilterRehire(key)}
              style={{ padding:'4px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:filterRehire===key?activeBg:'#fff', color:filterRehire===key?'#fff':'#374151', borderColor:filterRehire===key?activeBg:'#e5e7eb' }}>
              {label} ({terminatedEmps.filter(e => {
                const r=toBool(e.rehireable);
                if(key==='all') return true;
                if(key==='yes') return r===true;
                if(key==='no')  return r===false;
                return r===null;
              }).length})
            </button>
          ))}
        </div>
      )}

      {/* ── Cards ── */}
      <div className="card-grid">
        {displayed.map(emp => {
          const st          = ROLE_STYLE[emp.role] || ROLE_STYLE['Crew Worker'];
          const isTerminated = emp.employment_status === 'Terminated';
          const statusStyle  = EMP_STATUS_STYLE[emp.employment_status];
          const rehireable   = toBool(emp.rehireable);
          const empIncidents = (data.incidents||[]).filter(i=>String(i.employee_id)===String(emp.id));
          const incidentCost = empIncidents.reduce((s,i)=>s+Number(i.cost||0),0);

          return (
            <div key={emp.id} className="emp-card" style={{ opacity:isTerminated?0.88:1 }}>

              {/* Header */}
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:0, flex:1 }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} grayscale={isTerminated} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                    <div style={{ marginTop:3 }}><RolePill role={emp.role} /></div>
                  </div>
                </div>

                {/* Badges top-right */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                  {isTerminated && (
                    <span style={{ background:'#f3f4f6', color:'#374151', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, border:'1px solid #e5e7eb' }}>
                      Terminated
                    </span>
                  )}
                  {isTerminated && rehireable === true && (
                    <span style={{ background:'#dcfce7', color:'#166534', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, border:'1px solid #86efac' }}>
                      Rehireable
                    </span>
                  )}
                  {isTerminated && rehireable === false && (
                    <span style={{ background:'#fee2e2', color:'#991b1b', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, border:'1px solid #fca5a5' }}>
                      Non-Rehireable
                    </span>
                  )}
                  {!isTerminated && statusStyle && emp.employment_status !== 'Good Standing' && (
                    <span style={{ background:statusStyle.bg, border:`1px solid ${statusStyle.border}`, color:statusStyle.text, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>
                      {emp.employment_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="emp-details" style={{ marginTop:10 }}>
                <div><span>Phone</span><span>{emp.phone||'—'}</span></div>
                <div><span>Email</span><span style={{ fontSize:12 }}>{emp.email||'—'}</span></div>
                <div><span>Start</span><span>{emp.start_date?formatDateSA(emp.start_date):'—'}</span></div>
                <div><span>Birthday</span><span>{emp.birthday?formatBirthdaySA(emp.birthday):'—'}</span></div>
                {emp.role!=='Owner' && !isTerminated && (
                  <div><span>Wage</span><span style={{ color:'#1B3A2D', fontWeight:700 }}>${Number(emp.wage||0).toFixed(2)}/hr</span></div>
                )}
                {isTerminated && emp.termination_date && (
                  <div><span>Terminated</span><span>{emp.termination_date}</span></div>
                )}
                {isTerminated && incidentCost > 0 && (
                  <div><span>Incidents</span><span style={{ color:'#dc2626', fontWeight:600 }}>${incidentCost.toLocaleString()}</span></div>
                )}
              </div>

              {/* Termination reason — clean block */}
              {isTerminated && emp.termination_reason && (
                <div style={{ marginTop:8, padding:'8px 10px', background:'#f9fafb', borderRadius:6, border:'1px solid #f3f4f6' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>Reason</div>
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{emp.termination_reason}</div>
                </div>
              )}

              {/* Actions */}
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn-icon" onClick={()=>openEdit(emp)} title="Edit"><Edit2 size={14}/></button>
                  {isTerminated && (
                    <button className="btn-icon" onClick={()=>setConfirmReactivate(emp)} title="Reactivate" style={{ color:'#16a34a' }}>
                      <UserCheck size={14}/>
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button className="btn-icon danger" onClick={()=>setConfirmDel(emp)} title="Delete permanently">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div style={{ gridColumn:'1/-1' }}>
            <EmptyState icon={Search} message={tab==='terminated'?'No terminated employees.':'No employees found.'} />
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Add Employee':`Edit — ${form.name}`}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{error}</div>}

            {modal!=='add' && (
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:14 }}>
                <Avatar name={form.name} photoUrl={form.photo_url} size={50} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>Profile Photo</div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1B3A2D', color:'#fff', padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <Camera size={13}/>{uploading?'Uploading...':form.photo_url?'Change':'Add Photo'}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} disabled={uploading} />
                  </label>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>JPG or PNG · Max 5MB</div>
                </div>
              </div>
            )}

            <div className="form-grid">
              <label>Full Name<input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. John Doe" /></label>
              <label>Role<select style={inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
              <label>Phone<input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000" /></label>
              <label>Email<input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" /></label>
              <label>Start Date<input style={inp} type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></label>
              <label>Birthday<input style={inp} type="date" value={form.birthday} onChange={e=>setForm(f=>({...f,birthday:e.target.value}))} /></label>
              {form.role!=='Owner' && <label>Wage ($/hr)<input style={inp} type="number" step="0.25" min="0" value={form.wage} onChange={e=>setForm(f=>({...f,wage:e.target.value}))} placeholder="15.00" /></label>}
              {form.role!=='Owner' && (
                <label>Status
                  <select style={inp} value={form.employment_status}
                    onChange={e=>setForm(f=>({ ...f, employment_status:e.target.value, termination_reason:e.target.value!=='Terminated'?'':f.termination_reason, rehireable:e.target.value!=='Terminated'?null:f.rehireable }))}>
                    {EMP_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
              {form.employment_status==='Terminated' && (
                <>
                  <label style={{ gridColumn:'1/-1' }}>
                    Reason for Termination <span style={{ color:'#dc2626', fontWeight:400, fontSize:11 }}>required</span>
                    <textarea value={form.termination_reason||''} onChange={e=>setForm(f=>({...f,termination_reason:e.target.value}))} rows={2} style={{ ...inp, resize:'none', marginTop:2 }} placeholder="e.g. No-show, policy violation..." />
                  </label>
                  <label>Rehireable?
                    <select style={inp} value={form.rehireable===null||form.rehireable===undefined?'':String(form.rehireable)}
                      onChange={e=>setForm(f=>({...f,rehireable:e.target.value===''?null:e.target.value==='true'}))}>
                      <option value="">Not set</option>
                      <option value="true">Yes — Rehireable</option>
                      <option value="false">No — Non-Rehireable</option>
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.name.trim()}>
                <Check size={15}/> {saving?'Saving...':modal==='add'?'Add Employee':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reactivate Confirm ── */}
      {confirmReactivate && (
        <div className="modal-overlay" onClick={()=>setConfirmReactivate(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}><UserCheck size={18} color="#16a34a"/> Reactivate Employee?</h3>
              <button className="btn-icon" onClick={()=>setConfirmReactivate(null)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:14 }}>
              <Avatar name={confirmReactivate.name} photoUrl={confirmReactivate.photo_url} size={42} />
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{confirmReactivate.name}</div>
                <div style={{ fontSize:13, color:'#6b7280' }}>{confirmReactivate.role}</div>
              </div>
            </div>
            <p style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>
              This will move <strong>{confirmReactivate.name}</strong> back to Active with status <strong>Good Standing</strong>. Their termination record will be cleared.
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setConfirmReactivate(null)}>Cancel</button>
              <button onClick={async ()=>{ await handleReactivate(confirmReactivate); setConfirmReactivate(null); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                <UserCheck size={14}/> Yes, Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Permanently?</h3><button className="btn-icon" onClick={()=>setConfirmDel(null)}><X size={18}/></button></div>
            <p style={{ color:'#6b7280', fontSize:14, margin:'8px 0 20px' }}>Permanently delete <strong>{confirmDel.name}</strong>? Cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setConfirmDel(null)}>Cancel</button>
              <button onClick={()=>{deleteEmployee(confirmDel.id);setConfirmDel(null);}} style={{ background:'#dc2626', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Trash2 size={14}/> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
