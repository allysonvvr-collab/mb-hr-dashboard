import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, Shield, User, ChevronDown, X, Check, Crown } from 'lucide-react';

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: '#7c3aed', icon: Crown, desc: 'Full access + user management' },
  admin:       { label: 'Admin',       color: '#1d5c25', icon: Shield, desc: 'Add/edit all records' },
  user:        { label: 'User',        color: '#6b7280', icon: User,   desc: 'View only' },
};

export default function UserManagement() {
  const { profile, getAllProfiles, updateUserRole, inviteUser } = useApp();
  const [profiles, setProfiles] = useState([]);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', role: 'user' });
  const [inviteMsg, setInviteMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const p = await getAllProfiles(); setProfiles(p); };

  const changeRole = async (userId, role) => {
    await updateUserRole(userId, role);
    load();
  };

  const handleInvite = async () => {
    setBusy(true);
    const err = await inviteUser(inviteForm.email, inviteForm.fullName);
    if (err) {
      setInviteMsg('Error: ' + err.message);
    } else {
      // Set their role after creation
      setTimeout(async () => {
        const fresh = await getAllProfiles();
        const newUser = fresh.find(p => p.email === inviteForm.email);
        if (newUser) await updateUserRole(newUser.id, inviteForm.role);
        load();
      }, 1500);
      setInviteMsg('Invite sent! They will receive an email to set their password.');
      setInviteForm({ email: '', fullName: '', role: 'user' });
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">User Management</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Manage who has access to this dashboard</p>
        </div>
        <button className="btn-primary" onClick={() => { setInviteModal(true); setInviteMsg(''); }}>
          <UserPlus size={16} /> Invite User
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <Icon size={15} color={cfg.color} />
              <strong style={{ color: cfg.color }}>{cfg.label}</strong>
              <span style={{ color: '#6b7280' }}>— {cfg.desc}</span>
            </div>
          );
        })}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const cfg = ROLE_CONFIG[p.role] || ROLE_CONFIG.user;
              const Icon = cfg.icon;
              const isSelf = p.id === profile?.id;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {(p.full_name || p.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.full_name || '—'}</div>
                        {isSelf && <div style={{ fontSize: 11, color: '#8bc34a', fontWeight: 600 }}>You</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{p.email}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: cfg.color + '18', color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{p.created_at?.split('T')[0]}</td>
                  <td>
                    {!isSelf ? (
                      <select value={p.role} onChange={e => changeRole(p.id, e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteModal && (
        <div className="modal-overlay" onClick={() => setInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Team Member</h3>
              <button className="btn-icon" onClick={() => setInviteModal(false)}><X size={18} /></button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
              They'll receive an email to set their password and log in.
            </p>
            <div className="form-grid">
              <label>Full Name<input value={inviteForm.fullName} onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Mia Thompson" /></label>
              <label>Email Address<input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></label>
              <label style={{ gridColumn: '1/-1' }}>Role
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">User — View only</option>
                  <option value="admin">Admin — Add/edit records</option>
                  <option value="super_admin">Super Admin — Full access</option>
                </select>
              </label>
            </div>
            {inviteMsg && (
              <div style={{ background: inviteMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${inviteMsg.startsWith('Error') ? '#fecaca' : '#86efac'}`, color: inviteMsg.startsWith('Error') ? '#dc2626' : '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12 }}>
                {inviteMsg}
              </div>
            )}
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setInviteModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleInvite} disabled={busy || !inviteForm.email}>
                <Check size={16} /> {busy ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
