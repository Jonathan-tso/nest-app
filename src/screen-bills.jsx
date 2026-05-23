/* global React, Icon, TopBar, CAT, PEOPLE, BILLS, shek */
// Bills screen — list view + calendar view

const BillRow = ({ bill, onPay, onPick }) => {
  const c = CAT[bill.category];
  const assignee = PEOPLE.find(p => p.id === bill.assignee);
  const overdue = bill.status === "overdue";
  const paid = bill.paid;
  return (
    <div
      className="row"
      onClick={() => onPick && onPick(bill)}
      style={{ cursor: "pointer" }}
    >
      <div className={`lead bg-${c.color}`} style={{ opacity: paid ? 0.55 : 1 }}>
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
          {overdue && <span style={{ color: "var(--danger)", fontWeight: 700 }}> · {bill.daysOverdue} ימים באיחור</span>}
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
          >שלמי</button>
        )}
      </div>
    </div>
  );
};

// === Calendar view ===
const BillsCalendar = ({ bills, onPay, onPick }) => {
  // group by due date (YYYY-MM)
  const days = {};
  bills.forEach(b => {
    const k = b.dueIso || b.dueDate;
    if (!days[k]) days[k] = [];
    days[k].push(b);
  });
  // sort keys ascending
  const sortedKeys = Object.keys(days).sort();

  // build a simple month calendar grid for the upcoming month
  const todayIso = "2026-05-23";

  return (
    <div className="vstack gap-14">
      <div className="card" style={{ padding: 14 }}>
        <div className="hstack between mb-12">
          <div className="h4">מאי / יוני 2026</div>
          <div className="small muted">{bills.length} חשבונות</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {["א","ב","ג","ד","ה","ו","ש"].map(d =>
            <div key={d} className="tiny" style={{ textAlign: "center" }}>{d}</div>
          )}
          {/* render days from 22 May -> 21 June, 31 cells */}
          {Array.from({ length: 31 }).map((_, i) => {
            const dayNum = 22 + i;
            const month = dayNum > 31 ? 6 : 5;
            const realDay = dayNum > 31 ? dayNum - 31 : dayNum;
            const iso = `2026-${String(month).padStart(2,"0")}-${String(realDay).padStart(2,"0")}`;
            const today = iso === todayIso;
            const matches = bills.filter(b => b.dueIso === iso);
            const hasOverdue = matches.some(b => b.status === "overdue");
            return (
              <div key={i} style={{
                aspectRatio: "1",
                borderRadius: 10,
                background: today ? "var(--ink)" : matches.length ? "var(--cream-soft)" : "transparent",
                color: today ? "#fff" : "var(--text)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                border: matches.length && !today ? "1px solid var(--line)" : undefined,
                cursor: matches.length ? "pointer" : "default",
                position: "relative",
              }}>
                <div>{realDay}</div>
                {matches.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                    {matches.slice(0, 3).map((b,j) => (
                      <span key={j} style={{
                        width: 4, height: 4, borderRadius: "50%",
                        background: hasOverdue && b.status === "overdue" ? "var(--danger)" : today ? "#fff" : "var(--ink)",
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: "4px 18px" }}>
        {sortedKeys.map(k =>
          days[k].map(b => <BillRow key={b.id} bill={b} onPay={onPay} onPick={onPick} />)
        )}
      </div>
    </div>
  );
};

const BillsScreen = ({ viz = "list", onBack, onAdd, onPick, onPay }) => {
  const [filter, setFilter] = React.useState("all");
  const [bills, setBills] = React.useState(BILLS);

  const filtered = bills.filter(b => {
    if (filter === "all") return true;
    if (filter === "overdue") return b.status === "overdue";
    if (filter === "upcoming") return b.status === "upcoming" && !b.paid;
    if (filter === "paid") return b.paid;
    return true;
  });

  const payBill = (bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid: true, status: "paid" } : b));
    onPay && onPay(bill);
  };

  const totalUpcoming = filtered.reduce((s,b) => s + b.amount, 0);

  return (
    <div className="scroll">
      <TopBar
        title="חשבונות"
        onBack={onBack}
        trailing={
          <button
            className="btn icon-only soft"
            onClick={onAdd}
            style={{ background: "var(--cream-soft)" }}
          >
            <Icon name="plus" size={18} />
          </button>
        }
      />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--cream)" }}>
          <div className="tiny">סך לתשלום החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(totalUpcoming, 0)}</div>
          <div className="small muted" style={{ marginTop: 2 }}>{filtered.length} חשבונות</div>
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

        {viz === "calendar" ? (
          <BillsCalendar bills={filtered} onPay={payBill} onPick={onPick} />
        ) : (
          <div className="card" style={{ padding: "4px 18px" }}>
            {filtered.length === 0 ? (
              <div className="small muted" style={{ padding: 28, textAlign: "center" }}>אין חשבונות בקטגוריה הזו</div>
            ) : filtered.map(b => (
              <BillRow key={b.id} bill={b} onPay={payBill} onPick={onPick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { BillsScreen });
