/* global React, Icon, TopBar, Sheet, useAppState, CAT, CATEGORIES */
// Bills screen — list + detail sheet with edit/undo

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const BillRow = ({ bill, people, onPay, onPick }) => {
  const c = CAT[bill.category] || CAT.household;
  const assignee = people.find(p => p.id === bill.assignee);
  const overdue = bill.status === "overdue";
  const paid = bill.paid;
  return (
    <div className="row" onClick={() => onPick && onPick(bill)} style={{ cursor: "pointer" }}>
      <div className={`lead bg-${c.color}`} style={{ opacity: paid ? 0.5 : 1 }}>
        <Icon name={c.icon} size={20} color="#0E0E0E" />
      </div>
      <div className="meta">
        <div className="t" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={paid ? { textDecoration: "line-through", opacity: 0.55 } : {}}>{bill.label}</span>
          {bill.recurring && <Icon name="repeat" size={12} color="var(--text-3)" />}
        </div>
        <div className="s">
          {bill.dueDate}
          {assignee ? <> · {assignee.name}</> : null}
          {overdue && <span style={{ color: "var(--danger)", fontWeight: 700 }}> · באיחור</span>}
          {paid && <span style={{ color: "var(--good)", fontWeight: 700 }}> · שולם</span>}
        </div>
      </div>
      <div className="trail" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="amt num">{shek(bill.amount, bill.amount % 1 ? 2 : 0)}</div>
        {!paid && (
          <button
            onClick={(e) => { e.stopPropagation(); onPay && onPay(bill); }}
            className="btn xs"
            style={{
              width: "auto",
              background: overdue ? "var(--danger)" : "var(--ink)",
              color: "#fff",
            }}
          >שלם</button>
        )}
      </div>
    </div>
  );
};

