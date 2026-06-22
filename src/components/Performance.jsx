import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { TabHeader } from './TabHeader';

const empty = { employeeId:'', month:'', jobsCompleted:'', complaints:0, rating:4 };

function ratingColor(r) { return r>=4 ? '#16a34a' : r===3 ? '#f59e0b' : '#dc2626'; }

export default function Performance({ goToObservation }) {
  const { data, getEmployee, addPerformance, updatePerformance, deletePerformance, isAdmin } = useApp();
  const [modal, setModal] = useState(null); // 'add' | entry object | null
  const [form, setForm] = useState(empty);
  const [saveError, setSaveError] = useState('');

  const entries = data.performance || [];

  const openAdd  = () => { setForm(empty); setSaveError(''); setModal('add'); };
  const openEdit = (p) => { setForm({ employeeId:p.employee_id, month:p.month, jobsCompleted:p.jobs_completed, complaints:p.complaints, rating:p.rating, id:p.id }); setSaveError(''); setModal(p); };
  const closeModal = () => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const payload = { ...form, employeeId:parseInt(form.employeeId), jobsCompleted:parseInt(form.jobsCompleted), complaints:parseInt(form.complaints), rating:parseInt(form.rating) };
      if (modal === 'add') await addPerformance(payload); else await updatePerformance(payload);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  // Summary stats across all logged entries
  const totalJobs = entries.reduce((s, p) => s + Number(p.jobs_completed || 0), 0);
  const totalComplaints = entries.reduce((s, p) => s + Number(p.complaints || 0), 0);
  const avgRating = entries.length ? (entries.reduce((s, p) => s + Number(p.rating || 0), 0) / entries.length) : 0;

  // Top performer this batch — highest rating, tie-broken by most jobs done
  const topPerformer = entries.length
    ? [...entries].sort((a, b) => (b.rating - a.rating) || (b.jobs_completed - a.jobs_completed))[0]
    : null;
  const topEmp = topPerformer ? getEmployee(topPerformer.employee_id) : null;

  return (
    <div>
      {entries.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:16 }}>
          <div className="stat-card">
            <div className="stat-num">{entries.length}</div>
            <div className="stat-label">Entries Logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalJobs.toLocaleString()}</div>
            <div className="stat-label">Total Jobs Done</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: totalComplaints > 0 ? '#dc2626' : '#16a34a' }}>{totalComplaints}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: ratingColor(Math.round(avgRating)) }}>{avgRating.toFixed(1)}/5</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      )}

      {topEmp && (
        <div className="alert-banner" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#166534', marginBottom:16 }}>
          <TrendingUp size={15} style={{ flexShrink:0 }} />
          <div>
            <strong>{topEmp.name}</strong> is the top performer this batch — {topPerformer.jobs_completed} jobs done, {topPerformer.rating}/5 rating ({topPerformer.month}).
          </div>
        </div>
      )}

      <TabHeader title="Monthly Performance" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Log monthly jobs completed, complaints received, and overall rating per employee. Click a name to view their Observation Log.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add Entry</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {entries.map(p => {
          const emp = getEmployee(p.employee_id);
          const rc = ratingColor(p.rating);
          return (
            <div key={p.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div
                  onClick={() => goToObservation && goToObservation(emp?.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, cursor: goToObservation ? 'pointer' : 'default', minWidth:160 }}
                  title="View observation log"
                >
                  <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={38} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color: goToObservation ? '#1B3A2D' : 'inherit' }}>{emp?.name||'—'}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp?.role}</div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Month</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{p.month}</div>
                  </div>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Jobs Done</div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{p.jobs_completed}</div>
                  </div>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Complaints</div>
                    <div style={{ fontSize:15, fontWeight:700, color: p.complaints > 0 ? '#dc2626' : '#16a34a', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      {p.complaints > 0 && <AlertCircle size={13} />}{p.complaints}
                    </div>
                  </div>
                  <span style={{ background:rc+'18', color:rc, border:`1px solid ${rc}40`, fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{p.rating}/5</span>

                  {isAdmin && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-icon" onClick={()=>openEdit(p)}><Edit2 size={13}/></button>
                      <button className="btn-icon danger" onClick={()=>deletePerformance(p.id)}><Trash2 size={13}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <div className="empty-state">No performance records yet.</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal === 'add' ? 'Add Performance Entry' : 'Edit Performance Entry'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Month (e.g. May 2026)<input value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))} /></label>
              <label>Jobs Completed<input type="number" value={form.jobsCompleted} onChange={e => setForm(f=>({...f,jobsCompleted:e.target.value}))} /></label>
              <label>Complaints<input type="number" min="0" value={form.complaints} onChange={e => setForm(f=>({...f,complaints:e.target.value}))} /></label>
              <label>Rating (1–5)<input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(f=>({...f,rating:e.target.value}))} /></label>
            </div>
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
