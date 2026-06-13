import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Eye, EyeOff, Leaf } from 'lucide-react';

export default function Login() {
  const { signIn, resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const err = await signIn(email, password);
    if (err) setError(err.message);
    setBusy(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setBusy(true);
    await resetPassword(email);
    setMsg('Check your email for a password reset link.');
    setBusy(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #14401a 0%, #1d5c25 50%, #2d6a1f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#1d5c25', color: '#8bc34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 22, fontWeight: 900, fontFamily: 'Manrope, sans-serif',
            boxShadow: '0 4px 16px rgba(29,92,37,0.3)'
          }}>MB</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 20, color: '#14401a' }}>
            Macario Brothers
          </div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>HR Dashboard · Staff Access</div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="office@macariobrotherslawncare.com"
                  style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 40px 10px 38px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} style={{
              width: '100%', padding: '11px', background: busy ? '#86efac' : '#1d5c25',
              color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer', transition: 'background 0.15s'
            }}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={() => setMode('reset')}
                style={{ background: 'none', border: 'none', color: '#2d6a1f', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Enter your email and we'll send you a reset link.
            </p>
            <div style={{ marginBottom: 16 }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            {msg && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{msg}</div>}
            <button type="submit" disabled={busy} style={{ width: '100%', padding: '11px', background: '#1d5c25', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: '#2d6a1f', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Back to sign in
              </button>
            </div>
          </form>
        )}

        <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 28, paddingTop: 16, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          Internal staff only · Macario Brothers Lawn Care
        </div>
      </div>
    </div>
  );
}
