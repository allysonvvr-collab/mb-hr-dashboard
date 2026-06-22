import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, Camera, Search } from 'lucide-react';
import { isBirthdayUpcoming, daysUntilBirthday, formatDateSA, formatBirthdaySA } from '../lib/timezone';
import EmptyState from './EmptyState';

const ROLES = ['Owner', 'Operations Manager', 'Office Manager', 'Crew Leader', 'Crew Worker', 'CSR', 'VA'];

const ROLE_STYLE = {
  'Owner':              { dot: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  'Operations Manager': { dot: '#1B3A2D', bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  'Office Manager':     { dot: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', text: '#075985' },
  'Crew Leader':        { dot: '#b45309', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  'Crew Worker':        { dot: '#374151', bg: '#f9fafb', border: '#e5e7eb', text: '#374151' },
  'Crew Member':        { dot: '#374151', bg: '#f9fafb', border: '#e5e7eb', text: '#374151' },
  'CSR':                { dot: '#0891b2', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  'VA':                 { dot: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d' },
};

const AVATAR_BG = ['#1B3A2D','#224d3a','#2d6349','#0d2d1a','#3a7a5c','#4d9973','#163025'];

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };

function Avatar({ name, photoUrl, size=44 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const bg = AVATAR_BG[initials.charCodeAt(0) % AVATAR_BG.length];
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size>40?14:11, flexShrink:0 }}>{initials}</div>;
}

const emptyEmp = { name:'', role:'Crew Worker', phone:'', email:'', start_date:'', birthday:'', wage:'', strikes:0, photo_url:'' };

export default function Team() {
  const { data, addEmployee, updateEmployee, deleteEmployee, isAdmin, isSuperAdmin, uploadEmployeePhoto } = useApp();
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(emptyEmp);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');

  const openAdd  = () => { setForm(emptyEmp); setError(''); setModal('add'); };
  const openEdit = (emp) => {
    setForm({ id:emp.id, name:emp.name||'', role:emp.role||'Crew Worker', phone:emp.phone||'', email:emp.email||'', start_date:emp.start_date||'', birthday:emp.birthday||'', wage:emp.wage!==undefined?String(emp.wage):'', strikes:emp.strikes||0, photo_url:emp.photo_url||'', avatar:emp.avatar||'' });
    setError(''); setModal(emp);
  };
  const closeModal = () => { setModal(null); setError(''); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const emp = { ...form, name:form.name.trim(), wage:parseFloat(form.wage)||0, strikes:parseInt(form.strikes)||0, avatar:form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() };
      if (modal==='add') await addEmployee(emp); else await updateEmployee(emp);
      closeModal();
    } catch(e) { setError('Save failed. Check permissions.'); }
    setSaving(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { alert('Max 5MB'); return; }
    setUploading(true);
    try {
      const url = await uploadEmployeePhoto(form.id, file);
      setForm(f => ({ ...f, photo_url: url+'?t='+Date.now() }));
    } catch(err) { alert('Upload failed: '+err.message); }
    setUploading(false);
  };

  const upcomingBdays = (data.employees||[]).filter(e => isBirthdayUpcoming(e.birthday));

  // Filter employees
  const allEmps = data.employees || [];
  const filtered = allEmps
    .filter(e => filterRole==='All' || e.role===filterRole || (filterRole==='Crew Worker' && e.role==='Crew Member'))
    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.role||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      const ri = r => ROLES.indexOf(r) === -1 ? 99 : ROLES.indexOf(r);
      return ri(a.role) - ri(b.role) || a.name.localeCompare(b.name);
    });

  // Role counts
  const counts = {};
  ROLES.forEach(r => {
    counts[r] = allEmps.filter(e => e.role===r || (r==='Crew Worker' && e.role==='Crew Member')).length;
  });

  const rs = ROLE_STYLE[filterRole] || {};

  return (
    <div>
      {upcomingBdays.length > 0 && (
        <div className="alert-banner">
          <strong>Upcoming Birthdays — Next 30 Days:</strong>{' '}
          {upcomingBdays.map(e=>`${e.name} — ${formatBirthdaySA(e.birthday)} (${daysUntilBirthday(e.birthday)}d away)`).join(', ')}
        </div>
      )}

      {/* Header row */}
      <div className="section-header">
<h2 className="section-title">Team <span style={{ color:'#9ca3af', fontWeight:400, fontSize:13 }}>({filtered.length})</span></h2>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
            <input style={{ ...inp, paddingLeft:30, width:180, padding:'8px 10px 8px 30px', fontSize:13 }}
              placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Employee</button>}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        <button onClick={()=>setFilterRole('All')}
          style={{ padding:'5px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:filterRole==='All'?'#1B3A2D':'#fff', color:filterRole==='All'?'#fff':'#374151', borderColor:filterRole==='All'?'#1B3A2D':'#e5e7eb' }}>
          All ({allEmps.length})
        </button>
        {ROLES.filter(r=>counts[r]>0).map(r => {
          const st = ROLE_STYLE[r];
          const active = filterRole===r;
          return (
            <button key={r} onClick={()=>setFilterRole(r)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', background:active?st.dot:'#fff', color:active?'#fff':st.text, borderColor:active?st.dot:st.border }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:active?'rgba(255,255,255,0.7)':st.dot, display:'inline-block' }} />
              {r} ({counts[r]})
            </button>
          );
        })}
      </div>

      {/* Employee grid */}
      <div className="card-grid">
        {filtered.map(emp => {
          const st = ROLE_STYLE[emp.role] || ROLE_STYLE['Crew Worker'];
          return (
            <div key={emp.id} className="emp-card">
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:0 }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={44} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                    <span style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.text, fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:4, marginTop:2 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:st.dot, display:'inline-block' }} />
                      {emp.role}
                    </span>
                  </div>
                </div>
                {emp.strikes > 0 && <span style={{ background:emp.strikes>=2?'#dc2626':'#f59e0b', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{emp.strikes} Strike{emp.strikes>1?'s':''}</span>}
              </div>

              <div className="emp-details" style={{ marginTop:10 }}>
                <div><span>Phone</span><span>{emp.phone||'—'}</span></div>
                <div><span>Email</span><span style={{ fontSize:12 }}>{emp.email||'—'}</span></div>
                <div><span>Start</span><span>{emp.start_date ? formatDateSA(emp.start_date) : '—'}</span></div>
                <div><span>Birthday</span><span>{emp.birthday ? formatBirthdaySA(emp.birthday) : '—'}</span></div>
                {emp.role !== 'Owner' && <div><span>Wage</span><span style={{ color:'#1B3A2D', fontWeight:700 }}>${Number(emp.wage||0).toFixed(2)}/hr</span></div>}
              </div>

              {isAdmin && (
                <div className="card-actions">
                  <button className="btn-icon" onClick={()=>openEdit(emp)} title="Edit"><Edit2 size={14}/></button>
                  {isSuperAdmin && <button className="btn-icon danger" onClick={()=>setConfirmDel(emp)} title="Delete"><Trash2 size={14}/></button>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0 && <EmptyState icon={Search} message="No employees found." style={{ gridColumn:'1/-1' }} />}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal==='add'?'Add Employee':`Edit — ${form.name}`}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{error}</div>}

            {/* Photo section (edit only) */}
            {modal!=='add' && (
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:14 }}>
                <Avatar name={form.name} photoUrl={form.photo_url} size={52} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>Profile Photo</div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1B3A2D', color:'#fff', padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    <Camera size={13} />
                    {uploading?'Uploading...':form.photo_url?'Change':'Add Photo'}
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
              {form.role !== 'Owner' && <label>Wage ($/hr)<input style={inp} type="number" step="0.25" min="0" value={form.wage} onChange={e=>setForm(f=>({...f,wage:e.target.value}))} placeholder="15.00" /></label>}
              {form.role !== 'Owner' && <label>Strikes (0–3)<input style={inp} type="number" min="0" max="3" value={form.strikes} onChange={e=>setForm(f=>({...f,strikes:e.target.value}))} /></label>}
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

      {/* Delete confirm */}
      {confirmDel && (
        <div className="modal-overlay" onClick={()=>setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Employee?</h3><button className="btn-icon" onClick={()=>setConfirmDel(null)}><X size={18}/></button></div>
            <p style={{ color:'#6b7280', fontSize:14, margin:'8px 0 20px' }}>Permanently delete <strong>{confirmDel.name}</strong>? This cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setConfirmDel(null)}>Cancel</button>
              <button onClick={()=>{deleteEmployee(confirmDel.id);setConfirmDel(null);}} style={{ background:'#dc2626', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
