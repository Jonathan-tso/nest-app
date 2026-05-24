/* global React, Icon, TopBar, useAppState, CAT, BarChart */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const HistoryScreen = ({ onBack }) => {
  const { state } = useAppState();
  const allExpenses = state.expenses;
  const allBills = state.bills || [];
  const budget = state.budget;
  const now = new Date();

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

  // Last 6 months, oldest → newest (so RTL flex renders newest on the left)
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

  // Newest first for the list
  const monthsDesc = [...months].reverse();

  return (
    <div className="scroll">
      <TopBar title="היסטוריה" onBack={onBack} />
      <div className="px-22 vstack gap-14">

        {/* 6-month overview */}
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

        {/* Monthly cards */}
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
              <div key={m.key} className="card" style={{ padding: 16 }}>
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
