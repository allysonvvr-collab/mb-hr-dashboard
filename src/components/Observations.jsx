import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Trash2, X, Check, ArrowLeft, ClipboardList, UserX } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';
import { idsMatch } from '../lib/ids';
import { NON_TRACKED_ROLES } from '../lib/roles';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };

function countLast90Days(observations) {
  const cutoff = new Date(todaySA() + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - 90);
  return observations.filter(o => new Date(o.obs_date + 'T00:00:00') >= cutoff).length;
}

function countBadge(count) {
  const style = count >= 3
    ? { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' }
    : count === 2
    ? { bg:'#fffbeb', border:'#fde68a', text:'#92400e' }
    : { bg:'#f3f4f6', border:'#e5e7eb', text:'#6b7280' };
  return (
    <span style={{ background:style.bg, border:`1px solid ${style.border}`, color:style.text, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
      {count} in 90 days
    </span>
  );
}

export default function Observations({ observationTarget, clearObservationTarget }) {
  const { data, addObservation, deleteObservation, isAdmin } = useApp();
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: todaySA(), notes: '' });

  // If another tab asked to deep-link here for a specific employee, open their profile immediately
  useEffect(() => {
    if (observationTarget) {
      setSelectedId(observationTarget);
      clearObservationTarget && clearObservationTarget();
    }
  }, [observationTarget]);

  const eligible = (data.employees || [])
    .filter(e => !NON_TRACKED_ROLES.includes(e.role))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allObs = data.observations || [];

  const obsByEmployee = useMemo(() => {
    const map = {};
    allObs.forEach(o => { (map[o.employee_id] ||= []).push(o); });
    Object.values(map).forEach(list => list.sort((a, b) => b.obs_date.localeCompare(a.obs_date)));
    return map;
  }, [allObs]);

  const selected = eligible.find(e => idsMatch(e.id, selectedId));
  const selectedObs = selectedId ? (obsByEmployee[selectedId] || []) : [];

  const save = () => {
    addObservation({ employeeId: selectedId, date: form.date, notes: form.notes });
    setForm({ date: todaySA(), notes: '' });
    setModal(false);
  };

  // ===== PROFILE / DETAIL VIEW =====
  if (selected) {
    return (
      <div>
        <button onClick={() => setSelectedId(null)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontSize:13, fontWeight:600, cursor:'pointer', padding:0, marginBottom:16 }}>
          <ArrowLeft size={15} /> All Employees
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, padding:'18px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <Avatar name={selected.name} photoUrl={selected.photo_url} size={64} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:19, fontWeight:800 }}>{selected.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{selected.role}</div>
          </div>
          {countBadge(countLast90Days(selectedObs))}
        </div>

        <TabHeader title="Observation Log" settings={<p style={{ fontSize:13, color:'#6b7280' }}>A running thread of notes for this employee, most recent first.</p>}>
          {isAdmin && <button className="btn-primary" onClick={()=>{ setForm({ date: todaySA(), notes: '' }); setModal(true); }}><Plus size={15}/> Add Observation</button>}
        </TabHeader>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {selectedObs.map(o => (
            <div key={o.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1B3A2D', marginBottom:4 }}>{formatDateSA(o.obs_date)}</div>
                  <div style={{ fontSize:13, color:'#374151', whiteSpace:'pre-wrap' }}>{o.notes}</div>
                </div>
                {isAdmin && <button className="btn-icon danger" onClick={()=>deleteObservation(o.id)}><Trash2 size={13}/></button>}
              </div>
            </div>
          ))}
          {selectedObs.length === 0 && <EmptyState icon={ClipboardList} message={`No observations logged yet for ${selected.name.split(' ')[0]}.`} />}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={()=>setModal(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><h3>Add Observation</h3><button className="btn-icon" onClick={()=>setModal(false)}><X size={18}/></button></div>
              <div className="form-grid">
                <label style={{ gridColumn:'1/-1' }}>Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></label>
                <label style={{ gridColumn:'1/-1' }}>Notes<textarea style={{ ...inp, resize:'vertical' }} rows={5} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="What did you observe?" /></label>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={!form.notes.trim()}><Check size={15}/> Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div>
      <TabHeader title="Observation Log" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Tap an employee to view or add observation notes. Covers field crew, CSRs, and VAs.</p>}>
      </TabHeader>

      <div className="card-grid">
        {eligible.map(emp => {
          const obs = obsByEmployee[emp.id] || [];
          const count90 = countLast90Days(obs);
          return (
            <div key={emp.id} className="emp-card" style={{ cursor:'pointer' }} onClick={()=>setSelectedId(emp.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={38} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                <ClipboardList size={13} color="#9ca3af" />
                <span style={{ fontSize:12, color:'#6b7280' }}>{obs.length} total</span>
                <span style={{ marginLeft:'auto' }}>{countBadge(count90)}</span>
              </div>
            </div>
          );
        })}
        {eligible.length === 0 && <EmptyState icon={UserX} message="No eligible employees on file. Add Crew Leaders, Crew Workers, CSRs, VAs, or Office Managers in the Team tab." />}
      </div>
    </div>
  );
}
