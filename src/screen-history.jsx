/* global React, Icon, TopBar, useAppState, CAT */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Explicit SVG chevrons so RTL auto-flip doesn't interfere with month navigation
const ChevRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const ChevLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const HistoryScreen = ({ onBack }) => {
  const { state } = useAppState();
  const allExpenses = state.expenses;
  const allBills = state.bills || [];

  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth());
  const [year, setYear] = React.useState(now.getFullYear());

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const expenses = allExpenses.filter(e => {
    if (!e.createdAt) return true;
    const d = new Date(e.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const paidBillsThisMonth = allBills.filter(b => {
    if (!b.paid) return false;
    const mk = b.dueDate && /^(\d{4})-(\d{2})/.exec(b.dueDate);
    return mk ? `${mk[1]}-${mk[2]}` === selectedMonthKey : false;
  });

  const combined = [...expenses, ...paidBillsThisMonth];

  const total = combined.reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  combined.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat)
    .map(([id, v]) => ({ ...(CAT[id] || CAT.household), id, value: v }))
    .sort((a, b) => b.value - a.value);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="scroll">
      <TopBar title="היסטוריה" onBack={onBack} />
      <div className="px-22 vstack gap-14">

        {/* Month selector — in RTL: ChevRight on right = prev, ChevLeft on left = next */}
        <div className="hstack between" style={{ alignItems: "center" }}>
          <button onClick={goPrev} className="btn icon-only soft" style={{ flexShrink: 0 }}>
            <ChevRight />
          </button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{monthLabel}</div>
          <button
            onClick={goNext}
            disabled={isCurrentMonth}
            className="btn icon-only soft"
            style={{ flexShrink: 0, opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <ChevLeft />
          </button>
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: 18 }}>
          <div className="tiny">סך הכל החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          <div className="small muted" style={{ marginTop: 2 }}>
            {combined.length > 0 ? `${combined.length} הוצאות` : "אין הוצאות לחודש זה"}
          </div>
        </div>

        {/* Category breakdown */}
        {cats.length > 0 && (
          <div>
            <div className="h3 mb-12">לפי קטגוריה</div>
            <div className="card" style={{ padding: 18 }}>
              <div className="vstack gap-10">
                {cats.map(cat => {
                  const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                  return (
                    <div key={cat.id}>
                      <div className="hstack between" style={{ marginBottom: 6 }}>
                        <div className="hstack gap-8">
                          <div className={`bg-${cat.color}`} style={{
                            width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                          }}>
                            <Icon name={cat.icon} size={12} color="#0E0E0E" />
                          </div>
                          <span className="small" style={{ fontWeight: 600 }}>{cat.label}</span>
                        </div>
                        <div className="hstack gap-8">
                          <span className="small muted">{pct}%</span>
                          <span className="small num" style={{ fontWeight: 700 }}>{shek(cat.value, 0)}</span>
                        </div>
                      </div>
                      <div className="bar"><i style={{ width: `${pct}%`, background: cat.hex }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Expense list */}
        <div>
          <div className="h3 mb-12">כל ההוצאות</div>
          {combined.length === 0 ? (
            <div className="card dashed" style={{ padding: 32, textAlign: "center", background: "transparent" }}>
              <div className="small muted">אין הוצאות רשומות לחודש זה</div>
            </div>
          ) : (
            <div className="card" style={{ padding: "4px 18px" }}>
              {combined.map(e => {
                const c = CAT[e.category] || CAT.household;
                return (
                  <div key={e.id} className="row">
                    <div className={`lead bg-${c.color}`}>
                      <Icon name={c.icon} size={20} color="#0E0E0E" />
                    </div>
                    <div className="meta">
                      <div className="t">{e.label}</div>
                      <div className="s">{e.date || e.dueDate || ""}</div>
                    </div>
                    <div className="trail">
                      <div className="amt num">{shek(e.amount, e.amount % 1 ? 2 : 0)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen });
