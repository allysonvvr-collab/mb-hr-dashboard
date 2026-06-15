import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const ITEMS=['Polo Shirt','Hat','Jacket','Pants','Safety Vest','Boots','Gloves'];
const SIZES=['XS','S','M','L','XL','2XL','3XL','One Size'];
const STATUSES=['Good','Needs Replacement','Lost','Returned'];
const STATUS_COLORS={ Good:'#16a34a','Needs Replacement':'#f59e0b',Lost:'#dc2626',Returned:'#6b7280' };
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', item:'Polo Shirt', size:'M', qty:1, issued:todaySA(), status:'Good' };

export default function Uniforms() {
  const { data, getEmployee, addUniform, updateUniform, deleteUniform, isAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(empty);

  const openEdit = (u) => { setForm({ ...u, employeeId:u.employee_id, issued:u.issued_date }); setModal(u); };
  const closeModal = () => setModal(null);
  const save = () => { const u={...form,employeeId:parseInt(form.employeeId),qty:parseInt(form.qty)}; if(modal==='add') addUniform(u); else updateUniform(u); closeModal(); };
  const sc = (s) => STATUS_COLORS[s]||'#6b7280';

  return (
    <div>
      <TabHeader title="Uniforms" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Track polo shirts, hats, and gear issued to each crew member.</p>}>
        {isAdmin && <button className="btn-primary" onClick={()=>{ setForm(empty); setModal('add'); }}><Plus size={15}/> Issue Uniform</button>}
      </TabHeader>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {(data.uniforms||[]).map(u => {
          const emp = getEmployee(u.employee_id);
          return (
            <div key={u.id} className="list-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                    <Avatar name={emp?.name||'?'} photoUrl={emp?.photo_url} size={32} />
                    <strong style={{ fontSize:14 }}>{emp?.name||'—'}</strong>
                    <span style={{ background:sc(u.status)+'18', color:sc(u.status), fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{u.status}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#374151' }}>{u.item} · Size {u.size} · Qty {u.qty}</div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>Issued: {u.issued_date}</div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(u)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deleteUniform(u.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(data.uniforms||[]).length===0 && <div className="empty-state">No uniform records.</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Issue Uniform':'Edit Uniform'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            <div className="form-grid">
              <label>Employee<select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}><option value="">Select...</option>{(data.employees||[]).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <label>Item<select style={inp} value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))}>{ITEMS.map(i=><option key={i}>{i}</option>)}</select></label>
              <label>Size<select style={inp} value={form.size} onChange={e=>setForm(f=>({...f,size:e.target.value}))}>{SIZES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Qty<input style={inp} type="number" min="1" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} /></label>
              <label>Date Issued<input style={inp} type="date" value={form.issued} onChange={e=>setForm(f=>({...f,issued:e.target.value}))} /></label>
              <label>Status<select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
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
