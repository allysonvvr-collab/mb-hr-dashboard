import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, TrendingUp, BarChart3 } from 'lucide-react';
import { TabHeader } from './TabHeader';
import { ratingColor } from '../lib/statusColors';
import { formatMonthSA, formatMonthOnlySA, thisMonthSA } from '../lib/timezone';
import EmptyState from './EmptyState';

const empty = { employeeId:'', month: thisMonthSA(), jobsCompleted:'', complaints:0, rating:4 };

// Owner and Operations Manager don't get performance entries — exclude from this list,
// matching the same exclusion used in the Observation Log.
const EXCLUDED_ROLES = ['Owner', 'Operations Manager'];

export default function Performance({ goToObservation }) {
  const { data, getEmployee, addPerformance, updatePerformance, deletePerformance, isAdmin } = useApp();
  const [modal, setModal] = useState(null); // 'add' | entry object | null
  const [form, setForm] = useState(empty);
  const [saveError, setSaveError] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  const entries = data.performance || [];
  const employees = (data.employees || []).filter(e => !EXCLUDED_ROLES.includes(e.role));
  const roles = [...new Set(employees.map(e => e.role))].sort();

  // Legacy entries may have free-text months like "May 2026" instead of "2026-05" —
  // convert on edit so the native month picker doesn't show blank for old data.
  const toMonthInputValue = (m) => {
    if (!m) return thisMonthSA();
    if (/^\d{4}-\d{2}$/.test(m)) return m; // already correct format
    const parsed = new Date(`1 ${m}`);
    if (isNaN(parsed)) return thisMonthSA();
    return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}`;
  };

  const openAdd  = () => { setForm(empty); setSaveError(''); setModal('add'); };
  const openAddFor = (employeeId) => { setForm({ ...empty, employeeId: String(employeeId) }); setSaveError(''); setModal('add'); };
  const openEdit = (p) => { setForm({ employeeId:p.employee_id, month: toMonthInputValue(p.month), jobsCompleted:p.jobs_completed, complaints:p.complaints, rating:p.rating, id:p.id }); setSaveError(''); setModal(p); };
  const closeModal = () => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const payload = { ...form, employeeId:parseInt(form.employeeId), jobsCompleted:parseInt(form.jobsCompleted)||0, complaints:parseInt(form.complaints)||0, rating:parseInt(form.rating) };
      if (modal === 'add') await addPerformance(payload); else await updatePerformance(payload);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  // Summary stats across all logged entries (unaffected by the role filter — always the full picture)
  const totalJobs = entries.reduce((s, p) => s + Number(p.jobs_completed || 0), 0);
  const totalComplaints = entries.reduce((s, p) => s + Number(p.complaints || 0), 0);
  const avgRating = entries.length ? (entries.reduce((s, p) => s + Number(p.rating || 0), 0) / entries.length) : 0;

  // Top performer this batch — highest rating, tie-broken by fewest complaints
  const topPerformer = entries.length
    ? [...entries].sort((a, b) => (b.rating - a.rating) || (a.jobs_completed - b.jobs_completed))[0]
    : null;
  const topEmp = topPerformer ? getEmployee(topPerformer.employee_id) : null;

  // Every eligible employee gets a row — their most recent logged entry (if any) is shown, otherwise blanks
  const rows = employees
    .filter(emp => filterRole === 'All' || emp.role === filterRole)
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
            <strong>{topEmp.name}</strong> is the top performer this batch — {topPerformer.jobs_completed} complaint{topPerformer.jobs_completed!==1?'s':''}, {topPerformer.rating}/5 rating ({formatMonthSA(topPerformer.month)}).
          </div>
        </div>
      )}

      <TabHeader title="Monthly Performance" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Every employee is listed below. Click a name to view their Observation Log, or use Add Entry to log a new month.</p>}>
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Add Entry</button>}
      </TabHeader>

      {/* Role filter chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {['All', ...roles].map(r => {
          const active = filterRole === r;
          const count = r === 'All' ? employees.length : employees.filter(e=>e.role===r).length;
          return (
            <button key={r} onClick={()=>setFilterRole(r)}
              style={{ padding:'4px 10px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                background: active ? '#1B3A2D' : '#fff', color: active ? '#fff' : '#374151', borderColor: active ? '#1B3A2D' : '#e5e7eb' }}>
              {r} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {rows.map(({ emp, entry }) => {
          const hasEntry = !!entry;
          const rc = hasEntry ? ratingColor(entry.rating) : '#9ca3af';
          return (
            <div key={emp.id} className="list-card">
              <div className="perf-row">
                <div
                  className="perf-identity"
                  onClick={() => goToObservation && goToObservation(emp.id)}
                  style={{ cursor: goToObservation ? 'pointer' : 'default' }}
                  title="View observation log"
                >
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={38} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color: goToObservation ? '#1B3A2D' : 'inherit' }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                </div>

                <div className="perf-stats">
                  <div className="perf-stat">
                    <div className="perf-stat-label">Month</div>
                    <div className="perf-stat-value" style={{ fontSize:13, color: hasEntry ? 'inherit' : '#9ca3af' }}>{hasEntry ? formatMonthOnlySA(entry.month) : '—'}</div>
                  </div>
                  <div className="perf-stat">
                    <div className="perf-stat-label">Complaints</div>
                    <div className="perf-stat-value" style={{ color: hasEntry ? (entry.jobs_completed > 0 ? '#dc2626' : '#16a34a') : '#9ca3af' }}>
                      {hasEntry ? entry.jobs_completed : '—'}
                    </div>
                  </div>
                  <div className="perf-stat">
                    <div className="perf-stat-label">Observations</div>
                    <div className="perf-stat-value" style={{ color: hasEntry ? (entry.complaints > 0 ? '#374151' : '#9ca3af') : '#9ca3af' }}>
                      {hasEntry ? entry.complaints : '—'}
                    </div>
                  </div>
                </div>

                <div className="perf-bottom-row">
                  {hasEntry
                    ? <span className="perf-rating" style={{ background:rc+'18', color:rc, border:`1px solid ${rc}40` }}>{entry.rating}/5</span>
                    : <span className="perf-rating" style={{ background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb' }}>—/5</span>
                  }

                  {isAdmin && (
                    <div className="perf-actions">
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
        {rows.length === 0 && <EmptyState icon={BarChart3} message="No employees match this filter." />}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal === 'add' ? 'Add Performance Entry' : 'Edit Performance Entry'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Month<input type="month" value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))} /></label>
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