const BillDetailSheet = ({ bill, people, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("rent");
  const [assignee, setAssignee] = React.useState("you");
  const [paid, setPaid] = React.useState(false);
  const [dueDate, setDueDate] = React.useState("");

  React.useEffect(() => {
    if (bill) {
      setLabel(bill.label || "");
      setAmount(String(bill.amount || ""));
      setCategory(bill.category || "rent");
      setAssignee(bill.assignee || "you");
      setPaid(!!bill.paid);
      setDueDate(bill.dueDate || "");
    }
  }, [bill]);

  const save = () => {
    const num = parseFloat(amount) || 0;
    onUpdate && onUpdate(bill.id, {
      label: label.trim() || bill.label,
      amount: num,
      category,
      assignee,
      dueDate,
      paid,
      status: paid ? "paid" : (bill.status === "overdue" ? "overdue" : "upcoming"),
    });
    onClose && onClose();
  };

  const c = bill ? (CAT[bill.category] || CAT.household) : null;

  return (
    <Sheet open={!!bill} onClose={onClose} maxHeight="92%">
      {bill && (
        <div className="px-22" style={{ paddingBottom: 20 }}>
          <div className="hstack gap-12 mt-8">
            <div className={`bg-${c.color}`} style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center" }}>
              <Icon name={c.icon} size={22} color="#0E0E0E" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="tiny">חשבון</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{bill.label}</div>
              {bill.dueDate && <div className="small muted">{bill.dueDate}</div>}
            </div>
          </div>

          <div className="mt-16">
            <div className="field-label">שם</div>
            <input className="input" value={label} onChange={e => setLabel(e.target.value)} />
          </div>

          <div className="mt-16">
            <div className="field-label">סכום</div>
            <input
              className="input num"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </div>

          <div className="mt-16">
            <div className="field-label">תאריך תשלום</div>
            <input className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="לדוגמה: 1 ביוני" />
          </div>

          <div className="mt-16">
            <div className="field-label">קטגוריה</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    background: "transparent", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: "inherit", flexShrink: 0,
                  }}
                >
                  <div className={`bg-${cat.color}`} style={{
                    width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center",
                    border: category === cat.id ? "2px solid var(--ink)" : "2px solid transparent",
                  }}>
                    <Icon name={cat.icon} size={20} color="#0E0E0E" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: category === cat.id ? "var(--ink)" : "var(--text-2)" }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <div className="field-label">אחראי תשלום</div>
            <div className="hstack gap-8" style={{ flexWrap: "wrap" }}>
              {people.map(p => (
                <button
                  key={p.id}
                  onClick={() => setAssignee(p.id)}
                  className={`chip ${assignee === p.id ? "active" : "outline"}`}
                  style={{ fontFamily: "inherit", height: 36, padding: "0 14px" }}
                >{p.name}</button>
              ))}
            </div>
          </div>

          <div className="mt-16 hstack between" style={{
            padding: "14px 16px", borderRadius: 14, background: "var(--cream-soft)",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>שולם</div>
              <div className="small muted">{paid ? "החזר ללא שולם אם סימנת בטעות" : "סמן כשהתשלום בוצע"}</div>
            </div>
            <button
              onClick={() => setPaid(!paid)}
              style={{
                width: 50, height: 28, borderRadius: 999,
                background: paid ? "var(--good)" : "var(--line-strong)",
                border: "none", padding: 3, cursor: "pointer",
                display: "flex", justifyContent: paid ? "flex-end" : "flex-start",
                transition: "background .15s ease",
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff" }} />
            </button>
          </div>

          <div className="vstack gap-10 mt-20">
            <button className="btn" onClick={save}>שמור</button>
            <button
              className="btn ghost"
              onClick={() => { onDelete && onDelete(bill.id); onClose && onClose(); }}
              style={{ borderColor: "var(--line)", color: "var(--danger)" }}
            >מחק חשבון</button>
          </div>
        </div>
      )}
    </Sheet>
  );
};

const AddBillSheet = ({ open, people, onClose, onAdd }) => {
  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("rent");
  const [assignee, setAssignee] = React.useState("you");
  const [dueDate, setDueDate] = React.useState("");
  const [recurring, setRecurring] = React.useState("");

  React.useEffect(() => {
    if (open) { setLabel(""); setAmount(""); setCategory("rent"); setAssignee("you"); setDueDate(""); setRecurring(""); }
  }, [open]);

  const canSave = label.trim() && parseFloat(amount) > 0;
  const save = () => {
    onAdd({
      label: label.trim(),
      amount: parseFloat(amount),
      category,
      assignee,
      dueDate,
      recurring: recurring || null,
      status: "upcoming",
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} maxHeight="92%">
      <div className="px-22" style={{ paddingBottom: 20 }}>
        <div className="h2 mt-8">חשבון חדש</div>

        <div className="mt-16">
          <div className="field-label">שם</div>
          <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="לדוגמה: שכר דירה" />
        </div>

        <div className="mt-16">
          <div className="field-label">סכום</div>
          <input className="input num" inputMode="decimal" value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
        </div>

        <div className="mt-16">
          <div className="field-label">תאריך תשלום</div>
          <input className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="לדוגמה: 1 ביוני" />
        </div>

        <div className="mt-16">
          <div className="field-label">קטגוריה</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "transparent", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: "inherit", flexShrink: 0,
                }}>
                <div className={`bg-${cat.color}`} style={{
                  width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center",
                  border: category === cat.id ? "2px solid var(--ink)" : "2px solid transparent",
                }}>
                  <Icon name={cat.icon} size={20} color="#0E0E0E" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: category === cat.id ? "var(--ink)" : "var(--text-2)" }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">אחראי</div>
          <div className="hstack gap-8" style={{ flexWrap: "wrap" }}>
            {people.map(p => (
              <button key={p.id} onClick={() => setAssignee(p.id)}
                className={`chip ${assignee === p.id ? "active" : "outline"}`}
                style={{ fontFamily: "inherit", height: 36, padding: "0 14px" }}>{p.name}</button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="field-label">חזרתיות</div>
          <div className="segment">
            <div className={`seg ${recurring === "" ? "active" : ""}`} onClick={() => setRecurring("")}>חד-פעמי</div>
            <div className={`seg ${recurring === "חודשי" ? "active" : ""}`} onClick={() => setRecurring("חודשי")}>חודשי</div>
            <div className={`seg ${recurring === "דו-חודשי" ? "active" : ""}`} onClick={() => setRecurring("דו-חודשי")}>דו-חודשי</div>
            <div className={`seg ${recurring === "שנתי" ? "active" : ""}`} onClick={() => setRecurring("שנתי")}>שנתי</div>
          </div>
        </div>

        <button className="btn mt-20" onClick={save} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.4 }}>
          שמור חשבון
        </button>
      </div>
    </Sheet>
  );
};

const BillsScreen = ({ onBack }) => {
  const { state, addBill, updateBill, removeBill } = useAppState();
  const bills = state.bills;
  const people = state.people;
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  const filtered = bills.filter(b => {
    if (filter === "all") return true;
    if (filter === "overdue") return b.status === "overdue";
    if (filter === "upcoming") return b.status !== "paid" && !b.paid;
    if (filter === "paid") return b.paid;
    return true;
  });

  const payBill = (bill) => updateBill(bill.id, { paid: true, status: "paid" });
  const totalDue = bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="scroll">
      <TopBar
        title="חשבונות"
        onBack={onBack}
        trailing={
          <button className="btn icon-only soft" onClick={() => setAdding(true)} style={{ background: "var(--cream-soft)" }}>
            <Icon name="plus" size={18} />
          </button>
        }
      />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--cream)" }}>
          <div className="tiny">לתשלום</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(totalDue, 0)}</div>
        </div>

        {bills.length > 0 && (
          <div className="hstack gap-6" style={{ overflowX: "auto", paddingBottom: 2 }}>
            {[
              { id: "all", label: "הכל" },
              { id: "overdue", label: "בפיגור" },
              { id: "upcoming", label: "ממתינים" },
              { id: "paid", label: "שולמו" },
            ].map(f => (
              <button
                key={f.id}
                className={`chip ${filter === f.id ? "active" : "outline"}`}
                onClick={() => setFilter(f.id)}
                style={{ fontFamily: "inherit" }}
              >{f.label}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <button onClick={() => setAdding(true)} className="card dashed" style={{
            background: "transparent", padding: 28, textAlign: "center", cursor: "pointer",
            fontFamily: "inherit", width: "100%",
          }}>
            <div className="small muted" style={{ marginBottom: 6 }}>אין חשבונות</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>+ הוסף חשבון</div>
          </button>
        ) : (
          <div className="card" style={{ padding: "4px 18px" }}>
            {filtered.map(b => (
              <BillRow key={b.id} bill={b} people={people} onPay={payBill} onPick={setSelected} />
            ))}
          </div>
        )}
      </div>

      <BillDetailSheet
        bill={selected}
        people={people}
        onClose={() => setSelected(null)}
        onUpdate={updateBill}
        onDelete={removeBill}
      />
      <AddBillSheet open={adding} people={people} onClose={() => setAdding(false)} onAdd={addBill} />
    </div>
  );
};

Object.assign(window, { BillsScreen });
