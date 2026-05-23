/* global React, Icon, TopBar, Sheet, CAT, CATEGORIES, PEOPLE, BILLS, shek */
// Bills screen — list + calendar, with edit/undo detail sheet

const BillRow = ({ bill, onPay, onPick }) => {
  const c = CAT[bill.category];
  const assignee = PEOPLE.find(p => p.id === bill.assignee);
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

const BillsCalendar = ({ bills, onPick }) => {
  const todayIso = "2026-05-23";
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="hstack between mb-12">
        <div className="h4">מאי / יוני</div>
        <div className="small muted">{bills.length} חשבונות</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {["א","ב","ג","ד","ה","ו","ש"].map(d =>
          <div key={d} className="tiny" style={{ textAlign: "center" }}>{d}</div>
        )}
        {Array.from({ length: 31 }).map((_, i) => {
          const dayNum = 22 + i;
          const month = dayNum > 31 ? 6 : 5;
          const realDay = dayNum > 31 ? dayNum - 31 : dayNum;
          const iso = `2026-${String(month).padStart(2,"0")}-${String(realDay).padStart(2,"0")}`;
          const today = iso === todayIso;
          const matches = bills.filter(b => b.dueIso === iso);
          const hasOverdue = matches.some(b => b.status === "overdue");
          const clickable = matches.length > 0;
          return (
            <div
              key={i}
              onClick={() => clickable && onPick && onPick(matches[0])}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                background: today ? "var(--ink)" : matches.length ? "var(--cream-soft)" : "transparent",
                color: today ? "#fff" : "var(--text)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                border: matches.length && !today ? "1px solid var(--line)" : undefined,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <div>{realDay}</div>
              {matches.length > 0 && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%", marginTop: 3,
                  background: hasOverdue ? "var(--danger)" : today ? "#fff" : "var(--ink)",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BillDetailSheet = ({ bill, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("rent");
  const [assignee, setAssignee] = React.useState("you");
  const [paid, setPaid] = React.useState(false);

  React.useEffect(() => {
    if (bill) {
      setLabel(bill.label);
      setAmount(String(bill.amount));
      setCategory(bill.category);
      setAssignee(bill.assignee);
      setPaid(!!bill.paid);
    }
  }, [bill]);

  const save = () => {
    const num = parseFloat(amount) || 0;
    onUpdate && onUpdate({
      ...bill,
      label: label.trim() || bill.label,
      amount: num,
      category,
      assignee,
      paid,
      status: paid ? "paid" : (bill.status === "overdue" ? "overdue" : "upcoming"),
    });
    onClose && onClose();
  };

  const c = bill ? CAT[bill.category] : null;

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
              <div className="small muted">{bill.dueDate}{bill.recurring ? ` · ${bill.recurring}` : ""}</div>
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
            <div className="hstack gap-8">
              {PEOPLE.map(p => (
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
              <div className="small muted">{paid ? "סמן בטעות? כבה כדי להחזיר" : "סמן כשהתשלום בוצע"}</div>
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
              onClick={() => { onDelete && onDelete(bill); onClose && onClose(); }}
              style={{ borderColor: "var(--line)", color: "var(--danger)" }}
            >מחק חשבון</button>
          </div>
        </div>
      )}
    </Sheet>
  );
};

const BillsScreen = ({ viz = "list", onBack, onAdd }) => {
  const [filter, setFilter] = React.useState("all");
  const [bills, setBills] = React.useState(BILLS);
  const [selected, setSelected] = React.useState(null);

  const filtered = bills.filter(b => {
    if (filter === "all") return true;
    if (filter === "overdue") return b.status === "overdue";
    if (filter === "upcoming") return b.status !== "paid" && !b.paid;
    if (filter === "paid") return b.paid;
    return true;
  });

  const payBill = (bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid: true, status: "paid" } : b));
  };

  const updateBill = (next) => {
    setBills(prev => prev.map(b => b.id === next.id ? next : b));
  };

  const deleteBill = (bill) => {
    setBills(prev => prev.filter(b => b.id !== bill.id));
  };

  const totalDue = bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="scroll">
      <TopBar
        title="חשבונות"
        onBack={onBack}
        trailing={
          <button className="btn icon-only soft" onClick={onAdd} style={{ background: "var(--cream-soft)" }}>
            <Icon name="plus" size={18} />
          </button>
        }
      />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--cream)" }}>
          <div className="tiny">לתשלום החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(totalDue, 0)}</div>
        </div>

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

        {viz === "calendar" && <BillsCalendar bills={filtered} onPick={setSelected} />}

        <div className="card" style={{ padding: "4px 18px" }}>
          {filtered.length === 0 ? (
            <div className="small muted" style={{ padding: 28, textAlign: "center" }}>אין חשבונות</div>
          ) : filtered.map(b => (
            <BillRow key={b.id} bill={b} onPay={payBill} onPick={setSelected} />
          ))}
        </div>
      </div>

      <BillDetailSheet
        bill={selected}
        onClose={() => setSelected(null)}
        onUpdate={updateBill}
        onDelete={deleteBill}
      />
    </div>
  );
};

Object.assign(window, { BillsScreen });
