/* global React, Icon, NestLogo, useAuth, AVATAR_COLORS */

const getInviteFromUrl = () => {
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get("invite") || "";
  } catch (e) { return ""; }
};

const AuthScreen = () => {
  const { signIn, signUp, error } = useAuth();
  const [mode, setMode] = React.useState(getInviteFromUrl() ? "signup" : "signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [color, setColor] = React.useState("sky");
  const [inviteCode, setInviteCode] = React.useState(getInviteFromUrl());
  const [busy, setBusy] = React.useState(false);
  const [localErr, setLocalErr] = React.useState("");

  const submit = async () => {
    setLocalErr("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        if (!displayName.trim()) throw new Error("שם תצוגה חובה");
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          color,
          inviteCode: inviteCode.trim() || null,
        });
      }
    } catch (e) {
      setLocalErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const errMsg = localErr || error;

  return (
    <div className="scroll" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
      <div style={{ marginTop: 32, marginBottom: 28, textAlign: "center" }}>
        <NestLogo size={28} />
        <div className="small muted" style={{ marginTop: 10 }}>חשבונות הבית, בלי בלגן.</div>
      </div>

      <div className="segment" style={{ alignSelf: "center", marginBottom: 20 }}>
        <div className={`seg ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>כניסה</div>
        <div className={`seg ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>הרשמה</div>
      </div>

      {mode === "signup" && (
        <>
          <div className="field-label">שם</div>
          <input
            className="input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="לדוגמה: דניאל"
            autoFocus
          />

          <div className="field-label" style={{ marginTop: 14 }}>צבע אווטאר</div>
          <div className="hstack gap-8" style={{ flexWrap: "wrap" }}>
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`bg-${c}`}
                aria-label={c}
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  border: color === c ? "3px solid var(--ink)" : "1px solid var(--line)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}

      <div className="field-label" style={{ marginTop: 14 }}>מייל</div>
      <input
        className="input"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <div className="field-label" style={{ marginTop: 14 }}>סיסמה</div>
      <input
        className="input"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="לפחות 6 תווים"
      />

      {mode === "signup" && (
        <>
          <div className="field-label" style={{ marginTop: 14 }}>קוד הזמנה (אופציונלי)</div>
          <input
            className="input"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="ריק = בית חדש משלך"
            autoComplete="off"
          />
        </>
      )}

      {errMsg && (
        <div className="small" style={{ marginTop: 14, color: "var(--danger)", fontWeight: 600 }}>
          {errMsg}
        </div>
      )}

      <button
        className="btn"
        style={{ marginTop: 22 }}
        disabled={busy || !email || !password || (mode === "signup" && !displayName.trim())}
        onClick={submit}
      >
        {busy ? "רגע…" : mode === "signin" ? "כניסה" : "צור חשבון"}
      </button>

      <div className="small muted" style={{ textAlign: "center", marginTop: 16 }}>
        {mode === "signin"
          ? "אין לך חשבון? "
          : "כבר רשום? "}
        <span
          style={{ color: "var(--ink)", fontWeight: 700, cursor: "pointer" }}
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "הירשם" : "התחבר"}
        </span>
      </div>
    </div>
  );
};

const SetupRequiredScreen = () => (
  <div className="scroll" style={{ padding: 28, textAlign: "center" }}>
    <div style={{ marginTop: 60 }}>
      <NestLogo size={28} />
    </div>
    <div className="h2" style={{ marginTop: 28 }}>נדרשת הגדרה</div>
    <div className="small muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
      פתח את <code>src/supabase.jsx</code>, הדבק את ה-URL וה-anon key של פרויקט Supabase שלך, והרץ את <code>supabase/migration.sql</code> ב-SQL editor.
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="scroll" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="small muted">טוען…</div>
  </div>
);

Object.assign(window, { AuthScreen, SetupRequiredScreen, LoadingScreen });
