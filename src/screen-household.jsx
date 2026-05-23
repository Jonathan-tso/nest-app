/* global React, Icon, Avatar, TopBar, Sheet, useAppState, AVATAR_COLORS */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const PersonSheet = ({ open, person, takenColors, onClose, onSave, onDelete }) => {
  const isEdit = !!person;
  const isOwner = person?.owner;
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("mint");

  React.useEffect(() => {
    if (open) {
      setName(person?.name || "");
      // pick the first unused color for new members
      const def = person?.color
        || AVATAR_COLORS.find(c => !takenColors?.includes(c))
        || "mint";
      setColor(def);
    }
  }, [open, person]);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      color,
      short: name.trim().split(/\s+/)[0].slice(0, 2),
    });
    onClose && onClose();
  };

  const del = () => {
    if (!person || isOwner) return;
    if (confirm(`למחוק את ${person.name}? הוצאות שכבר נרשמו לא יימחקו.`)) {
      onDelete && onDelete(person.id);
      onClose && onClose();
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">
          {isEdit ? (isOwner ? "פרופיל שלך" : "עריכת חבר בית") : "הוסף חבר בית"}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <div className={`avatar lg bg-${color}`} style={{ width: 72, height: 72, fontSize: 24 }}>
            {(name || "?").split(/\s+/).map(p => p[0]).slice(0,2).join("")}
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">שם</div>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="לדוגמה: יואב"
            autoFocus
          />
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
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.4 }}
        >שמור</button>

        {isEdit && !isOwner && (
          <button
            className="btn ghost mt-12"
            onClick={del}
            style={{ color: "var(--danger)", borderColor: "var(--line)" }}
          >
            <Icon name="trash" size={16} /> מחק חבר
          </button>
        )}
      </div>
    </Sheet>
  );
};

const HouseholdScreen = ({ onBack }) => {
  const { state, addPerson, updatePerson, removePerson } = useAppState();
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

  const you = people.find(p => p.owner) || people[0];
  const youBalance = you ? totals[you.id].paid - totals[you.id].share : 0;
  const owedAmount = Math.abs(youBalance);
  const youOwe = youBalance < 0;
  const hasBalance = owedAmount > 0.5;
  const others = people.filter(p => !p.owner);

  const [editing, setEditing] = React.useState(null); // person or null
  const [adding, setAdding] = React.useState(false);
  const [showSettle, setShowSettle] = React.useState(false);

  // for settlement: pick the person with biggest opposite-sign balance
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
        title="משק בית"
        onBack={onBack}
        trailing={
          <button
            className="btn icon-only soft"
            style={{ background: "var(--cream-soft)" }}
            onClick={() => setAdding(true)}
            title="הוסף חבר"
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
                : <>{counterpart.name} חייב<span style={{ fontWeight: 800 }}>{counterpart.name?.endsWith("ה") ? "ת" : ""} לך</span></>}
            </div>
            <div className="h1 num" style={{ marginTop: 8 }}>{shek(owedAmount, 0)}</div>
            <button
              className="btn"
              onClick={() => setShowSettle(true)}
              style={{ marginTop: 14, background: "#fff", color: "var(--ink)", width: "auto", padding: "0 22px" }}
            >סגירת חשבון</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, background: "var(--cream-soft)" }}>
            <div className="tiny">מאזן</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              {people.length < 2 ? "הוסף חברי בית כדי לעקוב אחר חלוקה" : "אין חוב פתוח"}
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
                      {p.owner && <span className="tiny" style={{ marginInlineStart: 8, color: "var(--text-3)" }}>· את/ה</span>}
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
              onClick={() => setAdding(true)}
              style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
            >
              <div className="lead" style={{ background: "var(--cream-soft)", border: "1.5px dashed var(--line-strong)" }}>
                <Icon name="plus" size={20} color="#0E0E0E" />
              </div>
              <div className="meta">
                <div className="t" style={{ color: "var(--text-2)" }}>הוסף חבר בית</div>
              </div>
              <div className="trail"><Icon name="chevron" size={18} color="var(--text-3)" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Person add/edit sheet */}
      <PersonSheet
        open={adding || !!editing}
        person={editing}
        takenColors={people.map(p => p.color)}
        onClose={() => { setEditing(null); setAdding(false); }}
        onSave={(patch) => {
          if (editing) updatePerson(editing.id, patch);
          else addPerson(patch);
        }}
        onDelete={removePerson}
      />

      {/* Settle sheet */}
      <Sheet open={showSettle} onClose={() => setShowSettle(false)}>
        <div className="px-22" style={{ paddingBottom: 24 }}>
          <div className="h2 mt-8">סגירת חשבון</div>
          {counterpart && (
            <div className="card" style={{ marginTop: 16, padding: 18, background: "var(--cream-soft)" }}>
              <div className="hstack between">
                <div>
                  <div className="tiny">סכום</div>
                  <div className="h1 num" style={{ marginTop: 4 }}>{shek(owedAmount, 0)}</div>
                </div>
                <div className="hstack gap-8">
                  <Avatar name={you.name} color={you.color} size="lg" />
                  <Icon name="arrow" size={20} />
                  <Avatar name={counterpart.name} color={counterpart.color} size="lg" />
                </div>
              </div>
            </div>
          )}
          <div className="vstack gap-10 mt-16">
            <button className="btn" onClick={() => setShowSettle(false)}>שלם עכשיו</button>
            <button className="btn ghost" onClick={() => setShowSettle(false)}>סמן כשולם</button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

Object.assign(window, { HouseholdScreen });
