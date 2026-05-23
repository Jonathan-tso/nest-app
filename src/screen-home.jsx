/* global React, Icon, Avatar, AvatarStack, NestLogo, Donut, useAppState, CAT */
// Home / Summary screen

const { useState } = React;

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const computeBalance = (expenses, people) => {
  const you = people.find(p => p.owner) || people[0];
  if (!you || people.length < 2) return 0;
  let youPaid = 0, othersPaid = 0;
  expenses.forEach(e => {
    if (e.paidBy === you.id) youPaid += e.amount;
    else othersPaid += e.amount;
  });
  // fair share if 50/50 across household members
  const youShare = expenses.reduce((s, e) => {
    if (e.split === 50) return s + e.amount / Math.max(people.length, 1);
    if (e.split === 100 && e.paidBy !== you.id) return s + e.amount / Math.max(people.length - 1, 1);
    if (e.split === 0 && e.paidBy === you.id) return s + e.amount;
    return s;
  }, 0);
  return youPaid - youShare;
};

const OverdueBills = ({ bills, people, onOpen }) => {
  const overdue = bills.filter(b => b.status === "overdue");
  if (!overdue.length) return null;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "transparent", background: "var(--ink)", color: "#fff" }}>
      <div style={{ padding: "16px 18px 12px" }}>
        <div className="hstack between">
          <div className="hstack gap-8">
            <div className="bg-coral" style={{ width: 24, height: 24, borderRadius: 8, display: "grid", placeItems: "center" }}>
              <Icon name="bell" size={14} color="#0E0E0E" />
            </div>
            <span className="tiny" style={{ color: "rgba(255,255,255,.7)" }}>בפיגור</span>
          </div>
          <span className="small" style={{ color: "rgba(255,255,255,.6)" }}>{overdue.length} {overdue.length > 1 ? "חשבונות" : "חשבון"}</span>
        </div>
        {overdue.map(b => {
          const c = CAT[b.category] || CAT.household;
          const assignee = people.find(p => p.id === b.assignee);
          return (
            <div key={b.id} className="hstack between" style={{ marginTop: 14 }}>
              <div className="hstack gap-12">
                <div className={`bg-${c.color}`} style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center" }}>
                  <Icon name={c.icon} size={18} color="#0E0E0E" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{b.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>{assignee?.name || ""}</div>
                </div>
              </div>
              <div className="num" style={{ fontSize: 15, fontWeight: 800 }}>{shek(b.amount, b.amount % 1 ? 2 : 0)}</div>
            </div>
          );
        })}
      </div>
      <button onClick={onOpen} style={{
        width: "100%", padding: "12px", background: "rgba(255,255,255,.08)", color: "#fff", border: "none",
        fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        borderTop: "1px solid rgba(255,255,255,.1)",
      }}>
        תשלום עכשיו ←
      </button>
    </div>
  );
};

const SpendOverview = ({ expenses, budget }) => {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const data = Object.entries(byCat)
    .map(([id, v]) => ({ value: v, color: CAT[id]?.hex || "#999", label: CAT[id]?.label || id, id }))
    .sort((a, b) => b.value - a.value);

  const pct = budget ? Math.round((total / budget) * 100) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="hstack between">
        <div>
          <div className="tiny">החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          {budget > 0 && <div className="small muted">מתוך {shek(budget, 0)} · {pct}%</div>}
        </div>
        {data.length > 0 && <Donut data={data.slice(0, 5)} size={104} stroke={14} />}
      </div>
    </div>
  );
};

const BalanceCard = ({ balance, people, onSettle }) => {
  if (Math.abs(balance) < 0.5) return null;
  const youOwe = balance < 0;
  const others = people.filter(p => !p.owner);
  const counterpart = others[0]; // simple: first non-owner
  if (!counterpart) return null;
  return (
    <div className="card" style={{ padding: 18, background: "var(--cream-soft)" }}>
      <div className="hstack between">
        <div className="vstack gap-4">
          <div className="tiny">מאזן</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {youOwe
              ? <>אתה חייב ל<span style={{ fontWeight: 800 }}>{counterpart.name}</span></>
              : <><span style={{ fontWeight: 800 }}>{counterpart.name}</span> חייב{counterpart.name?.endsWith("ה") ? "ת" : ""} לך</>}
          </div>
          <div className="h2 num" style={{ marginTop: 2 }}>{shek(Math.abs(balance), 0)}</div>
        </div>
        <div className="vstack" style={{ alignItems: "center", gap: 6 }}>
          <AvatarStack people={people} size="" />
          <button className="btn sm" style={{ width: "auto" }} onClick={onSettle}>סגירה</button>
        </div>
      </div>
    </div>
  );
};

