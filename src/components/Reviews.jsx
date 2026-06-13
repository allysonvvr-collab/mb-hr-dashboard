import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { TabHeader } from './TabHeader';
const CATS=['punctuality','quality','attitude','teamwork'];
const empty={ employeeId:'', date:todaySA(), rating:4, punctuality:4, quality:4, attitude:4, teamwork:4, notes:'' };
function RatingBar({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
      <span style={{ width:90, fontSize:13, color:'#6b7280', textTransform:'capitalize' }}>{label}</span>
      <div style={{ display:'flex', gap:4 }}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={() => onChange&&onChange(n)} style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', background:n<=value?'#2d6a1f':'#e5e7eb', color:n<=value?'#fff':'#6b7280', fontWeight:700, fontSize:13 }}>{n}</button>
        ))}
      </div>
    </div>
  );
}
export default function Reviews() {
  const { data, getEmployee, addReview, updateReview, deleteReview, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const openEdit = (r) => { setForm({ ...r, employeeId:r.employee_id, date:r.review_date }); setModal(r); };
  const closeModal = () => setModal(null);
  const save = () => { const r={...form, employeeId:parseInt(form.employeeId)}; if(modal==='add') addReview(r); else updateReview(r); closeModal(); };
  const oc = (r) => r>=4?'#16a34a':r>=3?'#f59e0b':'#dc2626';
  return (
    <div>
      <TabHeader title="Employee Reviews" settings={<p style={{color:'#6b7280',fontSize:13}}>Conduct periodic reviews rating punctuality, work quality, attitude, and teamwork. Reviews are tied to raise decisions and performance records.</p>}>
        {isAdmin && <button className="btn-primary" onClick={() => { setForm(empty); setModal('add'); }}><Plus size={16} /> Add Review</button>}
      </TabHeader>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {(data.reviews||[]).map(rev => {
          const emp = getEmployee(rev.employee_id);
          return (
            <div key={rev.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                    <strong>{emp?.name||'—'}</strong>
                    <span style={{ color:'#6b7280', fontSize:13 }}>{emp?.role}</span>
                    <span style={{ color:'#6b7280', fontSize:13 }}>{rev.review_date}</span>
                    <span style={{ background:oc(rev.rating)+'20', color:oc(rev.rating), padding:'2px 10px', borderRadius:20, fontWeight:700, fontSize:13 }}>{rev.rating}/5 Overall</span>
                  </div>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:8 }}>
                    {CATS.map(c=><span key={c} style={{ fontSize:13 }}><span style={{ color:'#6b7280', textTransform:'capitalize' }}>{c}: </span><strong style={{ color:oc(rev[c]) }}>{rev[c]}/5</strong></span>)}
                  </div>
                  {rev.notes && <div style={{ fontSize:13, color:'#374151', fontStyle:'italic' }}>{rev.notes}</div>}
                </div>
                {isAdmin && <div style={{ display:'flex', gap:6 }}><button className="btn-icon" onClick={() => openEdit(rev)}><Edit2 size={14} /></button><button className="btn-icon danger" onClick={() => deleteReview(rev.id)}><Trash2 size={14} /></button></div>}
              </div>
            </div>
          );
        })}
        {(data.reviews||[]).length===0 && <div className="empty-state">No reviews yet.</div>}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Add Review':'Edit Review'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Review Date<input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></label>
            </div>
            <div style={{ margin:'12px 0' }}>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:8 }}>Category Ratings</p>
              <RatingBar label="Overall" value={form.rating} onChange={n=>setForm(f=>({...f,rating:n}))} />
              {CATS.map(c=><RatingBar key={c} label={c} value={form[c]} onChange={n=>setForm(f=>({...f,[c]:n}))} />)}
            </div>
            <label style={{ display:'flex', flexDirection:'column', gap:4 }}>Notes<textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{ padding:8, borderRadius:6, border:'1px solid #e5e7eb', fontSize:14, fontFamily:'inherit' }} /></label>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
