/* global React, Icon, Avatar, TopBar, Sheet, useAppState, useAuth, AVATAR_COLORS */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const InviteSheet = ({ open, onClose, onCreate }) => {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) { setCode(""); setCopied(false); }
  }, [open]);

  const create = async () => {
    setBusy(true);
    try {
      const inv = await onCreate();
      if (inv && inv.code) setCode(inv.code);
    } catch (e) {
      alert(e.message || String(e));
    } finally { setBusy(false); }
  };

  const link = code ? `${window.location.origin}${window.location.pathname}?invite=${code}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">הזמנת חבר לבית</div>
        <div className="small muted mt-4">צור קישור חד-פעמי ושלח אותו למי שתרצה לצרף.</div>

        {!code ? (
          <button className="btn mt-16" onClick={create} disabled={busy}>
            {busy ? "רגע…" : "צור קישור הזמנה"}
          </button>
        ) : (
          <>
            <div className="mt-16">
              <div className="field-label">קוד</div>
              <input className="input mono" value={code} readOnly />
            </div>
            <div className="mt-16">
              <div className="field-label">קישור</div>
              <input className="input" value={link} readOnly />
            </div>
            <button className="btn mt-16" onClick={copy}>
              <Icon name="paperclip" size={16} /> {copied ? "הועתק" : "העתק קישור"}
            </button>
            <div className="small muted mt-12" style={{ textAlign: "center" }}>
              בקש מהשותף לפתוח את הקישור ולהירשם.
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
};

const PersonSheet = ({ open, person, onClose, onSaveSelf, onRemove }) => {
  const isSelf = person?.isYou;
  const isOwner = person?.owner;
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("mint");

  React.useEffect(() => {
    if (open && person) {
      setName(person.name || "");
      setColor(person.color || "mint");
    }
  }, [open, person]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await onSaveSelf({ name: name.trim(), color });
      onClose && onClose();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  const del = async () => {
    if (!person || isSelf) return;
    if (!confirm(`להסיר את ${person.name} מהבית?`)) return;
    try {
      await onRemove(person.id);
      onClose && onClose();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  if (!person) return <Sheet open={false} onClose={onClose}><div /></Sheet>;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">
          {isSelf ? "הפרופיל שלך" : person.name}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <div className={`avatar lg bg-${color}`} style={{ width: 72, height: 72, fontSize: 24 }}>
            {(name || "?").split(/\s+/).map(p => p[0]).slice(0,2).join("")}
          </div>
        </div>

        {isSelf ? (
          <>
            <div className="mt-16">
              <div className="field-label">שם</div>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="mt-16">
              <div className="field-label">צבע אווטאר</div>
              <div className="hstack gap-8" style={{ flexWrap: "wrap" }}>
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`bg-${c}`}
                    aria-label={c}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      border: color === c ? "3px solid var(--ink)" : "2px solid transparent",
                      cursor: "pointer",
                      outline: "1px solid var(--line)",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              className="btn mt-20"
              onClick={save}
              disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.4 }}
            >שמור</button>
          </>
        ) : (
          <>
            <div className="card mt-16" style={{ padding: 16, background: "var(--cream-soft)" }}>
              <div className="small muted">
                {isOwner ? "בעלים של הבית. אי אפשר להסיר." : "ניתן להסיר מהבית."}
              </div>
            </div>
            {!isOwner && (
              <button
                className="btn ghost mt-12"
                onClick={del}
                style={{ color: "var(--danger)", borderColor: "var(--line)" }}
              >
                <Icon name="trash" size={16} /> הסר מהבית
              </button>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
};

const HouseholdScreen = ({ onBack }) => {
  const { state, updateMyProfile, removeMember, createInvite } = useAppState();
  const { household } = useAuth();
  const expenses = state.expenses;
  const people = state.people;

  const totals = {};
  people.forEach(p => { totals[p.id] = { paid: 0, share: 0 }; });
  expenses.forEach(e => {
    if (!totals[e.paidBy]) totals[e.paidBy] = { paid: 0, share: 0 };
    totals[e.paidBy].paid += e.amount;
    if (e.split === 50) {
      const n = Math.max(people.length, 1);
      people.forEach(p => { if (totals[p.id]) totals[p.id].share += e.amount / n; });
    } else if (e.split === 100) {
      const others = people.filter(p => p.id !== e.paidBy);
      const n = Math.max(others.length, 1);
      others.forEach(p => { if (totals[p.id]) totals[p.id].share += e.amount / n; });
    } else if (e.split === 0) {
      if (totals[e.paidBy]) totals[e.paidBy].share += e.amount;
    }
  });

  const you = people.find(p => p.isYou) || people[0];
  const youBalance = you ? totals[you.id].paid - totals[you.id].share : 0;
  const owedAmount = Math.abs(youBalance);
  const youOwe = youBalance < 0;
  const hasBalance = owedAmount > 0.5;
  const others = people.filter(p => !p.isYou);

  const [editing, setEditing] = React.useState(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  let counterpart = null;
  if (hasBalance && others.length > 0) {
    const sorted = others
      .map(p => ({ p, b: totals[p.id].paid - totals[p.id].share }))
      .sort((a, b) => (youOwe ? b.b - a.b : a.b - b.b));
    counterpart = sorted[0]?.p;
  }

  return (
    <div className="scroll">
      <TopBar
        title={household?.name || "משק בית"}
        onBack={onBack}
        trailing={
          <button
            className="btn icon-only soft"
            style={{ background: "var(--cream-soft)" }}
            onClick={() => setInviteOpen(true)}
            title="הזמן חבר"
          >
            <Icon name="plus" size={18} />
          </button>
        }
      />

      <div className="px-22 vstack gap-14">
        {hasBalance && counterpart ? (
          <div className="card" style={{ padding: 20, background: "var(--ink)", color: "#fff", border: "none" }}>
            <div className="tiny" style={{ color: "rgba(255,255,255,.7)" }}>מאזן</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>
              {youOwe
                ? <>אתה חייב ל<span style={{ fontWeight: 800 }}>{counterpart.name}</span></>
                : <><span style={{ fontWeight: 800 }}>{counterpart.name}</span> חייב לך</>}
            </div>
            <div className="h1 num" style={{ marginTop: 8 }}>{shek(owedAmount, 0)}</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, background: "var(--cream-soft)" }}>
            <div className="tiny">מאזן</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              {people.length < 2 ? "הזמן שותפים כדי לעקוב אחר חלוקה" : "אין חוב פתוח"}
            </div>
          </div>
        )}

        <div>
          <div className="hstack between mb-12">
            <div className="h3">חברי הבית</div>
            <span className="small muted">{people.length}</span>
          </div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {people.map(p => {
              const t = totals[p.id];
              const balance = t.paid - t.share;
              return (
                <div
                  key={p.id}
                  className="row"
                  onClick={() => setEditing(p)}
                  style={{ cursor: "pointer" }}
                >
                  <Avatar name={p.name} color={p.color} size="lg" />
                  <div className="meta" style={{ marginInlineStart: 8 }}>
                    <div className="t">
                      {p.name}
                      {p.isYou && <span className="tiny" style={{ marginInlineStart: 8, color: "var(--text-3)" }}>· את/ה</span>}
                      {p.owner && !p.isYou && <span className="tiny" style={{ marginInlineStart: 8, color: "var(--text-3)" }}>· בעלים</span>}
                    </div>
                    {expenses.length > 0 ? (
                      <div className="s">שילם {shek(t.paid, 0)} · חלק {shek(t.share, 0)}</div>
                    ) : (
                      <div className="s">{p.short || ""}</div>
                    )}
                  </div>
                  <div className="trail">
                    {expenses.length > 0 ? (
                      <div className="amt num" style={{
                        color: balance > 0 ? "var(--good)" : balance < 0 ? "var(--danger)" : "var(--text)",
                      }}>
                        {balance > 0 ? "+" : ""}{shek(balance, 0)}
                      </div>
                    ) : (
                      <Icon name="chevron" size={18} color="var(--text-3)" />
                    )}
                  </div>
                </div>
              );
            })}
            <div
              className="row"
              onClick={() => setInviteOpen(true)}
              style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
            >
              <div className="lead" style={{ background: "var(--cream-soft)", border: "1.5px dashed var(--line-strong)" }}>
                <Icon name="plus" size={20} color="#0E0E0E" />
              </div>
              <div className="meta">
                <div className="t" style={{ color: "var(--text-2)" }}>הזמן חבר לבית</div>
                <div className="s">צור קישור לשליחה</div>
              </div>
              <div className="trail"><Icon name="chevron" size={18} color="var(--text-3)" /></div>
            </div>
          </div>
        </div>
      </div>

      <PersonSheet
        open={!!editing}
        person={editing}
        onClose={() => setEditing(null)}
        onSaveSelf={updateMyProfile}
        onRemove={removeMember}
      />
      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreate={createInvite}
      />
    </div>
  );
};

Object.assign(window, { HouseholdScreen });