const GroceryPreview = ({ items, people, onOpen, onAdd }) => {
  const pending = items.filter(i => !i.checked);
  if (items.length === 0) {
    return (
      <button onClick={onAdd || onOpen} className="card dashed" style={{
        background: "transparent", padding: 18, fontFamily: "inherit", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "right",
      }}>
        <div className="bg-mint" style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center" }}>
          <Icon name="cart" size={18} color="#0E0E0E" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>אין פריטים בקניות</div>
          <div className="small muted">הוסף ידנית או ספר ל-AI</div>
        </div>
        <Icon name="plus" size={18} color="var(--text-2)" />
      </button>
    );
  }
  const top = pending.slice(0, 4);
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="hstack between mb-12">
        <div className="hstack gap-8">
          <div className="bg-mint" style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center" }}>
            <Icon name="cart" size={16} color="#0E0E0E" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>קניות</div>
            <div className="small muted">{pending.length} ממתינים</div>
          </div>
        </div>
        <button className="chip" onClick={onOpen} style={{ background: "transparent" }}>
          פתח <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="vstack gap-6">
        {top.map(item => {
          const author = people.find(p => p.id === item.addedBy);
          return (
            <div key={item.id} className="hstack between" style={{ padding: "6px 0" }}>
              <div className="hstack gap-10">
                <div className="check" style={{ width: 18, height: 18, borderRadius: 6 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                {item.qty && <span className="small muted">· {item.qty}</span>}
              </div>
              <span className="tiny">{item.addedBy === "ai" ? "AI" : author?.short || author?.name || ""}</span>
            </div>
          );
        })}
        {pending.length > 4 && (
          <div className="small muted" style={{ marginTop: 4 }}>+ עוד {pending.length - 4}</div>
        )}
      </div>
    </div>
  );
};

const RecentTransactions = ({ expenses, people, limit = 3, onSeeAll }) => {
  if (expenses.length === 0) return null;
  const recent = expenses.slice(0, limit);
  return (
    <div>
      <div className="hstack between mb-12">
        <div className="h3">פעילות אחרונה</div>
        {expenses.length > limit && (
          <span className="small" style={{ fontWeight: 700, cursor: "pointer" }} onClick={onSeeAll}>הכל</span>
        )}
      </div>
      <div className="card" style={{ padding: "4px 18px" }}>
        {recent.map(e => {
          const c = CAT[e.category] || CAT.household;
          const author = people.find(p => p.id === e.paidBy);
          return (
            <div key={e.id} className="row">
              <div className={`lead bg-${c.color}`}>
                <Icon name={c.icon} size={20} color="#0E0E0E" />
              </div>
              <div className="meta">
                <div className="t">{e.label}</div>
                <div className="s">{e.date}{author ? ` · ${author.name}` : ""}</div>
              </div>
              <div className="trail">
                <div className="amt num">{shek(e.amount, e.amount % 1 ? 2 : 0)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EmptyHomeHint = () => (
  <div className="card" style={{ padding: 20, textAlign: "center", background: "var(--cream-soft)" }}>
    <div className="hstack gap-8" style={{ justifyContent: "center", marginBottom: 8 }}>
      <span className="ai-dot" />
      <span className="ai-text" style={{ fontSize: 12 }}>איך מתחילים</span>
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>תספר ל-AI על הוצאות שלך</div>
    <div className="small muted">
      לדוגמה: "₪40 על קפה" או "שכר דירה ₪5800 ל-1 ביוני"
    </div>
  </div>
);

const AIInput = ({ onSubmit }) => {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit && onSubmit(t);
    setText("");
  };
  return (
    <div className="ai-input-wrap">
      <div className="ai-input-inner">
        <span className="ai-dot" style={{ marginInlineEnd: 4 }} />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="ספר ל-AI על מה הוצאת…"
        />
        <button className="ai-send" onClick={submit} title="שלח">
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
};

const HomeScreen = ({ nav, openBills, openGrocery, openExpense, openHistory, onAISubmit }) => {
  const { state } = useAppState();
  const { expenses, bills, grocery, budget, people } = state;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = computeBalance(expenses, people);
  const you = people.find(p => p.owner) || people[0];

  return (
    <div className="scroll">
      <div style={{ padding: "10px 22px 18px" }}>
        <div className="hstack between mb-16">
          <NestLogo size={22} />
          <div className="hstack gap-10">
            <button className="btn icon-only soft" style={{ background: "var(--cream-soft)" }} onClick={() => nav("notifications")}>
              <Icon name="bell" size={20} />
            </button>
            <div onClick={() => nav("household")} style={{ cursor: "pointer" }}>
              <Avatar name={you?.name || "?"} color={you?.color || "sky"} />
            </div>
          </div>
        </div>
        <div className="hstack between" style={{ alignItems: "flex-end" }}>
          <div>
            <div className="small muted">היי {you?.name || ""}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em" }}>
              {totalSpent > 0 ? "מבט על החודש" : "נתחיל"}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div className="tiny">הוצאות</div>
            <div className="h2 num" style={{ marginTop: 2 }}>{shek(totalSpent, 0)}</div>
          </div>
        </div>
      </div>

      <div className="vstack gap-16 px-22">
        <AIInput onSubmit={onAISubmit} />
        <OverdueBills bills={bills} people={people} onOpen={openBills} />
        <BalanceCard balance={balance} people={people} onSettle={() => nav("household")} />
        {expenses.length === 0 && bills.length === 0 && grocery.length === 0 && <EmptyHomeHint />}
        <GroceryPreview items={grocery} people={people} onOpen={openGrocery} onAdd={openGrocery} />
        {expenses.length > 0 && <SpendOverview expenses={expenses} budget={budget} />}
        <RecentTransactions expenses={expenses} people={people} limit={3} onSeeAll={openHistory} />
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen, shek, SpendOverview, BalanceCard, GroceryPreview, RecentTransactions, AIInput, OverdueBills });
