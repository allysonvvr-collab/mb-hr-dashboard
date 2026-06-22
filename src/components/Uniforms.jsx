import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Shirt } from 'lucide-react';
import { todaySA, formatDateSA } from '../lib/timezone';
import { statusBadgeStyle } from '../lib/statusColors';
import { TabHeader } from './TabHeader';
import EmptyState from './EmptyState';

const ITEMS=['Polo Shirt','Hat','Jacket','Pants','Safety Vest','Boots','Gloves'];
const SIZES=['XS','S','M','L','XL','2XL','3XL','One Size'];
const STATUSES=['Good','Needs Replacement','Lost','Returned'];
const LOW_STOCK_THRESHOLD = 5;
const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', boxSizing:'border-box' };
const empty = { employeeId:'', item:'Polo Shirt', size:'M', qty:1, issued:todaySA(), status:'Good' };
const emptyStock = { item:'Polo Shirt', size:'M', qty:0 };

export default function Uniforms() {
  const { data, getEmployee, addUniform, updateUniform, deleteUniform, addStockItem, updateStockItem, deleteStockItem, isAdmin } = useApp();
  const [view, setView]   = useState('issued'); // 'issued' | 'stock'
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(empty);
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm]   = useState(emptyStock);
  const [issueError, setIssueError] = useState('');

  const openEdit = (u) => { setForm({ ...u, employeeId:u.employee_id, issued:u.issued_date }); setIssueError(''); setModal(u); };
  const closeModal = () => { setModal(null); setIssueError(''); };
  const save = async () => {
    try {
      const u={...form,employeeId:parseInt(form.employeeId),qty:parseInt(form.qty)};
      if(modal==='add') await addUniform(u); else await updateUniform(u);
      closeModal();
    } catch (e) { setIssueError(e.message || 'Save failed. Please try again.'); }
  };

  const stock = data.uniformStock || [];
  const [stockError, setStockError] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const openStockEdit = (s) => { setStockForm({ ...s }); setStockError(''); setStockModal(s); };
  const closeStockModal = () => { setStockModal(null); setStockError(''); };
  const saveStock = async () => {
    setStockSaving(true); setStockError('');
    try {
      const s = { ...stockForm, qty: parseInt(stockForm.qty) || 0 };
      if (stockModal === 'add') await addStockItem(s); else await updateStockItem(s);
      closeStockModal();
    } catch (e) {
      setStockError(e.message || 'Save failed. Check that the uniform_stock table exists in Supabase.');
    }
    setStockSaving(false);
  };
  const lowStockCount = stock.filter(s => s.qty <= LOW_STOCK_THRESHOLD).length;

  return (
    <div>
      <TabHeader title="Uniforms" settings={<p style={{ fontSize:13, color:'#6b7280' }}>Track on-hand warehouse stock by size, and log what's been issued to each crew member.</p>}>
        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:8, padding:2, gap:2 }}>
          <button onClick={()=>setView('issued')}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:view==='issued'?'#fff':'none', color:view==='issued'?'#1B3A2D':'#6b7280', boxShadow:view==='issued'?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
            Issued to Crew
          </button>
          <button onClick={()=>setView('stock')}
            style={{ padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:view==='stock'?'#fff':'none', color:view==='stock'?'#1B3A2D':'#6b7280', boxShadow:view==='stock'?'0 1px 3px rgba(0,0,0,0.1)':'none', display:'flex', alignItems:'center', gap:5 }}>
            Stock on Hand
            {lowStockCount > 0 && <span style={{ background:'#dc2626', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>{lowStockCount}</span>}
          </button>
        </div>
        {view === 'issued'
          ? <button className="btn-primary" onClick={()=>{ setForm(empty); setModal('add'); }}><Plus size={15}/> Issue Uniform</button>
          : (isAdmin && <button className="btn-primary" onClick={()=>{ setStockForm(emptyStock); setStockModal('add'); }}><Plus size={15}/> Add Stock</button>)
        }
      </TabHeader>

      {view === 'stock' && (
        <div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {ITEMS.map(item => {
              const rows = stock.filter(s => s.item === item).sort((a,b)=>SIZES.indexOf(a.size)-SIZES.indexOf(b.size));
              if (rows.length === 0) return null;
              return (
                <div key={item} className="list-card">
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{item}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {rows.map(s => {
                      const low = s.qty <= LOW_STOCK_THRESHOLD;
                      return (
                        <div key={s.id} onClick={()=>isAdmin && openStockEdit(s)}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, border:`1px solid ${low?'#fecaca':'#e5e7eb'}`, background:low?'#fef2f2':'#f9fafb', cursor:isAdmin?'pointer':'default', minWidth:90 }}>
                          <div>
                            <div style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>{s.size}</div>
                            <div style={{ fontSize:18, fontWeight:800, color:low?'#dc2626':'#1B3A2D', fontFamily:'Manrope,sans-serif' }}>{s.qty}</div>
                          </div>
                          {low && <AlertTriangle size={14} color="#dc2626" style={{ flexShrink:0 }} />}
                          {isAdmin && (
                            <button onClick={(e)=>{ e.stopPropagation(); deleteStockItem(s.id); }} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', padding:2, marginLeft:2 }}>
                              <Trash2 size={12}/>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {stock.length===0 && <EmptyState icon={Shirt} message={`No stock counts on file yet. Tap "Add Stock" to log what's in the warehouse.`} />}
          </div>
          {lowStockCount > 0 && (
            <div className="alert-banner" style={{ background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626', marginTop:14 }}>
              <AlertTriangle size={15} style={{ flexShrink:0 }} />
              <strong>{lowStockCount} size{lowStockCount>1?'s':''} at {LOW_STOCK_THRESHOLD} or fewer on hand — may need reordering.</strong>
            </div>
          )}
        </div>
      )}

      {view === 'issued' && (
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
                      <span style={statusBadgeStyle(u.status)}>{u.status}</span>
                    </div>
                    <div style={{ fontSize:13, color:'#374151' }}>{u.item} · Size {u.size} · Qty {u.qty}</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>Issued: {formatDateSA(u.issued_date)}</div>
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
          {(data.uniforms||[]).length===0 && <EmptyState icon={Shirt} message="No uniform records." />}
        </div>
      )}

      {/* Issue Uniform modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{modal==='add'?'Issue Uniform':'Edit Uniform'}</h3><button className="btn-icon" onClick={closeModal}><X size={18}/></button></div>
            {issueError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{issueError}</div>}
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

      {/* Add/Edit Stock modal */}
      {stockModal && (
        <div className="modal-overlay" onClick={closeStockModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{stockModal==='add'?'Add Stock':'Edit Stock Count'}</h3><button className="btn-icon" onClick={closeStockModal}><X size={18}/></button></div>
            {stockError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{stockError}</div>}
            <div className="form-grid">
              <label>Item<select style={inp} value={stockForm.item} onChange={e=>setStockForm(f=>({...f,item:e.target.value}))}>{ITEMS.map(i=><option key={i}>{i}</option>)}</select></label>
              <label>Size<select style={inp} value={stockForm.size} onChange={e=>setStockForm(f=>({...f,size:e.target.value}))}>{SIZES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label style={{ gridColumn:'1/-1' }}>Qty on Hand<input style={inp} type="number" min="0" value={stockForm.qty} onChange={e=>setStockForm(f=>({...f,qty:e.target.value}))} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeStockModal}>Cancel</button>
              <button className="btn-primary" onClick={saveStock} disabled={stockSaving}><Check size={15}/> {stockSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
