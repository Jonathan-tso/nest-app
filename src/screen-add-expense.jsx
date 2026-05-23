/* global React, Icon, Avatar, Sheet, CATEGORIES, PEOPLE, shek */
// Add expense — bottom sheet with numeric pad + category + split + recurring

const AddExpenseSheet = ({ open, onClose, onSave }) => {
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("groceries");
  const [paidBy, setPaidBy] = React.useState("you");
  const [split, setSplit] = React.useState(50);
  const [recurring, setRecurring] = React.useState(false);
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setAmount(""); setCategory("groceries"); setPaidBy("you");
      setSplit(50); setRecurring(false); setLabel("");
    }
  }, [open]);

  const key = (k) => {
    if (k === "back") setAmount(prev => prev.slice(0, -1));
    else if (k === ".") setAmount(prev => prev.includes(".") ? prev : (prev || "0") + ".");
    else setAmount(prev => (prev + k).replace(/^0+(?=\d)/, ""));
  };

  const value = parseFloat(amount || "0") || 0;
  const canSave = value > 0;

  const save = () => {
    if (!canSave) return;
    onSave && onSave({
      amount: value,
      category,
      paidBy,
      split,
      recurring,
      label: label.trim() || CATEGORIES.find(c => c.id === category)?.label,
    });
    onClose && onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} maxHeight="96%">
      <div className="px-22" style={{ paddingBottom: 20 }}>
        <div className="hstack between" style={{ marginTop: 2 }}>
          <div>
            <div className="tiny">הוצאה חדשה</div>
            <div className="h1 num" style={{ marginTop: 4 }}>
              {amount ? shek(value, amount.includes(".") ? 2 : 0) : "₪0"}
            </div>
          </div>
          <div className="hstack gap-8">
            <button className="btn icon-only ghost" style={{ width: 40, height: 40 }} title="צילום קבלה">
              <Icon name="camera" size={18} />
            </button>
            <button className="btn icon-only ghost" style={{ width: 40, height: 40 }} title="AI">
              <Icon name="sparkles" size={18} />
            </button>
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">תיאור</div>
          <input
            className="input"
            placeholder="לדוגמה: שופרסל"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>

        <div className="mt-16">
          <div className="field-label">קטגוריה</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "transparent", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: "inherit", flexShrink: 0,
                }}
              >
                <div className={`bg-${c.color}`} style={{
                  width: 50, height: 50, borderRadius: 16, display: "grid", placeItems: "center",
                  border: category === c.id ? "2px solid var(--ink)" : "2px solid transparent",
                }}>
                  <Icon name={c.icon} size={22} color="#0E0E0E" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: category === c.id ? "var(--ink)" : "var(--text-2)" }}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">שילם</div>
          <div className="hstack gap-8">
            {PEOPLE.map(p => (
              <button
                key={p.id}
                onClick={() => setPaidBy(p.id)}
                className={`chip ${paidBy === p.id ? "active" : "outline"}`}
                style={{ fontFamily: "inherit", height: 36, padding: "0 14px", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Avatar name={p.name} color={p.color} size="sm" />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">חלוקה</div>
          <div className="segment">
            <div className={`seg ${split === 50 ? "active" : ""}`} onClick={() => setSplit(50)}>חצי-חצי</div>
            <div className={`seg ${split === 100 ? "active" : ""}`} onClick={() => setSplit(100)}>על הצד השני</div>
            <div className={`seg ${split === 0 ? "active" : ""}`} onClick={() => setSplit(0)}>אישי</div>
          </div>
        </div>

        <div className="mt-16 hstack between">
          <div className="hstack gap-8">
            <Icon name="repeat" size={18} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>הוצאה חוזרת</div>
              <div className="small muted">תיווצר אוטומטית כל חודש</div>
            </div>
          </div>
          <button
            onClick={() => setRecurring(!recurring)}
            style={{
              width: 44, height: 26, borderRadius: 999,
              background: recurring ? "var(--ink)" : "var(--field)",
              border: "none", padding: 3, cursor: "pointer",
              display: "flex", justifyContent: recurring ? "flex-end" : "flex-start",
              transition: "background .15s ease",
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              transition: "all .2s ease",
            }} />
          </button>
        </div>

        <div className="pad" style={{ marginTop: 22, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}>
          {["1","2","3","4","5","6","7","8","9",".","0","back"].map(k => (
            <div key={k} className="k" onClick={() => key(k)}>
              {k === "back" ? <Icon name="back" size={20} /> : k}
            </div>
          ))}
        </div>

        <button
          className="btn"
          onClick={save}
          disabled={!canSave}
          style={{ marginTop: 18, opacity: canSave ? 1 : 0.4 }}
        >
          שמור הוצאה
        </button>
      </div>
    </Sheet>
  );
};

Object.assign(window, { AddExpenseSheet });
