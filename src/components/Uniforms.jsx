import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todaySA } from '../lib/timezone';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const ITEMS=['Polo Shirt','Hat','Jacket','Pants','Safety Vest','Boots','Gloves'];
const SIZES=['XS','S','M','L','XL','2XL','3XL','One Size'];
const STATUSES=['Good','Needs Replacement','Lost','Returned'];
const empty={ employeeId:'', item:'Polo Shirt', size:'M', qty:1, issued:todaySA(), status:'Good' };

export default function Uniforms() {
  const { data, getEmployee, addUniform, updateUniform, deleteUniform, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const openEdit = (u) => { setForm({ ...u, employeeId: u.employee_id, issued: u.issued_date }); setModal(u); };
  const closeModal = () => setModal(null);
  const save = () => {
    const u = { ...form, employeeId: parseInt(form.employeeId), qty: parseInt(form.qty) };
    if (modal==='add') addUniform(u); else updateUniform(u);
    closeModal();
  };
  const statusColor = (s) => s==='Good'?'#16a34a':s==='Needs Replacement'?'#f59e0b':'#dc2626';

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Uniforms Tracker</h2>
        {isAdmin && <button className="btn-primary" onClick={() => { setForm(empty); setModal('add'); }}><Plus size={16} /> Issue Uniform</button>}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Item</th><th>Size</th><th>Qty</th><th>Issued</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {(data.uniforms||[]).map(u => {
              const emp = getEmployee(u.employee_id);
              return (
                <tr key={u.id}>
                  <td><strong>{emp?.name||'—'}</strong></td>
                  <td>{u.item}</td><td>{u.size}</td><td>{u.qty}</td>
                  <td style={{ fontSize:13, color:'#6b7280' }}>{u.issued_date}</td>
                  <td><span style={{ background:statusColor(u.status)+'20', color:statusColor(u.status), padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{u.status}</span></td>
                  {isAdmin && <td><div style={{ display:'flex', gap:6 }}><button className="btn-icon" onClick={() => openEdit(u)}><Edit2 size={14} /></button><button className="btn-icon danger" onClick={() => deleteUniform(u.id)}><Trash2 size={14} /></button></div></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data.uniforms||[]).length===0 && <div className="empty-state">No uniform records.</div>}
      </div>
      <h3 style={{ marginTop:32, marginBottom:12, fontSize:14, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.05em' }}>Coverage by Employee</h3>
      <div className="card-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {(data.employees||[]).map(emp => {
          const items = (data.uniforms||[]).filter(u => u.employee_id===emp.id);
          return (
            <div key={emp.id} className="emp-card" style={{ padding:'14px 16px' }}>
              <div style={{ fontWeight:700, marginBottom:2 }}>{emp.name}</div>
              <div style={{ color:'#6b7280', fontSize:12, marginBottom:8 }}>{emp.role}</div>
              {items.length===0?<div style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic' }}>No items on file</div>
                :items.map(i=><div key={i.id} style={{ fontSize:13, color:'#2d6a1f', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#2d6a1f', display:'inline-block' }} />{i.item}</div>)
              }
            </div>
          );
        })}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Issue Uniform':'Edit Uniform'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Employee<select value={form.employeeId} onChange={e => setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select…</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Item<select value={form.item} onChange={e => setForm(f=>({...f,item:e.target.value}))}>{ITEMS.map(i=><option key={i}>{i}</option>)}</select></label>
              <label>Size<select value={form.size} onChange={e => setForm(f=>({...f,size:e.target.value}))}>{SIZES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Qty<input type="number" min="1" value={form.qty} onChange={e => setForm(f=>({...f,qty:e.target.value}))} /></label>
              <label>Date Issued<input type="date" value={form.issued} onChange={e => setForm(f=>({...f,issued:e.target.value}))} /></label>
              <label>Status<select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
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
