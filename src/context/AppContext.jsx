import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    employees: [], applicants: [], timeOff: [], raises: [],
    incidents: [], certifications: [], uniforms: [], reviews: [], performance: []
  });

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data: p, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (p) {
        setProfile(p);
      } else {
        // Profile may not exist yet (trigger delay) — create it inline
        const userObj = (await supabase.auth.getUser()).data?.user;
        if (userObj) {
          const role = userObj.email === 'office@macariobros.com' ? 'super_admin' : 'user';
          const { data: newP } = await supabase.from('profiles').upsert({
            id: uid,
            email: userObj.email,
            full_name: userObj.email.split('@')[0],
            role,
          }, { onConflict: 'id' }).select().maybeSingle();
          setProfile(newP || { id: uid, email: userObj.email, role });
        }
      }
    } catch(e) {
      console.warn('Profile fetch error:', e.message);
      // Fallback: still let user in, derive role from email
      const userObj = (await supabase.auth.getUser()).data?.user;
      if (userObj) {
        setProfile({
          id: uid,
          email: userObj.email,
          role: userObj.email === 'office@macariobros.com' ? 'super_admin' : 'user',
        });
      }
    }
    setLoading(false);
  };

  // Fetch all data tables
  useEffect(() => {
    if (!user) return;
    fetchAll();

    // Real-time subscriptions
    const tables = ['employees','applicants','time_off','raises','incidents','certifications','uniforms','reviews','performance'];
    const channels = tables.map(t =>
      supabase.channel(`rt-${t}`).on('postgres_changes', { event: '*', schema: 'public', table: t }, () => fetchAll()).subscribe()
    );
    return () => channels.forEach(c => supabase.removeChannel(c));
  }, [user]);

  const fetchAll = async () => {
    const [emp, app, to, ra, inc, cert, uni, rev, perf] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('applicants').select('*').order('applied_date', { ascending: false }),
      supabase.from('time_off').select('*').order('created_at', { ascending: false }),
      supabase.from('raises').select('*').order('raise_date', { ascending: false }),
      supabase.from('incidents').select('*').order('incident_date', { ascending: false }),
      supabase.from('certifications').select('*'),
      supabase.from('uniforms').select('*'),
      supabase.from('reviews').select('*').order('review_date', { ascending: false }),
      supabase.from('performance').select('*').order('month', { ascending: false }),
    ]);
    setData({
      employees: emp.data || [],
      applicants: app.data || [],
      timeOff: to.data || [],
      raises: ra.data || [],
      incidents: inc.data || [],
      certifications: cert.data || [],
      uniforms: uni.data || [],
      reviews: rev.data || [],
      performance: perf.data || [],
    });
  };

  const getEmployee = (id) => data.employees.find(e => e.id === id);
  const isAdmin = !profile || profile?.role === 'super_admin' || profile?.role === 'admin';
  const isSuperAdmin = !profile || profile?.role === 'super_admin';

  // ── EMPLOYEES ──
  const addEmployee = async (emp) => {
    const { error } = await supabase.from('employees').insert([{ ...emp, avatar: emp.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }]);
    if (error) alert('Error: ' + error.message);
    else fetchAll();
  };
  const updateEmployee = async (emp) => {
    const { error } = await supabase.from('employees').update(emp).eq('id', emp.id);
    if (error) alert('Error: ' + error.message);
    else fetchAll();
  };
  const deleteEmployee = async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchAll();
  };

  // ── APPLICANTS ──
  const addApplicant = async (a) => { await supabase.from('applicants').insert([a]); fetchAll(); };
  const updateApplicant = async (a) => { await supabase.from('applicants').update(a).eq('id', a.id); fetchAll(); };
  const deleteApplicant = async (id) => { await supabase.from('applicants').delete().eq('id', id); fetchAll(); };

  // ── TIME OFF ──
  const addTimeOff = async (t) => { await supabase.from('time_off').insert([{ employee_id: t.employeeId, type: t.type, dates: t.dates, days: t.days, status: t.status, notes: t.notes }]); fetchAll(); };
  const updateTimeOff = async (t) => { await supabase.from('time_off').update({ status: t.status, notes: t.notes, type: t.type, dates: t.dates, days: t.days }).eq('id', t.id); fetchAll(); };
  const deleteTimeOff = async (id) => { await supabase.from('time_off').delete().eq('id', id); fetchAll(); };

  // ── RAISES ──
  const addRaise = async (r) => { await supabase.from('raises').insert([{ employee_id: r.employeeId, raise_date: r.date, previous_rate: r.previous, new_rate: r.newRate, increase: r.increase, reason: r.reason }]); fetchAll(); };
  const deleteRaise = async (id) => { await supabase.from('raises').delete().eq('id', id); fetchAll(); };

  // ── INCIDENTS ──
  const addIncident = async (inc) => { await supabase.from('incidents').insert([{ employee_id: inc.employeeId, incident_date: inc.date, description: inc.description, cost: inc.cost, status: inc.status, doc_signed: inc.docSigned }]); fetchAll(); };
  const updateIncident = async (inc) => { await supabase.from('incidents').update({ status: inc.status, doc_signed: inc.docSigned, description: inc.description, cost: inc.cost, incident_date: inc.date }).eq('id', inc.id); fetchAll(); };
  const deleteIncident = async (id) => { await supabase.from('incidents').delete().eq('id', id); fetchAll(); };

  // ── CERTIFICATIONS ──
  const addCertification = async (c) => { await supabase.from('certifications').insert([{ employee_id: c.employeeId, name: c.name, earned_date: c.earned || null, expires_date: c.expires || null, status: c.status }]); fetchAll(); };
  const updateCertification = async (c) => { await supabase.from('certifications').update({ name: c.name, earned_date: c.earned || null, expires_date: c.expires || null, status: c.status }).eq('id', c.id); fetchAll(); };
  const deleteCertification = async (id) => { await supabase.from('certifications').delete().eq('id', id); fetchAll(); };

  // ── UNIFORMS ──
  const addUniform = async (u) => { await supabase.from('uniforms').insert([{ employee_id: u.employeeId, item: u.item, size: u.size, qty: u.qty, issued_date: u.issued, status: u.status }]); fetchAll(); };
  const updateUniform = async (u) => { await supabase.from('uniforms').update({ item: u.item, size: u.size, qty: u.qty, issued_date: u.issued, status: u.status }).eq('id', u.id); fetchAll(); };
  const deleteUniform = async (id) => { await supabase.from('uniforms').delete().eq('id', id); fetchAll(); };

  // ── REVIEWS ──
  const addReview = async (r) => { await supabase.from('reviews').insert([{ employee_id: r.employeeId, review_date: r.date, rating: r.rating, punctuality: r.punctuality, quality: r.quality, attitude: r.attitude, teamwork: r.teamwork, notes: r.notes, reviewed_by: user.id }]); fetchAll(); };
  const updateReview = async (r) => { await supabase.from('reviews').update({ rating: r.rating, punctuality: r.punctuality, quality: r.quality, attitude: r.attitude, teamwork: r.teamwork, notes: r.notes, review_date: r.date }).eq('id', r.id); fetchAll(); };
  const deleteReview = async (id) => { await supabase.from('reviews').delete().eq('id', id); fetchAll(); };

  // ── PERFORMANCE ──
  const addPerformance = async (p) => { await supabase.from('performance').insert([{ employee_id: p.employeeId, month: p.month, jobs_completed: p.jobsCompleted, complaints: p.complaints, rating: p.rating }]); fetchAll(); };
  const updatePerformance = async (p) => { await supabase.from('performance').update({ month: p.month, jobs_completed: p.jobsCompleted, complaints: p.complaints, rating: p.rating }).eq('id', p.id); fetchAll(); };
  const deletePerformance = async (id) => { await supabase.from('performance').delete().eq('id', id); fetchAll(); };

  // ── EXPORT ──
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mb-hr-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── USER MANAGEMENT (super admin only) ──
  const getAllProfiles = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');
    return profiles || [];
  };
  const updateUserRole = async (userId, role) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  };
  const inviteUser = async (email, fullName) => {
    const { error } = await supabase.auth.signUp({ email, password: Math.random().toString(36).slice(-10), options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    return error;
  };

  // ── AUTH ──
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };
  const signOut = async () => { await supabase.auth.signOut(); };
  const resetPassword = async (email) => { await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); };

  return (
    <AppContext.Provider value={{
      user, profile, loading, data, isAdmin, isSuperAdmin, getEmployee,
      addEmployee, updateEmployee, deleteEmployee,
      addApplicant, updateApplicant, deleteApplicant,
      addTimeOff, updateTimeOff, deleteTimeOff,
      addRaise, deleteRaise,
      addIncident, updateIncident, deleteIncident,
      addCertification, updateCertification, deleteCertification,
      addUniform, updateUniform, deleteUniform,
      addReview, updateReview, deleteReview,
      addPerformance, updatePerformance, deletePerformance,
      exportData, signIn, signOut, resetPassword,
      getAllProfiles, updateUserRole, inviteUser, fetchAll
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
