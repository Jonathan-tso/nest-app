/* global React, Icon, Avatar, TopBar, PEOPLE, EXPENSES_MAY, shek */
// Household — who paid what + settle up

const HouseholdScreen = ({ onBack }) => {
  const totals = {};
  PEOPLE.forEach(p => { totals[p.id] = { paid: 0, share: 0 }; });
  EXPENSES_MAY.forEach(e => {
    totals[e.paidBy].paid += e.amount;
    if (e.split === 50) {
      PEOPLE.forEach(p => { totals[p.id].share += e.amount / 2; });
    } else if (e.split === 100) {
      const other = PEOPLE.find(p => p.id !== e.paidBy);
      totals[other.id].share += e.amount;
    } else if (e.split === 0) {
      totals[e.paidBy].share += e.amount;
    }
  });

  const youBalance = totals.you.paid - totals.you.share;
  const owedAmount = Math.abs(youBalance);
  const youOwe = youBalance < 0;

  const [showSettle, setShowSettle] = React.useState(false);

  return (
    <div className="scroll">
      <TopBar title="משק בית" onBack={onBack} />

      <div className="px-22 vstack gap-14">
        <div className="card" style={{ padding: 20, background: "var(--ink)", color: "#fff", border: "none" }}>
          <div className="tiny" style={{ color: "rgba(255,255,255,.7)" }}>מאזן</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>
            {youOwe ? "אתה חייב ל" : "נועה חייבת ל"}<span style={{ fontWeight: 800 }}>{youOwe ? "נועה" : "ך"}</span>
          </div>
          <div className="h1 num" style={{ marginTop: 8 }}>{shek(owedAmount, 0)}</div>
          <button
            className="btn"
            onClick={() => setShowSettle(true)}
            style={{
              marginTop: 14,
              background: "#fff", color: "var(--ink)", width: "auto", padding: "0 22px",
            }}
          >סגירת חשבון</button>
        </div>

        <div>
          <div className="h3 mb-12">חברי הבית</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {PEOPLE.map(p => {
              const t = totals[p.id];
              const balance = t.paid - t.share;
              return (
                <div key={p.id} className="row">
                  <Avatar name={p.name} color={p.color} size="lg" />
                  <div className="meta" style={{ marginInlineStart: 8 }}>
                    <div className="t">{p.name}</div>
                    <div className="s">שילם {shek(t.paid, 0)} · חלק {shek(t.share, 0)}</div>
                  </div>
                  <div className="trail">
                    <div className="amt num" style={{
                      color: balance >= 0 ? "var(--good)" : "var(--danger)",
                    }}>
                      {balance >= 0 ? "+" : ""}{shek(balance, 0)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="row" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="lead" style={{ background: "var(--cream-soft)", border: "1.5px dashed var(--line-strong)" }}>
                <Icon name="plus" size={20} color="#0E0E0E" />
              </div>
              <div className="meta">
                <div className="t" style={{ color: "var(--text-2)" }}>הזמן בן/בת בית</div>
              </div>
              <div className="trail"><Icon name="chevron" size={18} color="var(--text-3)" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`scrim ${showSettle ? "open" : ""}`} onClick={() => setShowSettle(false)} />
      <div className={`sheet ${showSettle ? "open" : ""}`}>
        <div className="grip" />
        <div className="px-22" style={{ paddingBottom: 24 }}>
          <div className="h2 mt-8">סגירת חשבון</div>
          <div className="card" style={{ marginTop: 16, padding: 18, background: "var(--cream-soft)" }}>
            <div className="hstack between">
              <div>
                <div className="tiny">סכום</div>
                <div className="h1 num" style={{ marginTop: 4 }}>{shek(owedAmount, 0)}</div>
              </div>
              <div className="hstack gap-8">
                <Avatar name="דניאל" color="sky" size="lg" />
                <Icon name="arrow" size={20} />
                <Avatar name="נועה" color="mint" size="lg" />
              </div>
            </div>
          </div>
          <div className="vstack gap-10 mt-16">
            <button className="btn" onClick={() => setShowSettle(false)}>שלם עכשיו</button>
            <button className="btn ghost" onClick={() => setShowSettle(false)}>סמן כשולם</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HouseholdScreen });
