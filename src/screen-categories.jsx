/* global React, Icon, TopBar, CATEGORIES, EXPENSES_MAY, shek */
// Categories — grid of all categories with totals

const CategoriesScreen = ({ onBack, onPick }) => {
  const totals = {};
  EXPENSES_MAY.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="scroll">
      <TopBar title="קטגוריות" onBack={onBack} />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--cream)" }}>
          <div className="tiny">סה״כ הוצאות במאי</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(grandTotal, 0)}</div>
          <div className="small muted" style={{ marginTop: 2 }}>{CATEGORIES.length} קטגוריות פעילות</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CATEGORIES.map(c => {
            const v = totals[c.id] || 0;
            const pct = v ? Math.round((v / grandTotal) * 100) : 0;
            return (
              <button
                key={c.id}
                onClick={() => onPick && onPick(c.id)}
                className="card"
                style={{
                  padding: 14, textAlign: "right", cursor: "pointer", border: "1px solid var(--line)",
                  background: "var(--paper)", fontFamily: "inherit",
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
