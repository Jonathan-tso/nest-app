/* global React, Icon, Avatar, TopBar, PEOPLE, EXPENSES_MAY, shek */
// Household — who paid what + settle up

const HouseholdScreen = ({ onBack }) => {
  // Sum totals paid by each person
  const totals = {};
  PEOPLE.forEach(p => { totals[p.id] = { paid: 0, share: 0 }; });
  EXPENSES_MAY.forEach(e => {
    totals[e.paidBy].paid += e.amount;
    // 'split' is the percentage paid by partner; e.split = 50 means equal split
    if (e.split === 50) {
      PEOPLE.forEach(p => { totals[p.id].share += e.amount / 2; });
    } else if (e.split === 100) {
      // paid for the other
      const other = PEOPLE.find(p => p.id !== e.paidBy);
      totals[other.id].share += e.amount;
    } else if (e.split === 0) {
      // personal — only payer
      totals[e.paidBy].share += e.amount;
    }
  });

  const youBalance = totals.you.paid - totals.you.share;
  const noaBalance = totals.noa.paid - totals.noa.share;

  const owedAmount = Math.abs(youBalance);
  const youOwe = youBalance < 0;

  const [showSettle, setShowSettle] = React.useState(false);

  return (
    <div className="scroll">
      <TopBar
        title="משק בית"
        onBack={onBack}
        trailing={
          <button className="btn icon-only soft" style={{ background: "var(--cream-soft)" }}>
            <Icon name="plus" size={18} />
          </button>
        }
      />

      <div className="px-22 vstack gap-14">
        <div className="card" style={{ padding: 20, background: "var(--ink)", color: "#fff", border: "none" }}>
          <div className="tiny" style={{ color: "rgba(255,255,255,.7)" }}>מאזן נוכחי</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>
            {youOwe ? "את חייבת ל" : "נועה חייבת ל"}<span style={{ fontWeight: 800 }}>{youOwe ? "נועה" : "את"}</span>
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
                    <div className="s">שילמה {shek(t.paid, 0)} · חלק {shek(t.share, 0)}</div>
                  </div>
                  <div className="trail">
                    <div className="amt num" style={{
                      color: balance >= 0 ? "var(--good)" : "var(--danger)",
                    }}>
                      {balance >= 0 ? "+" : ""}{shek(balance, 0)}
                    </div>
                    <div className="tiny" style={{ marginTop: 2 }}>{balance >= 0 ? "מגיע לה" : "חייבת"}</div>
                  </div>
                </div>
              );
            })}
            <div className="row" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="lead" style={{ background: "var(--cream-soft)", border: "1.5px dashed var(--line-strong)" }}>
                <Icon name="plus" size={20} color="#0E0E0E" />
              </div>
              <div className="meta">
                <div className="t" style={{ color: "var(--text-2)" }}>הוסיפי בן/בת בית</div>
                <div className="s">הזמיני שותף.ה לבית</div>
              </div>
              <div className="trail"><Icon name="chevron" size={18} color="var(--text-3)" /></div>
            </div>
          </div>
        </div>

        <div>
          <div className="h3 mb-12">פעילות תשלומים</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {EXPENSES_MAY.slice(0, 6).map(e => {
              const payer = PEOPLE.find(p => p.id === e.paidBy);
              return (
                <div key={e.id} className="row">
                  <Avatar name={payer?.name || "?"} color={payer?.color || "cream"} size="" />
                  <div className="meta" style={{ marginInlineStart: 4 }}>
                    <div className="t">{e.label}</div>
                    <div className="s">{payer?.name} שילמה · {e.date}</div>
                  </div>
                  <div className="trail">
                    <div className="amt num">{shek(e.amount, 0)}</div>
                    <div className="tiny" style={{ marginTop: 2 }}>
                      {e.split === 50 ? "חצי-חצי" : e.split === 100 ? "בשבילך" : "אישי"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settle sheet */}
      <div className={`scrim ${showSettle ? "open" : ""}`} onClick={() => setShowSettle(false)} />
      <div className={`sheet ${showSettle ? "open" : ""}`}>
        <div className="grip" />
        <div className="px-22" style={{ paddingBottom: 24 }}>
          <div className="h2 mt-8">סגירת חשבון</div>
          <div className="small muted mt-4">העברה חד פעמית לאיזון הוצאות החודש</div>
          <div className="card" style={{ marginTop: 16, padding: 18, background: "var(--cream-soft)" }}>
            <div className="hstack between">
              <div>
                <div className="tiny">סכום</div>
                <div className="h1 num" style={{ marginTop: 4 }}>{shek(owedAmount, 0)}</div>
              </div>
              <div className="hstack gap-8">
                <Avatar name="מאיה" color="pink" size="lg" />
                <Icon name="arrow" size={20} />
                <Avatar name="נועה" color="mint" size="lg" />
              </div>
            </div>
          </div>
          <div className="vstack gap-10 mt-16">
            <button className="btn" onClick={() => setShowSettle(false)}>שלמי עכשיו בביט</button>
            <button className="btn ghost" onClick={() => setShowSettle(false)}>סמני כשולם</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HouseholdScreen });
