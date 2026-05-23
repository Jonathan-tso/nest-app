/* global React, Icon, TopBar, useAppState, CAT */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const HistoryScreen = ({ onBack }) => {
  const { state } = useAppState();
  const expenses = state.expenses;
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat)
    .map(([id, v]) => ({ ...(CAT[id] || CAT.household), id, value: v }))
    .sort((a, b) => b.value - a.value);

  if (expenses.length === 0) {
    return (
      <div className="scroll">
        <TopBar title="היסטוריה" onBack={onBack} />
        <div className="px-22">
          <div className="card dashed" style={{ padding: 40, textAlign: "center", background: "transparent" }}>
            <div className="small muted" style={{ marginBottom: 4 }}>אין נתונים</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>הוצאות יופיעו כאן ברגע שתוסיף</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <TopBar title="היסטוריה" onBack={onBack} />
      <div className="px-22 vstack gap-14">
        <div className="card" style={{ padding: 18 }}>
          <div className="tiny">סך הכל</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          <div className="small muted" style={{ marginTop: 2 }}>{expenses.length} הוצאות</div>
        </div>

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

        <div>
          <div className="h3 mb-12">כל ההוצאות</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {expenses.map(e => {
              const c = CAT[e.category] || CAT.household;
              return (
                <div key={e.id} className="row">
                  <div className={`lead bg-${c.color}`}>
                    <Icon name={c.icon} size={20} color="#0E0E0E" />
                  </div>
                  <div className="meta">
                    <div className="t">{e.label}</div>
                    <div className="s">{e.date}</div>
                  </div>
                  <div className="trail">
                    <div className="amt num">{shek(e.amount, e.amount % 1 ? 2 : 0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen });
