import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { todaySA, formatDateSA } from '../lib/timezone';
import { ratingColor } from '../lib/statusColors';
import { Plus, Edit2, Trash2, X, Check, Star, ArrowLeft, ShieldCheck } from 'lucide-react';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';
import { idsMatch } from '../lib/ids';
import { NON_TRACKED_ROLES } from '../lib/roles';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const CATS = ['punctuality', 'quality', 'attitude', 'teamwork'];
const empty = { employeeId:'', date:todaySA(), rating:4, punctuality:4, quality:4, attitude:4, teamwork:4, notes:'' };

// Same three-tier idea as the Damages tone function — one place that decides
// color + label so the card tint, the border, and the badge can't drift apart.
function reviewTone(count, avg) {
  if (count === 0) return { bg:'#fff', border:'#e5e7eb', text:'#9ca3af', label:'No reviews yet' };
  if (avg >= 4)     return { bg:'#f0fdf4', border:'#86efac', text:'#166534', label:'Excellent' };
  if (avg >= 3)     return { bg:'#fffbeb', border:'#fde68a', text:'#92400e', label:'Satisfactory' };
  return                   { bg:'#fef2f2', border:'#fecaca', text:'#dc2626', label:'Needs improvement' };
}

function Badge({ count, avg }) {
  const t = reviewTone(count, avg);
  return (
    <span style={{ background:t.bg === '#fff' ? '#f3f4f6' : t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
      {t.label}
    </span>
  );
}

function RatingBar({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
      <span style={{ width:90, fontSize:13, color:'#6b7280', textTransform:'capitalize' }}>{label}</span>
      <div style={{ display:'flex', gap:4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange && onChange(n)} style={{ width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', background:n <= value ? '#2d6a1f' : '#e5e7eb', color:n <= value ? '#fff' : '#6b7280', fontWeight:700, fontSize:13 }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewModal({ modal, form, setForm, eligible, modalEmployee, closeModal, save, saveError }) {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{modal === 'add' ? 'Add Review' : 'Edit Review'}</h3>
            {modalEmployee && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                <Avatar name={modalEmployee.name} photoUrl={modalEmployee.photo_url} size={20} />
                <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>{modalEmployee.name}</span>
              </div>
            )}
          </div>
          <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
        </div>

        {saveError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{saveError}</div>}

        <div className="form-grid">
          {!modalEmployee && (
            <label style={{ gridColumn:'1/-1' }}>Employee
              <select style={inp} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId:e.target.value }))}>
                <option value="">Select...</option>
                {eligible.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
          )}
          <label style={{ gridColumn: modalEmployee ? '1/-1' : 'auto' }}>Review Date
            <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
          </label>
        </div>

        <div style={{ margin:'14px 0' }}>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:8, fontWeight:600 }}>Category Ratings</p>
          <RatingBar label="Overall" value={form.rating} onChange={n => setForm(f => ({ ...f, rating:n }))} />
          {CATS.map(c => <RatingBar key={c} label={c} value={form[c]} onChange={n => setForm(f => ({ ...f, [c]:n }))} />)}
        </div>

        <label style={{ display:'flex', flexDirection:'column', gap:5 }}>Notes
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} rows={3} style={{ ...inp, resize:'none' }} />
        </label>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.employeeId}><Check size={15} /> Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { data, getEmployee, addReview, updateReview, deleteReview, isAdmin } = useApp();
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal]           = useState(null); // 'add' | review object | null
  const [form, setForm]             = useState(empty);
  const [saveError, setSaveError]   = useState('');

  // Same eligibility rule as Damages and Observation Log, so every tab agrees on who shows up.
  const eligible = (data.employees || [])
    .filter(e => !NON_TRACKED_ROLES.includes(e.role))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allReviews = data.reviews || [];

  const reviewsByEmployee = useMemo(() => {
    const map = {};
    allReviews.forEach(review => { (map[review.employee_id] ||= []).push(review); });
    Object.values(map).forEach(list => list.sort((a, b) => (b.review_date || '').localeCompare(a.review_date || '')));
    return map;
  }, [allReviews]);

  const avgOf = (list) => list.length ? Math.round((list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length) * 10) / 10 : null;

  const selected         = eligible.find(e => idsMatch(e.id, selectedId));
  const selectedReviews  = selectedId ? (reviewsByEmployee[selectedId] || []) : [];
  const selectedAvg      = avgOf(selectedReviews);

  // Highlight the top-rated review from the most recent month that has any reviews logged
  const topThisMonth = useMemo(() => {
    if (allReviews.length === 0) return null;
    const latestMonth = [...allReviews].sort((a, b) => b.review_date.localeCompare(a.review_date))[0].review_date.slice(0, 7);
    const thisMonthReviews = allReviews.filter(r => r.review_date.startsWith(latestMonth));
    if (thisMonthReviews.length < 2) return null;
    return [...thisMonthReviews].sort((a, b) => b.rating - a.rating)[0];
  }, [allReviews]);
  const topEmp = topThisMonth ? getEmployee(topThisMonth.employee_id) : null;

  const openAdd = (employeeId) => {
    setForm({ ...empty, employeeId: employeeId ? String(employeeId) : '' });
    setSaveError('');
    setModal('add');
  };
  const openEdit = (r) => {
    setForm({ ...r, employeeId:String(r.employee_id), date:r.review_date });
    setSaveError('');
    setModal(r);
  };
  const closeModal = () => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const r = { ...form, employeeId: parseInt(form.employeeId) };
      if (modal === 'add') await addReview(r); else await updateReview(r);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  const modalEmployee = form.employeeId ? getEmployee(parseInt(form.employeeId)) : null;
  const modalProps = { modal, form, setForm, eligible, modalEmployee, closeModal, save, saveError };

  // ===== PROFILE / DETAIL VIEW =====
  if (selected) {
    return (
      <div>
        <button onClick={() => setSelectedId(null)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontSize:13, fontWeight:600, cursor:'pointer', padding:0, marginBottom:16 }}>
          <ArrowLeft size={15} /> All Employees
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:'18px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <Avatar name={selected.name} photoUrl={selected.photo_url} size={64} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:19, fontWeight:800 }}>{selected.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{selected.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:800, color: selectedReviews.length > 0 ? '#1B3A2D' : '#9ca3af', fontFamily:'Manrope,sans-serif' }}>
              {selectedReviews.length}
            </div>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>running total</div>
            <Badge count={selectedReviews.length} avg={selectedAvg} />
          </div>
        </div>

        {selectedReviews.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <span style={{ background:'#f3f4f6', color:ratingColor(selectedAvg), fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>
              {selectedAvg}/5 average rating
            </span>
            <span style={{ background:'#f3f4f6', color:'#374151', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>
              Latest: {formatDateSA(selectedReviews[0].review_date)}
            </span>
          </div>
        )}

        <TabHeader title="Employee Reviews" settings={<p style={{ fontSize:13, color:'#6b7280' }}>A running thread of reviews for this employee, most recent first.</p>}>
          {isAdmin && <button className="btn-primary" onClick={() => openAdd(selected.id)}><Plus size={15} /> Add Review</button>}
        </TabHeader>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {selectedReviews.map(rev => (
            <div key={rev.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                    <span style={{ color:'#6b7280', fontSize:13 }}>{formatDateSA(rev.review_date)}</span>
                    <span style={{ background:ratingColor(rev.rating) + '20', color:ratingColor(rev.rating), padding:'2px 10px', borderRadius:20, fontWeight:700, fontSize:13 }}>{rev.rating}/5 Overall</span>
                  </div>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:8 }}>
                    {CATS.map(c => <span key={c} style={{ fontSize:13 }}><span style={{ color:'#6b7280', textTransform:'capitalize' }}>{c}: </span><strong style={{ color:ratingColor(rev[c]) }}>{rev[c]}/5</strong></span>)}
                  </div>
                  {rev.notes && <div style={{ fontSize:13, color:'#374151', fontStyle:'italic' }}>{rev.notes}</div>}
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-icon" onClick={() => openEdit(rev)}><Edit2 size={13} /></button>
                    <button className="btn-icon danger" onClick={() => deleteReview(rev.id)}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {selectedReviews.length === 0 && <EmptyState icon={Star} message={`No reviews logged yet for ${selected.name.split(' ')[0]}.`} />}
        </div>

        {modal && <ReviewModal {...modalProps} />}
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div>
      {topEmp && (
        <div className="alert-banner" style={{ background:'#f0fdf4', borderColor:'#86efac', color:'#166534', marginBottom:16 }}>
          <Star size={15} style={{ flexShrink:0 }} />
          <div>
            <strong>{topEmp.name}</strong> earned the highest rating this month — {topThisMonth.rating}/5 overall.
          </div>
        </div>
      )}

      <TabHeader title="Employee Reviews" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Periodic reviews rating punctuality, quality, attitude, and teamwork — tied to raise decisions and performance records. Tap an employee for their full history.</p>}>
        {isAdmin && <button className="btn-primary" onClick={() => openAdd()}><Plus size={15} /> Add Review</button>}
      </TabHeader>

      <div className="card-grid">
        {eligible.map(emp => {
          const list = reviewsByEmployee[emp.id] || [];
          const avg = avgOf(list);
          const tone = reviewTone(list.length, avg);
          return (
            <div key={emp.id} className="emp-card"
              style={{ cursor:'pointer', borderLeft:`4px solid ${tone.border}`, background:tone.bg }}
              onClick={() => setSelectedId(emp.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={38} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color: list.length > 0 ? '#1B3A2D' : '#9ca3af', fontFamily:'Manrope,sans-serif' }}>
                    {list.length}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280' }}>running total</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
                <Badge count={list.length} avg={avg} />
                {avg !== null && <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>{avg}/5 avg</span>}
              </div>
            </div>
          );
        })}
        {eligible.length === 0 && <EmptyState icon={ShieldCheck} message="No eligible employees on file. Add Crew Leaders, Crew Workers, CSRs, VAs, or Office Managers in the Team tab." />}
      </div>

      {modal && <ReviewModal {...modalProps} />}
    </div>
  );
}
