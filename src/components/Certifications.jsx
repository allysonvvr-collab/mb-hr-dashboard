import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, Award } from 'lucide-react';
import { formatDateSA } from '../lib/timezone';
import { statusColor, statusBadgeStyle } from '../lib/statusColors';
import EmptyState from './EmptyState';
import { TabHeader } from './TabHeader';

const CERT_NAMES = ['OSHA 10','OSHA 30','Pesticide Applicator License','QuickBooks Certified','First Aid/CPR',"Driver's License",'CDL'];
const STATUSES = ['Active','Expired','In Progress','Pending Renewal'];
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', name:'OSHA 10', earned:'', expires:'', status:'Active' };

export default function Certifications() {
  const { data, getEmployee, addCertification, updateCertification, deleteCertification, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(empty);
  const [saveError, setSaveError] = useState('');

  const openEdit = (c) => { setForm({ ...c, employeeId:c.employee_id, earned:c.earned_date||'', expires:c.expires_date||'' }); setSaveError(''); setModal(c); };
  const closeModal = () => { setModal(null); setSaveError(''); };
  const save = async () => {
    try {
      const c={...form,employeeId:parseInt(form.employeeId)};
      if(modal==='add') await addCertification(c); else await updateCertification(c);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  return (
    <div>
      <TabHeader title="Certifications" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Track OSHA, pesticide licenses, and other certs. Expired certs are flagged automatically.</p>}>
        {isAdmin && <button className="btn-primary" onClick={()=>{ setForm(empty); setModal('add'); }}><Plus size={15}/> Add Cert</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(data.certifications||[]).map(c => {
          const emp = getEmployee(c.employee_id);
          return (
            <div key={c.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                    <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={32} />
                    <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                    <span style={statusBadgeStyle(c.status)}>{c.status}</span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:2 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>
                    {c.earned_date ? `Earned: ${formatDateSA(c.earned_date)}` : 'Not yet earned'}
                    {c.expires_date ? ` · Expires: ${formatDateSA(c.expires_date)}` : ' · No expiry'}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(c)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deleteCertification(c.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(data.certifications||[]).length===0 && <EmptyState icon={Award} message="No certifications on file." />}
      </div>

      <h3 style={{ marginTop:24, marginBottom:10, fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Coverage by Employee</h3>
      <div className="card-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))' }}>
        {(data.employees||[]).map(emp => {
          const certs = (data.certifications||[]).filter(c=>c.employee_id===emp.id);
          return (
            <div key={emp.id} className="emp-card" style={{ padding:'12px 14px' }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{emp.name}</div>
              <div style={{ color:'#6b7280', fontSize:11, marginBottom:6 }}>{emp.role}</div>
              {certs.length===0 ? <div style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>None on file</div>
                : certs.map(c=><div key={c.id} style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:statusColor(c.status), flexShrink:0 }} />
                    <span style={{ color:statusColor(c.status) }}>{c.name}</span>
                  </div>)
              }
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Add Certification':'Edit Certification'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select...</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Certification<select style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}>{CERT_NAMES.map(n=><option key={n}>{n}</option>)}</select></label>
              <label>Date Earned<input style={inp} type="date" value={form.earned} onChange={e=>setForm(f=>({...f,earned:e.target.value}))} /></label>
              <label>Expiry Date (blank = none)<input style={inp} type="date" value={form.expires} onChange={e=>setForm(f=>({...f,expires:e.target.value}))} /></label>
              <label style={{ gridColumn:'1/-1' }}>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
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
