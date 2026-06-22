import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, TrendingUp, BarChart3 } from 'lucide-react';
import { TabHeader } from './TabHeader';
import { ratingColor } from '../lib/statusColors';
import EmptyState from './EmptyState';

const empty = { employeeId:'', month:'', jobsCompleted:'', complaints:0, rating:4 };

export default function Performance({ goToObservation }) {
  const { data, getEmployee, addPerformance, updatePerformance, deletePerformance, isAdmin } = useApp();
  const [modal, setModal] = useState(null); // 'add' | entry object | null
  const [form, setForm] = useState(empty);
  const [saveError, setSaveError] = useState('');

  const entries = data.performance || [];
  const employees = data.employees || [];

  const openAdd  = () => { setForm(empty); setSaveError(''); setModal('add'); };
  const openAddFor = (employeeId) => { setForm({ ...empty, employeeId: String(employeeId) }); setSaveError(''); setModal('add'); };
  const openEdit = (p) => { setForm({ employeeId:p.employee_id, month:p.month, jobsCompleted:p.jobs_completed, complaints:p.complaints, rating:p.rating, id:p.id }); setSaveError(''); setModal(p); };
  const closeModal = () => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const payload = { ...form, employeeId:parseInt(form.employeeId), jobsCompleted:parseInt(form.jobsCompleted)||0, complaints:parseInt(form.complaints)||0, rating:parseInt(form.rating) };
      if (modal === 'add') await addPerformance(payload); else await updatePerformance(payload);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  // Summary stats across all logged entries
  const totalJobs = entries.reduce((s, p) => s + Number(p.jobs_completed || 0), 0);
  const totalComplaints = entries.reduce((s, p) => s + Number(p.complaints || 0), 0);
  const avgRating = entries.length ? (entries.reduce((s, p) => s + Number(p.rating || 0), 0) / entries.length) : 0;

  // Top performer this batch — highest rating, tie-broken by fewest complaints
  const topPerformer = entries.length
    ? [...entries].sort((a, b) => (b.rating - a.rating) || (a.jobs_completed - b.jobs_completed))[0]
    : null;
  const topEmp = topPerformer ? getEmployee(topPerformer.employee_id) : null;

  // Every employee gets a row — their most recent logged entry (if any) is shown, otherwise blanks
  const rows = employees
    .map(emp => {
      const empEntries = entries.filter(p => p.employee_id === emp.id).sort((a,b)=>(b.month||'').localeCompare(a.month||''));
      return { emp, entry: empEntries[0] || null };
    })
    .sort((a,b) => a.emp.name.localeCompare(b.emp.name));

  return (
    <div>
      {entries.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:16 }}>
          <div className="stat-card">
            <div className="stat-num">{entries.length}</div>
            <div className="stat-label">Entries Logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: totalJobs > 0 ? '#dc2626' : '#16a34a' }}>{totalJobs.toLocaleString()}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color:'#374151' }}>{totalComplaints}</div>
            <div className="stat-label">Total Observations</div>
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
            <strong>{topEmp.name}</strong> is the top performer this batch — {topPerformer.jobs_completed} complaint{topPerformer.jobs_completed!==1?'s':''}, {topPerformer.rating}/5 rating ({topPerformer.month}).
          </div>
        </div>
      )}

      <TabHeader title="Monthly Performance" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Every employee is listed below. Click a name to view their Observation Log, or use Add Entry to log a new month.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add Entry</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {rows.map(({ emp, entry }) => {
          const hasEntry = !!entry;
          const rc = hasEntry ? ratingColor(entry.rating) : '#9ca3af';
          return (
            <div key={emp.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div
                  onClick={() => goToObservation && goToObservation(emp.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, cursor: goToObservation ? 'pointer' : 'default', minWidth:160 }}
                  title="View observation log"
                >
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={38} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color: goToObservation ? '#1B3A2D' : 'inherit' }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Month</div>
                    <div style={{ fontSize:13, fontWeight:600, color: hasEntry ? 'inherit' : '#9ca3af' }}>{hasEntry ? entry.month : '—'}</div>
                  </div>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Complaints</div>
                    <div style={{ fontSize:15, fontWeight:700, color: hasEntry ? (entry.jobs_completed > 0 ? '#dc2626' : '#16a34a') : '#9ca3af' }}>
                      {hasEntry ? entry.jobs_completed : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign:'center', minWidth:64 }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Observations</div>
                    <div style={{ fontSize:15, fontWeight:700, color: hasEntry ? (entry.complaints > 0 ? '#374151' : '#9ca3af') : '#9ca3af' }}>
                      {hasEntry ? entry.complaints : '—'}
                    </div>
                  </div>
                  {hasEntry
                    ? <span style={{ background:rc+'18', color:rc, border:`1px solid ${rc}40`, fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{entry.rating}/5</span>
                    : <span style={{ background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb', fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>—/5</span>
                  }

                  {isAdmin && (
                    <div style={{ display:'flex', gap:6 }}>
                      {hasEntry
                        ? <>
                            <button className="btn-icon" onClick={()=>openEdit(entry)}><Edit2 size={13}/></button>
                            <button className="btn-icon danger" onClick={()=>deletePerformance(entry.id)}><Trash2 size={13}/></button>
                          </>
                        : <button className="btn-icon" title="Log an entry for this employee" onClick={()=>openAddFor(emp.id)}><Plus size={13}/></button>
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState icon={BarChart3} message="No employees on file yet. Add them in the Team tab." />}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal === 'add' ? 'Add Performance Entry' : 'Edit Performance Entry'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Month (e.g. May 2026)<input value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))} /></label>
              <label>Complaints<input type="number" value={form.jobsCompleted} onChange={e => setForm(f=>({...f,jobsCompleted:e.target.value}))} /></label>
              <label>Observations<input type="number" min="0" value={form.complaints} onChange={e => setForm(f=>({...f,complaints:e.target.value}))} /></label>
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
