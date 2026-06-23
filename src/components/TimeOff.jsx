import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, Edit2, X, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { statusBadgeStyle } from '../lib/statusColors';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';

const TYPES = ['Vacation', 'Sick', 'Personal', 'Other'];
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', type:'Vacation', startDate:todaySA(), endDate:todaySA(), halfDay:false, status:'Pending', notes:'' };
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Inclusive whole-day count between two YYYY-MM-DD strings
function calcWholeDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

// Final days total, accounting for the half-day knock-off
function calcDays(start, end, halfDay) {
  const whole = calcWholeDays(start, end);
  return halfDay ? Math.max(whole - 0.5, 0.5) : whole;
}

// Build the display string: "06/19/2026" or "06/30/2026 – 07/06/2026"
function formatRange(start, end) {
  if (!start) return '—';
  if (!end || end === start) return formatDateSA(start);
  return `${formatDateSA(start)} – ${formatDateSA(end)}`;
}

function daysLabel(days, isSingleDay) {
  if (isSingleDay && days === 0.5) return 'Half Day';
  if (days % 1 === 0.5) return `${days} days (incl. 1 half day)`;
  return `${days} day${days > 1 ? 's' : ''}`;
}

// Every calendar day a request covers, as YYYY-MM-DD strings — this is what
// lights up the day cell, regardless of how many days the request spans.
function expandRange(start, end) {
  if (!start) return [];
  const dates = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date((end || start) + 'T00:00:00');
  while (cur <= last) {
    dates.push(dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function RequestRow({ t, isAdmin, onEdit, onDelete, onSetStatus }) {
  const { getEmployee } = useApp();
  const emp = getEmployee(t.employee_id);
  const single = t.start_date && t.start_date === t.end_date;
  return (
    <div className="list-card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <Avatar name={emp?.name || '?'} photoUrl={emp?.photo_url} size={26} />
            <strong style={{ fontSize:14 }}>{emp?.name || '—'}</strong>
            <span style={statusBadgeStyle(t.status)}>{t.status}</span>
            {t.half_day && (
              <span style={{ background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
                {single ? 'Half Day' : '+ Half Day'}
              </span>
            )}
          </div>
          <div style={{ fontSize:13, color:'#374151', marginBottom:2 }}>
            {t.type} · {t.start_date ? formatRange(t.start_date, t.end_date) : t.dates} · {daysLabel(t.days, single)}
          </div>
          {t.notes && t.notes !== '—' && <div style={{ fontSize:12, color:'#6b7280' }}>{t.notes}</div>}
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {isAdmin && t.status === 'Pending' && (
            <>
              <button className="btn-sm green" onClick={() => onSetStatus(t, 'Approved')}>Approve</button>
              <button className="btn-sm red" onClick={() => onSetStatus(t, 'Denied')}>Deny</button>
            </>
          )}
          {isAdmin && <button className="btn-icon" onClick={() => onEdit(t)}><Edit2 size={13} /></button>}
          {isAdmin && <button className="btn-icon danger" onClick={() => onDelete(t.id)}><Trash2 size={13} /></button>}
        </div>
      </div>
    </div>
  );
}

function RequestsPopup({ title, requests, isAdmin, onClose, onEdit, onDelete, onSetStatus }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{title}</h3><button className="btn-icon" onClick={onClose}><X size={18} /></button></div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {requests.map(t => <RequestRow key={t.id} t={t} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} onSetStatus={onSetStatus} />)}
          {requests.length === 0 && <EmptyState icon={Clock} message="Nothing here." />}
        </div>
      </div>
    </div>
  );
}

function MonthCalendar({ year, monthIndex, dateMap, onAdd, onDayClick }) {
  const monthName = new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month:'long' });
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const numDays = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  return (
    <div className="month-cal">
      <div className="month-cal-header">
        <span>{monthName}</span>
        <button className="month-cal-add" onClick={() => onAdd(monthIndex)} title={`Add request in ${monthName}`}>
          <Plus size={13} />
        </button>
      </div>
      <div className="month-cal-weekdays">{WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="month-cal-days">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const key = dateKey(year, monthIndex, d);
          const entries = dateMap[key];
          return (
            <button key={i} type="button" className={`cal-day${entries ? ' has-entries' : ''}`}
              onClick={() => entries && onDayClick(key)} disabled={!entries}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TimeOff() {
  const { data, addTimeOff, updateTimeOff, deleteTimeOff, isAdmin } = useApp();
  const [year, setYear]       = useState(() => parseInt(todaySA().slice(0, 4), 10));
  const [modal, setModal]     = useState(false); // false | 'add' | timeoff record (edit)
  const [form, setForm]       = useState(empty);
  const [popup, setPopup]     = useState(null); // { title, requests } | null

  const allTimeOff = data.timeOff || [];
  const pending = allTimeOff.filter(t => t.status === 'Pending');
  const isSingleDay = form.startDate === form.endDate;
  const computedDays = calcDays(form.startDate, form.endDate, form.halfDay);

  // Every day that has at least one non-denied request, mapped to the list of
  // requests covering it — this is what lights up a calendar cell.
  const dateMap = useMemo(() => {
    const map = {};
    allTimeOff.forEach(t => {
      if (t.status === 'Denied') return;
      expandRange(t.start_date, t.end_date).forEach(d => { (map[d] ||= []).push(t); });
    });
    return map;
  }, [allTimeOff]);

  const handleStartDate = (val) => {
    setForm(f => ({ ...f, startDate: val, endDate: (!f.endDate || f.endDate < val) ? val : f.endDate }));
  };
  const handleEndDate = (val) => setForm(f => ({ ...f, endDate: val }));

  const openAdd = (monthIndex) => {
    if (monthIndex !== undefined) {
      const first = dateKey(year, monthIndex, 1);
      setForm({ ...empty, startDate:first, endDate:first });
    } else {
      setForm(empty);
    }
    setModal('add');
  };
  const openEdit = (t) => {
    setForm({ id:t.id, employeeId:String(t.employee_id), type:t.type, startDate:t.start_date, endDate:t.end_date, halfDay:t.half_day, status:t.status, notes:t.notes || '' });
    setModal(t);
    setPopup(null); // editing replaces whatever popup it was opened from
  };
  const closeModal = () => setModal(false);

  const save = async () => {
    const payload = {
      ...form,
      employeeId: parseInt(form.employeeId),
      dates: formatRange(form.startDate, form.endDate),
      days: calcDays(form.startDate, form.endDate, form.halfDay),
    };
    if (modal === 'add') await addTimeOff(payload); else await updateTimeOff(payload);
    closeModal();
  };

  const setStatus = (t, status) => updateTimeOff({ id:t.id, employeeId:t.employee_id, startDate:t.start_date, endDate:t.end_date, halfDay:t.half_day, type:t.type, dates:t.dates, days:t.days, notes:t.notes, status });
  const remove = (id) => { deleteTimeOff(id); setPopup(p => p ? { ...p, requests:p.requests.filter(r => r.id !== id) } : p); };

  const openDay = (key) => {
    const requests = dateMap[key] || [];
    const d = new Date(key + 'T00:00:00');
    setPopup({ title: d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }), requests });
  };
  const openPending = () => setPopup({ title:'Pending Approval', requests:pending });

  return (
    <div>
      {pending.length > 0 && (
        <div className="alert-banner" style={{ background:'#fffbeb', borderColor:'#f59e0b', color:'#92400e', cursor:'pointer' }} onClick={openPending}>
          <Clock size={15} style={{ flexShrink:0 }} />
          <strong>{pending.length} request{pending.length > 1 ? 's' : ''} pending approval</strong>
          <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, textDecoration:'underline' }}>Review</span>
        </div>
      )}

      <TabHeader title="Time Off" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Tap a highlighted date to see who's off and why. Use the + next to any month to log a new request.</p>}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button className="btn-icon" onClick={() => setYear(y => y - 1)} title="Previous year"><ChevronLeft size={15} /></button>
          <span style={{ fontSize:14, fontWeight:700, minWidth:48, textAlign:'center' }}>{year}</span>
          <button className="btn-icon" onClick={() => setYear(y => y + 1)} title="Next year"><ChevronRight size={15} /></button>
        </div>
        {isAdmin && <button className="btn-primary" onClick={() => openAdd()}><Plus size={15} /> Add Request</button>}
      </TabHeader>

      <div className="timeoff-cal-grid">
        {Array.from({ length:12 }, (_, m) => (
          <MonthCalendar key={m} year={year} monthIndex={m} dateMap={dateMap} onAdd={openAdd} onDayClick={openDay} />
        ))}
      </div>

      {popup && (
        <RequestsPopup
          title={popup.title}
          requests={popup.requests}
          isAdmin={isAdmin}
          onClose={() => setPopup(null)}
          onEdit={openEdit}
          onDelete={remove}
          onSetStatus={(t, status) => { setStatus(t, status); setPopup(p => p ? { ...p, requests:p.requests.map(r => r.id === t.id ? { ...r, status } : r) } : p); }}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal === 'add' ? 'Add Time Off Request' : 'Edit Time Off Request'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId:e.target.value }))}><option value="">Select...</option>{(data.employees || []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Type<select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value }))}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
              <label>Start Date<input style={inp} type="date" value={form.startDate} onChange={e => handleStartDate(e.target.value)} /></label>
              <label>End Date<input style={inp} type="date" value={form.endDate} min={form.startDate} onChange={e => handleEndDate(e.target.value)} /></label>

              <label style={{ gridColumn:'1/-1', display:'flex', flexDirection:'row', alignItems:'center', gap:10, padding:'8px 0', cursor:'pointer' }} onClick={() => setForm(f => ({ ...f, halfDay:!f.halfDay }))}>
                <span style={{
                  width:20, height:20, borderRadius:5, flexShrink:0,
                  border: form.halfDay ? '2px solid #1B3A2D' : '2px solid #d1d5db',
                  background: form.halfDay ? '#1B3A2D' : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s, border-color 0.15s',
                }}>
                  {form.halfDay && <Check size={14} color="#fff" strokeWidth={3} />}
                </span>
                <span>{isSingleDay ? 'This is a half day' : 'Last day is a half day'}</span>
              </label>

              <label>Status<select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))}>{['Pending', 'Approved', 'Denied'].map(s => <option key={s}>{s}</option>)}</select></label>
              <label>Total Days<input style={{ ...inp, background:'#f9fafb' }} value={computedDays} disabled /></label>

              <label style={{ gridColumn:'1/-1' }}>Notes<input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} placeholder="Optional" /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.employeeId}><Check size={15} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
