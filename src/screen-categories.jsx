/* global React, Icon, TopBar, useAppState, CATEGORIES */

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const CategoriesScreen = ({ onBack, onPick }) => {
  const { state } = useAppState();
  const totals = {};
  state.expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="scroll">
      <TopBar title="קטגוריות" onBack={onBack} />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--cream)" }}>
          <div className="tiny">סך הכל</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(grandTotal, 0)}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CATEGORIES.map(c => {
            const v = totals[c.id] || 0;
            const pct = grandTotal > 0 ? Math.round((v / grandTotal) * 100) : 0;
            return (
              <button
                key={c.id}
                onClick={() => onPick && onPick(c.id)}
                className="card"
                style={{
                  padding: 14, textAlign: "right", cursor: "pointer", border: "1px solid var(--line)",
                  background: "var(--paper)", fontFamily: "inherit",
                  opacity: v === 0 ? 0.5 : 1,
                }}
              >
                <div className="hstack between mb-12">
                  <div className={`bg-${c.color}`} style={{
                    width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center",
                  }}>
                    <Icon name={c.icon} size={18} color="#0E0E0E" />
                  </div>
                  {v > 0 && <span className="tiny">{pct}%</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.label}</div>
                <div className="num" style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{shek(v, 0)}</div>
                <div className="bar" style={{ marginTop: 10 }}>
                  <i style={{ width: `${pct}%`, background: c.hex }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CategoriesScreen });
