/* global React, Icon, TopBar, useAppState, CAT, BarChart */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const MonthDetail = ({ m, allExpenses, allBills, budget, onBack }) => {
  const expenses = allExpenses.filter(e => {
    if (!e.createdAt) return false;
    const d = new Date(e.createdAt);
    return d.getMonth() === m.month && d.getFullYear() === m.year;
  });
  const paidBills = allBills.filter(b => {
    if (!b.paid) return false;
    const mk = b.dueDate && /^(\d{4})-(\d{2})/.exec(b.dueDate);
    return mk ? `${mk[1]}-${mk[2]}` === m.key : false;
  });
  const combined = [...expenses, ...paidBills];
  const total = combined.reduce((s, e) => s + e.amount, 0);

  const byCat = {};
  combined.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat)
    .map(([id, v]) => ({ ...(CAT[id] || CAT.household), id, value: v }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="scroll">
      <TopBar title={m.fullLabel} onBack={onBack} />
      <div className="px-22 vstack gap-14">

        {/* Summary */}
        <div className="card" style={{ padding: 18 }}>
          <div className="tiny">סך הכל</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          <div className="small muted" style={{ marginTop: 2 }}>
            {combined.length > 0 ? `${combined.length} הוצאות` : "אין הוצאות לחודש זה"}
          </div>
          {budget > 0 && (
            <>
              <div className="bar" style={{ marginTop: 12 }}>
                <i style={{
                  width: `${Math.min(Math.round((total / budget) * 100), 100)}%`,
                  background: total > budget ? "var(--danger)" : "var(--ink)",
                }} />
              </div>
              <div className="small muted" style={{ marginTop: 6 }}>
                {Math.round((total / budget) * 100)}% מתוך {shek(budget, 0)}
              </div>
            </>
          )}
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

        {/* Transaction list */}
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

const HistoryScreen = ({ onBack }) => {
  const { state } = useAppState();
  const allExpenses = state.expenses;
  const allBills = state.bills || [];
  const budget = state.budget;
  const now = new Date();
  const [selected, setSelected] = React.useState(null);

  const getMonthTotal = (year, month) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const exp = allExpenses.filter(e => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const bills = allBills.filter(b => {
      if (!b.paid) return false;
      const mk = b.dueDate && /^(\d{4})-(\d{2})/.exec(b.dueDate);
      return mk ? `${mk[1]}-${mk[2]}` === key : false;
    });
    return [...exp, ...bills].reduce((s, e) => s + e.amount, 0);
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    return {
      year, month,
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      shortLabel: d.toLocaleDateString("he-IL", { month: "short" }),
      fullLabel: d.toLocaleDateString("he-IL", { month: "long", year: "numeric" }),
      total: getMonthTotal(year, month),
    };
  });

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const avg = months.reduce((s, m) => s + m.total, 0) / months.length;

  const barData = months.map(m => ({
    value: m.total || 0.5,
    label: m.shortLabel,
    highlight: m.key === currentKey,
  }));

  const monthsDesc = [...months].reverse();

  if (selected) {
    return (
      <MonthDetail
        m={selected}
        allExpenses={allExpenses}
        allBills={allBills}
        budget={budget}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="scroll">
      <TopBar title="היסטוריה" onBack={onBack} />
      <div className="px-22 vstack gap-14">

        <div className="card" style={{ padding: 20 }}>
          <div style={{ textAlign: "end" }}>
            <div className="tiny">ממוצע של 6 חודשים</div>
            <div className="h1 num" style={{ marginTop: 4 }}>{shek(avg, 0)}</div>
            <div className="small muted" style={{ marginTop: 2 }}>על פני 6 חודשים</div>
          </div>
          <div style={{ marginTop: 20 }}>
            <BarChart data={barData} height={140} />
          </div>
        </div>

        <div className="h3">לפי חודש</div>
        <div className="vstack gap-10">
          {monthsDesc.map((m, i) => {
            const prev = monthsDesc[i + 1];
            const change = prev && prev.total > 0
              ? Math.round(((m.total - prev.total) / prev.total) * 100)
              : null;
            const budgetPct = budget ? Math.round((m.total / budget) * 100) : null;
            const isCurrent = m.key === currentKey;
            const decreased = change !== null && change <= 0;

            return (
              <div key={m.key} className="card" style={{ padding: 16, cursor: "pointer" }}
                onClick={() => setSelected(m)}>
                <div className="hstack between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div className="h2 num">{shek(m.total, 0)}</div>
                    {change !== null && (
                      <div style={{
                        fontSize: 13, fontWeight: 700, marginTop: 4,
                        color: decreased ? "var(--good)" : "var(--danger)",
                      }}>
                        {Math.abs(change)}% {decreased ? "↓" : "↑"}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="hstack gap-6" style={{ justifyContent: "flex-end", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{m.fullLabel}</span>
                      {isCurrent && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: "var(--ink)", color: "#fff",
                        }}>החודש</span>
                      )}
                    </div>
                    {budgetPct !== null && (
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {budgetPct}% מתוך {shek(budget, 0)}
                      </div>
                    )}
                  </div>
                </div>
                {budget && (
                  <div className="bar" style={{ marginTop: 12 }}>
                    <i style={{
                      width: `${Math.min(budgetPct, 100)}%`,
                      background: budgetPct > 100 ? "var(--danger)" : "var(--ink)",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen });
