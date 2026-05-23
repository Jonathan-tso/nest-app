/* global React */
// Auth context: tracks session, profile, and household.

const AuthContext = React.createContext(null);
const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const supabase = window.supabaseClient;
  const [session, setSession] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [household, setHousehold] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // wipe legacy local-only storage once
  React.useEffect(() => {
    try { localStorage.removeItem("nest:state:v2"); } catch (e) {}
  }, []);

  const loadProfileAndHousehold = React.useCallback(async (userId) => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: prof, error: profErr } = await supabase
        .from("profiles").select("*").eq("id", userId).maybeSingle();
      if (profErr) throw profErr;
      setProfile(prof);

      const { data: hm, error: hmErr } = await supabase
        .from("household_members")
        .select("household_id, role, households(id, name, created_by)")
        .eq("profile_id", userId)
        .maybeSingle();
      if (hmErr) throw hmErr;
      if (hm) {
        setHousehold({ ...hm.households, role: hm.role });
      } else {
        setHousehold(null);
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfileAndHousehold(data.session.user.id);
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (sess) {
        loadProfileAndHousehold(sess.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase, loadProfileAndHousehold]);

  const signIn = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); throw error; }
  };

  const signUp = async ({ email, password, displayName, color, inviteCode }) => {
    setError(null);
    const { data: sd, error: se } = await supabase.auth.signUp({ email, password });
    if (se) { setError(se.message); throw se; }

    // If email confirmation is disabled in Supabase, we already have a session here.
    if (!sd.session) {
      setError("נדרש אישור מייל. כבה את הדרישה ב-Supabase → Auth.");
      throw new Error("email confirmation required");
    }

    const { data: hhId, error: be } = await supabase.rpc("bootstrap_account", {
      display_name: displayName,
      color: color || "sky",
      invite_code: inviteCode || null,
    });
    if (be) { setError(be.message); throw be; }

    await loadProfileAndHousehold(sd.user.id);
    return hhId;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = () => session && loadProfileAndHousehold(session.user.id);

  return (
    <AuthContext.Provider value={{
      session, profile, household, loading, error,
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

Object.assign(window, { AuthContext, AuthProvider, useAuth });
