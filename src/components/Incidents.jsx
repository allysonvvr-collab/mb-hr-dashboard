import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, ArrowLeft, ShieldCheck } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';
import { idsMatch } from '../lib/ids';
import { NON_TRACKED_ROLES } from '../lib/roles';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', crew:'', date:todaySA(), description:'', cost:'', status:'Open', docSigned:false };

// Exact crew roster, used everywhere a crew needs to be picked.
const CREWS = ['MC1', 'MC2', 'MC3', 'MC4', 'FWC1', 'FWC2', 'Christmas'];

// Single source of truth for the "1 = yellow, 2+ = red" rule, so the card
// border, the card background tint, and the little badge can never drift
// out of sync with each other.
function damageTone(count) {
  if (count >= 2) return { bg:'#fef2f2', border:'#fecaca', text:'#dc2626', label:`${count} damages` };
  if (count === 1) return { bg:'#fffbeb', border:'#fde68a', text:'#92400e', label:'1 damage' };
  return { bg:'#fff', border:'#e5e7eb', text:'#9ca3af', label:'No damages' };
}

function Badge({ count }) {
  const t = damageTone(count);
  return (
    <span style={{ background:t.bg==='#fff'?'#f3f4f6':t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
      {t.label}
    </span>
  );
}

function DamageModal({ modal, form, setForm, eligible, modalEmployee, closeModal, save, saveError }) {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{modal === 'add' ? 'Log Damage' : 'Edit Damage'}</h3>
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
          {/* Employee only shows up as a field when we got here without already knowing who —
              e.g. from the global "Log Damage" button. Click in from someone's profile and
              this disappears entirely; their name is already shown above instead. */}
          {!modalEmployee && (
            <label style={{ gridColumn:'1/-1' }}>Employee
              <select style={inp} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId:e.target.value }))}>
                <option value="">Select...</option>
                {eligible.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
          )}

          <label>Crew
            <select style={inp} value={form.crew} onChange={e => setForm(f => ({ ...f, crew:e.target.value }))}>
              <option value="">Select...</option>
              {CREWS.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label>Date<input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} /></label>

          <label style={{ gridColumn:'1/-1' }}>Description
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} rows={3} style={{ ...inp, resize:'none' }} placeholder="Describe what happened..." />
          </label>

          <label>Cost ($)<input style={inp} type="number" step="1" min="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost:e.target.value }))} placeholder="0" /></label>

          <label>Status
            <div style={{ display:'flex', gap:6 }}>
              {['Open', 'Closed'].map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status:s }))}
                  style={{
                    flex:1, padding:'10px 0', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer',
                    border: `1px solid ${form.status===s ? 'transparent' : '#d1d5db'}`,
                    background: form.status===s ? (s==='Open' ? '#f59e0b' : '#16a34a') : '#fff',
                    color: form.status===s ? '#fff' : '#374151',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:10, gridColumn:'1/-1', cursor:'pointer' }} onClick={() => setForm(f => ({ ...f, docSigned:!f.docSigned }))}>
            <span style={{
              width:20, height:20, borderRadius:5, flexShrink:0,
              border: form.docSigned ? '2px solid #1B3A2D' : '2px solid #d1d5db',
              background: form.docSigned ? '#1B3A2D' : '#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background 0.15s, border-color 0.15s',
            }}>
              {form.docSigned && <Check size={14} color="#fff" strokeWidth={3} />}
            </span>
            <span>Documentation Signed</span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.employeeId || !form.description.trim()}><Check size={15} /> Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Incidents() {
  const { data, getEmployee, addIncident, updateIncident, deleteIncident, isAdmin } = useApp();
  const [selectedId, setSelectedId] = useState(null);
  const [viewAll, setViewAll]       = useState(false); // top-level toggle: by-employee grid vs one flat chronological log
  const [modal, setModal]           = useState(null);  // 'add' | incident object | null
  const [form, setForm]             = useState(empty);
  const [saveError, setSaveError]   = useState('');

  // Same eligibility rule as the Observation Log, so the two tabs always agree
  // on who shows up — Owner/Ops Manager are leadership, not tracked.
  const eligible = (data.employees || [])
    .filter(e => !NON_TRACKED_ROLES.includes(e.role))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allIncidents = data.incidents || [];

  const byEmployee = useMemo(() => {
    const map = {};
    allIncidents.forEach(i => { (map[i.employee_id] ||= []).push(i); });
    Object.values(map).forEach(list => list.sort((a, b) => (b.incident_date || '').localeCompare(a.incident_date || '')));
    return map;
  }, [allIncidents]);

  const selected           = eligible.find(e => idsMatch(e.id, selectedId));
  const selectedIncidents  = selectedId ? (byEmployee[selectedId] || []) : [];

  const companyTotalCost = allIncidents.reduce((s, i) => s + Number(i.cost || 0), 0);
  const companyOpen      = allIncidents.filter(i => i.status === 'Open').length;

  const openAdd = (employeeId) => {
    setForm({ ...empty, employeeId: employeeId ? String(employeeId) : '' });
    setSaveError('');
    setModal('add');
  };
  const openEdit = (i) => {
    setForm({ employeeId:String(i.employee_id), crew:i.crew || '', date:i.incident_date, description:i.description || '', cost:i.cost, status:i.status, docSigned:i.doc_signed, id:i.id });
    setSaveError('');
    setModal(i);
  };
  const closeModal = () => { setModal(null); setSaveError(''); };

  const save = async () => {
    try {
      const payload = { ...form, employeeId: parseInt(form.employeeId), cost: parseFloat(form.cost) || 0 };
      if (modal === 'add') await addIncident(payload); else await updateIncident(payload);
      closeModal();
    } catch (e) { setSaveError(e.message || 'Save failed. Please try again.'); }
  };

  const modalEmployee = form.employeeId ? getEmployee(parseInt(form.employeeId)) : null;

  const modalProps = { modal, form, setForm, eligible, modalEmployee, closeModal, save, saveError };

  // ===== PROFILE / DETAIL VIEW =====
  if (selected) {
    const totalCost = selectedIncidents.reduce((s, i) => s + Number(i.cost || 0), 0);
    const openCount = selectedIncidents.filter(i => i.status === 'Open').length;
    const unsignedCount = selectedIncidents.filter(i => !i.doc_signed).length;

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
            <div style={{ fontSize:18, fontWeight:800, color: selectedIncidents.length > 0 ? '#dc2626' : '#9ca3af', fontFamily:'Manrope,sans-serif' }}>
              {selectedIncidents.length}
            </div>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>running total</div>
            <Badge count={selectedIncidents.length} />
          </div>
        </div>

        {selectedIncidents.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {totalCost > 0 && <span style={{ background:'#fef2f2', color:'#dc2626', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>${totalCost.toLocaleString()} total cost</span>}
            {openCount > 0 && <span style={{ background:'#fffbeb', color:'#92400e', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{openCount} open</span>}
            {unsignedCount > 0 && <span style={{ background:'#f3f4f6', color:'#374151', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>{unsignedCount} awaiting signature</span>}
          </div>
        )}

        <TabHeader title="Damages" settings={<p style={{ fontSize:13, color:'#6b7280' }}>A running thread of damage cases for this employee, most recent first.</p>}>
          {isAdmin && <button className="btn-primary" onClick={() => openAdd(selected.id)}><Plus size={15} /> Log Damage</button>}
        </TabHeader>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {selectedIncidents.map(i => (
            <div key={i.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1B3A2D' }}>{formatDateSA(i.incident_date)}</span>
                    <span style={{ fontWeight:800, color:'#dc2626', fontSize:14, fontFamily:'Manrope,sans-serif' }}>${Number(i.cost || 0).toLocaleString()}</span>
                    <span style={{ background:i.status === 'Closed' ? '#dcfce7' : '#fef3c7', color:i.status === 'Closed' ? '#166534' : '#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{i.status}</span>
                    {i.crew && <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{i.crew}</span>}
                  </div>
                  <div style={{ fontSize:13, color:'#374151', whiteSpace:'pre-wrap', marginBottom:6 }}>{i.description}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:i.doc_signed ? '#16a34a' : '#f59e0b' }}>
                    {i.doc_signed ? '✓ Documentation signed' : 'Awaiting employee signature'}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-icon" onClick={() => openEdit(i)}><Edit2 size={13} /></button>
                    <button className="btn-icon danger" onClick={() => deleteIncident(i.id)}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {selectedIncidents.length === 0 && <EmptyState icon={ShieldCheck} message={`No damages logged yet for ${selected.name.split(' ')[0]}.`} />}
        </div>

        {modal && <DamageModal {...modalProps} />}
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div>
      <TabHeader
        title="Damages"
        settings={
          <div style={{ fontSize:13, color:'#6b7280' }}>
            <p>Log all vehicle damage, property damage, or workplace accidents.</p>
            <p style={{ marginTop:8 }}>Tap an employee for their full history, or switch to <strong>All Damages</strong> for one chronological log.</p>
          </div>
        }
      >
        <div style={{ textAlign:'right', marginRight:6 }}>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:'Manrope,sans-serif', color: allIncidents.length > 0 ? '#dc2626' : '#9ca3af', lineHeight:1 }}>
            {allIncidents.length}
          </div>
          <div style={{ fontSize:10, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>Company Total</div>
          {companyTotalCost > 0 && (
            <div style={{ fontSize:11, color:'#dc2626', fontWeight:600, marginTop:2, whiteSpace:'nowrap' }}>
              ${companyTotalCost.toLocaleString()}{companyOpen > 0 ? ` · ${companyOpen} open` : ''}
            </div>
          )}
        </div>

        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:8, padding:2, gap:2 }}>
          <button onClick={() => setViewAll(false)}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: !viewAll ? '#fff' : 'none', color: !viewAll ? '#1B3A2D' : '#6b7280', boxShadow: !viewAll ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            By Employee
          </button>
          <button onClick={() => setViewAll(true)}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: viewAll ? '#fff' : 'none', color: viewAll ? '#1B3A2D' : '#6b7280', boxShadow: viewAll ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            All Damages
          </button>
        </div>

        {isAdmin && <button className="btn-primary" onClick={() => openAdd()}><Plus size={15} /> Log Damage</button>}
      </TabHeader>

      {!viewAll && (
        <div className="card-grid">
          {eligible.map(emp => {
            const list = byEmployee[emp.id] || [];
            const tone = damageTone(list.length);
            const cost = list.reduce((s, i) => s + Number(i.cost || 0), 0);
            const open = list.filter(i => i.status === 'Open').length;
            return (
              <div key={emp.id} className="emp-card"
                style={{ cursor:'pointer', borderLeft:`4px solid ${tone.border}`, background: tone.bg }}
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
                    <div style={{ fontSize:18, fontWeight:800, color: list.length > 0 ? '#dc2626' : '#9ca3af', fontFamily:'Manrope,sans-serif' }}>
                      {list.length}
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>running total</div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
                  <Badge count={list.length} />
                  {cost > 0 && <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>${cost.toLocaleString()}</span>}
                  {open > 0 && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{open} open</span>}
                </div>
              </div>
            );
          })}
          {eligible.length === 0 && <EmptyState icon={ShieldCheck} message="No eligible employees on file. Add Crew Leaders, Crew Workers, CSRs, VAs, or Office Managers in the Team tab." />}
        </div>
      )}

      {viewAll && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {allIncidents.slice().sort((a, b) => (b.incident_date || '').localeCompare(a.incident_date || '')).map(inc => {
            const emp = getEmployee(inc.employee_id);
            return (
              <div key={inc.id} className="list-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                      <Avatar name={emp?.name || '?'} photoUrl={emp?.photo_url} size={28} />
                      <strong style={{ fontSize:14, cursor: emp ? 'pointer' : 'default' }} onClick={() => emp && setSelectedId(emp.id)}>{emp?.name || '—'}</strong>
                      <span style={{ fontSize:12, color:'#6b7280' }}>{formatDateSA(inc.incident_date)}</span>
                      <span style={{ fontWeight:800, color:'#dc2626', fontSize:14, fontFamily:'Manrope,sans-serif' }}>${Number(inc.cost || 0).toLocaleString()}</span>
                      <span style={{ background:inc.status === 'Closed' ? '#dcfce7' : '#fef3c7', color:inc.status === 'Closed' ? '#166534' : '#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{inc.status}</span>
                      {inc.crew && <span style={{ background:'#f3f4f6', color:'#374151', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{inc.crew}</span>}
                    </div>
                    <div style={{ fontSize:13, color:'#374151', marginBottom:4 }}>{inc.description}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:inc.doc_signed ? '#16a34a' : '#f59e0b' }}>
                      {inc.doc_signed ? '✓ Documentation signed' : 'Awaiting employee signature'}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button className="btn-icon" onClick={() => openEdit(inc)}><Edit2 size={13} /></button>
                      <button className="btn-icon danger" onClick={() => deleteIncident(inc.id)}><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {allIncidents.length === 0 && <EmptyState icon={ShieldCheck} message="No damages on record." />}
        </div>
      )}

      {modal && <DamageModal {...modalProps} />}
    </div>
  );
}
