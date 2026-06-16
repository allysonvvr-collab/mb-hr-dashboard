import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState({
    employees: [], applicants: [], timeOff: [], raises: [],
    incidents: [], certifications: [], uniforms: [], reviews: [], performance: [], blacklist: []
  });

  // ── Auth listener ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch profile with full fallback ─────────────────────────
  const fetchProfile = async (u) => {
    try {
      const { data: p, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (p) {
        setProfile(p);
      } else {
        // Profile doesn't exist — create it now
        const role = u.email === 'office@macariobros.com' ? 'super_admin' : 'user';
        const { data: newP } = await supabase
          .from('profiles')
          .upsert({ id: u.id, email: u.email, full_name: u.email.split('@')[0], role }, { onConflict: 'id' })
          .select()
          .maybeSingle();
        setProfile(newP || { id: u.id, email: u.email, role });
      }
    } catch (e) {
      // Fallback: derive role from email so app still works
      const role = u.email === 'office@macariobros.com' ? 'super_admin' : 'user';
      setProfile({ id: u.id, email: u.email, role });
    }
    setLoading(false);
  };

  // ── Fetch all data ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetchAll();

    // Real-time subscriptions
    const tables = ['employees','applicants','time_off','raises','incidents','certifications','uniforms','reviews','performance','blacklist'];
    const channels = tables.map(t =>
      supabase.channel(`rt-${t}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, () => fetchAll())
        .subscribe()
    );
    return () => channels.forEach(c => supabase.removeChannel(c));
  }, [user]);

  const fetchAll = async () => {
    const [emp, app, to, ra, inc, cert, uni, rev, perf, bl] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('applicants').select('*').order('applied_date', { ascending: false }),
      supabase.from('time_off').select('*').order('created_at', { ascending: false }),
      supabase.from('raises').select('*').order('raise_date', { ascending: false }),
      supabase.from('incidents').select('*').order('incident_date', { ascending: false }),
      supabase.from('certifications').select('*').order('created_at', { ascending: false }),
      supabase.from('uniforms').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('review_date', { ascending: false }),
      supabase.from('performance').select('*').order('month', { ascending: false }),
      supabase.from('blacklist').select('*').order('created_at', { ascending: false }),
    ]);
    setData({
      employees:      emp.data  || [],
      applicants:     app.data  || [],
      timeOff:        to.data   || [],
      raises:         ra.data   || [],
      incidents:      inc.data  || [],
      certifications: cert.data || [],
      uniforms:       uni.data  || [],
      reviews:        rev.data  || [],
      performance:    perf.data || [],
      blacklist:      bl.data   || [],
    });
  };

  // ── Helpers ──────────────────────────────────────────────────
  const getEmployee  = (id) => data.employees.find(e => e.id === id);
  const isSuperAdmin = profile?.role === 'super_admin' || user?.email === 'office@macariobros.com';
  const isAdmin      = isSuperAdmin || profile?.role === 'admin';

  // ── CRUD helpers ─────────────────────────────────────────────
  const crud = {
    // EMPLOYEES
    addEmployee:    async (e)  => { await supabase.from('employees').insert([{ name:e.name, role:e.role, phone:e.phone, email:e.email, start_date:e.start_date||null, birthday:e.birthday, wage:e.wage, strikes:e.strikes, avatar:e.avatar, photo_url:e.photo_url||null, active:true }]); fetchAll(); },
    updateEmployee: async (e)  => { await supabase.from('employees').update({ name:e.name, role:e.role, phone:e.phone, email:e.email, start_date:e.start_date||null, birthday:e.birthday, wage:e.wage, strikes:e.strikes, avatar:e.avatar, photo_url:e.photo_url||null }).eq('id', e.id); fetchAll(); },
    deleteEmployee: async (id) => { await supabase.from('employees').delete().eq('id', id); fetchAll(); },

    // APPLICANTS
    addApplicant:    async (a)  => { await supabase.from('applicants').insert([{ name:a.name, role:a.role, phone:a.phone, email:a.email, applied_date:a.applied_date||a.applied, status:a.status, stars:a.stars, notes:a.notes, source:a.source||null }]); fetchAll(); },
    updateApplicant: async (a)  => { await supabase.from('applicants').update({ name:a.name, role:a.role, phone:a.phone, email:a.email, applied_date:a.applied_date||a.applied, status:a.status, stars:a.stars, notes:a.notes, source:a.source||null }).eq('id', a.id); fetchAll(); },
    deleteApplicant: async (id) => { await supabase.from('applicants').delete().eq('id', id); fetchAll(); },

    // TIME OFF
    addTimeOff:    async (t)  => { await supabase.from('time_off').insert([{ employee_id:parseInt(t.employeeId), type:t.type, dates:t.dates, days:t.days, status:t.status, notes:t.notes }]); fetchAll(); },
    updateTimeOff: async (t)  => { await supabase.from('time_off').update({ status:t.status, notes:t.notes, type:t.type, dates:t.dates, days:t.days }).eq('id', t.id); fetchAll(); },
    deleteTimeOff: async (id) => { await supabase.from('time_off').delete().eq('id', id); fetchAll(); },

    // RAISES
    addRaise:    async (r)  => {
      await supabase.from('raises').insert([{ employee_id:parseInt(r.employeeId), raise_date:r.date, previous_rate:r.previous, new_rate:r.newRate, increase:r.increase, reason:r.reason }]);
      // Also update the employee's current wage so it matches
      if (r.newRate) await supabase.from('employees').update({ wage: r.newRate }).eq('id', parseInt(r.employeeId));
      fetchAll();
    },
    deleteRaise: async (id) => { await supabase.from('raises').delete().eq('id', id); fetchAll(); },

    // INCIDENTS
    addIncident:    async (i)  => { await supabase.from('incidents').insert([{ employee_id:parseInt(i.employeeId), incident_date:i.date, description:i.description, cost:i.cost, status:i.status, doc_signed:i.docSigned }]); fetchAll(); },
    updateIncident: async (i)  => { await supabase.from('incidents').update({ status:i.status, doc_signed:i.docSigned, description:i.description, cost:i.cost, incident_date:i.date }).eq('id', i.id); fetchAll(); },
    deleteIncident: async (id) => { await supabase.from('incidents').delete().eq('id', id); fetchAll(); },

    // CERTIFICATIONS
    addCertification:    async (c)  => { await supabase.from('certifications').insert([{ employee_id:parseInt(c.employeeId), name:c.name, earned_date:c.earned||null, expires_date:c.expires||null, status:c.status }]); fetchAll(); },
    updateCertification: async (c)  => { await supabase.from('certifications').update({ name:c.name, earned_date:c.earned||null, expires_date:c.expires||null, status:c.status }).eq('id', c.id); fetchAll(); },
    deleteCertification: async (id) => { await supabase.from('certifications').delete().eq('id', id); fetchAll(); },

    // UNIFORMS
    addUniform:    async (u)  => { await supabase.from('uniforms').insert([{ employee_id:parseInt(u.employeeId), item:u.item, size:u.size, qty:u.qty, issued_date:u.issued, status:u.status }]); fetchAll(); },
    updateUniform: async (u)  => { await supabase.from('uniforms').update({ item:u.item, size:u.size, qty:u.qty, issued_date:u.issued, status:u.status }).eq('id', u.id); fetchAll(); },
    deleteUniform: async (id) => { await supabase.from('uniforms').delete().eq('id', id); fetchAll(); },

    // REVIEWS
    addReview:    async (r)  => { await supabase.from('reviews').insert([{ employee_id:parseInt(r.employeeId), review_date:r.date, rating:r.rating, punctuality:r.punctuality, quality:r.quality, attitude:r.attitude, teamwork:r.teamwork, notes:r.notes, reviewed_by:user.id }]); fetchAll(); },
    updateReview: async (r)  => { await supabase.from('reviews').update({ rating:r.rating, punctuality:r.punctuality, quality:r.quality, attitude:r.attitude, teamwork:r.teamwork, notes:r.notes, review_date:r.date }).eq('id', r.id); fetchAll(); },
    deleteReview: async (id) => { await supabase.from('reviews').delete().eq('id', id); fetchAll(); },

    // PERFORMANCE
    addPerformance:    async (p)  => { await supabase.from('performance').insert([{ employee_id:parseInt(p.employeeId), month:p.month, jobs_completed:p.jobsCompleted, complaints:p.complaints, rating:p.rating }]); fetchAll(); },
    updatePerformance: async (p)  => { await supabase.from('performance').update({ month:p.month, jobs_completed:p.jobsCompleted, complaints:p.complaints, rating:p.rating }).eq('id', p.id); fetchAll(); },
    deletePerformance: async (id) => { await supabase.from('performance').delete().eq('id', id); fetchAll(); },


  };

  // ── BLACKLIST ─────────────────────────────────────────────────
  const addBlacklist    = async (b) => { await supabase.from('blacklist').insert([{ name:b.name, position:b.position||null, phone:b.phone||null, reason:b.reason||null }]); fetchAll(); };
  const deleteBlacklist = async (id) => { await supabase.from('blacklist').delete().eq('id', id); fetchAll(); };

  // ── Upload employee photo ────────────────────────────────────
  const uploadEmployeePhoto = async (employeeId, file) => {
    const ext = file.name.split('.').pop();
    const path = `${employeeId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('employee-photos')
      .upload(path, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('employee-photos').getPublicUrl(path);
    // Save URL to employee record
    await supabase.from('employees').update({ photo_url: data.publicUrl }).eq('id', employeeId);
    fetchAll();
    return data.publicUrl;
  };

  // ── Export ───────────────────────────────────────────────────
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mb-hr-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── User management ──────────────────────────────────────────
  const getAllProfiles  = async () => { const { data: p } = await supabase.from('profiles').select('*').order('created_at'); return p || []; };
  const updateUserRole  = async (uid, role) => { await supabase.from('profiles').update({ role }).eq('id', uid); };
  const inviteUser      = async (email, fullName) => {
    const { error } = await supabase.auth.signUp({ email, password: Math.random().toString(36).slice(-12), options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    return error;
  };

  // ── Auth ─────────────────────────────────────────────────────
  const signIn          = async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); return error; };
  const signOut         = async () => supabase.auth.signOut();
  const resetPassword   = async (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

  return (
    <AppContext.Provider value={{
      user, profile, loading, data, isAdmin, isSuperAdmin, getEmployee,
      ...crud,
      uploadEmployeePhoto,
      exportData, signIn, signOut, resetPassword,
      addBlacklist, deleteBlacklist,
      getAllProfiles, updateUserRole, inviteUser, fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
