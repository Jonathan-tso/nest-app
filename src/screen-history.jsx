/* global React, Icon, TopBar, Sparkline, BarChart, MONTHLY_HISTORY, EXPENSES_MAY, CAT, shek */
// History — prior months + drilldown

const HistoryScreen = ({ onBack }) => {
  const [selected, setSelected] = React.useState(MONTHLY_HISTORY[0]);

  const sparkPoints = [...MONTHLY_HISTORY].reverse().map(m => m.total);
  const bars = [...MONTHLY_HISTORY].slice(0, 6).reverse().map(m => ({
    label: m.month.split(" ")[0].slice(0, 3),
    value: m.total,
    highlight: m.month === selected.month,
  }));

  const byCat = {};
  EXPENSES_MAY.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat)
    .map(([id, v]) => ({ ...CAT[id], value: v }))
    .sort((a, b) => b.value - a.value);

  const total = selected.total;
  const overUnder = selected.budget - total;
  const overBudget = overUnder < 0;

  return (
    <div className="scroll">
      <TopBar title="היסטוריה" onBack={onBack} />
      <div className="px-22 vstack gap-14">
        <div className="card" style={{ padding: 18 }}>
          <div className="hstack between mb-12">
            <div>
              <div className="tiny">סך הכל לפי חודש</div>
              <div className="h2 num" style={{ marginTop: 4 }}>{shek(selected.total, 0)}</div>
              <div className="small" style={{
                marginTop: 2,
                color: overBudget ? "var(--danger)" : "var(--good)",
                fontWeight: 700,
              }}>
                {overBudget
                  ? `${shek(Math.abs(overUnder), 0)} מעל התקציב`
                  : `${shek(overUnder, 0)} מתחת לתקציב`}
              </div>
            </div>
            <Sparkline points={sparkPoints} width={140} height={56} />
          </div>
          <BarChart data={bars} height={110} />
        </div>

        <div>
          <div className="h3 mb-12">חודשים קודמים</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {MONTHLY_HISTORY.map(m => {
              const isCurrent = m.month === selected.month;
              const overB = m.budget - m.total < 0;
              return (
                <div
                  key={m.month}
                  className="row"
                  onClick={() => setSelected(m)}
                  style={{ cursor: "pointer", opacity: isCurrent ? 1 : 0.95 }}
                >
                  <div className="lead bg-cream">
                    <Icon name="calendar" size={20} color="#0E0E0E" />
                  </div>
                  <div className="meta">
                    <div className="t">{m.month}</div>
                    <div className="s">
                      תקציב {shek(m.budget, 0)}
                      <span style={{
                        marginInlineStart: 6,
                        color: overB ? "var(--danger)" : "var(--good)",
                        fontWeight: 700,
                      }}>
                        {m.change > 0 ? "+" : ""}{m.change}%
                      </span>
                    </div>
                  </div>
                  <div className="trail">
                    <div className="amt num">{shek(m.total, 0)}</div>
                    {isCurrent && <div className="tiny" style={{ marginTop: 2, color: "var(--good)" }}>נבחר</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="h3 mb-12">פירוט קטגוריות — {selected.month}</div>
          <div className="card" style={{ padding: 18 }}>
            <div className="vstack gap-10">
              {cats.map(cat => {
                const pct = Math.round((cat.value / total) * 100);
                return (
                  <div key={cat.id}>
                    <div className="hstack between mb-8" style={{ marginBottom: 6 }}>
                      <div className="hstack gap-8">
                        <div className={`bg-${cat.color}`} style={{
                          width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                        }}>
                          <Icon name={cat.icon} size={12} color="#0E0E0E" />
                        </div>
                        <span className="small" style={{ fontWeight: 600, color: "var(--text)" }}>{cat.label}</span>
                      </div>
                      <div className="hstack gap-8">
                        <span className="small muted">{pct}%</span>
                        <span className="small num" style={{ fontWeight: 700, color: "var(--text)" }}>{shek(cat.value, 0)}</span>
                      </div>
                    </div>
                    <div className="bar"><i style={{ width: `${pct}%`, background: cat.hex }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen });
