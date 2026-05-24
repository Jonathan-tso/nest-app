/* global React, Icon, Avatar, AvatarStack, NestLogo, Donut, useAppState, CAT */
// Home / Summary screen

const { useState } = React;

const shek = (n, decimals = 0) => "₪" + (Number(n) || 0).toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const computeBalance = (expenses, people) => {
  const you = people.find(p => p.isYou) || people[0];
  if (!you || people.length < 2) return 0;
  let youPaid = 0;
  expenses.forEach(e => { if (e.paidBy === you.id) youPaid += e.amount; });
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
    <div className="card" onClick={onOpen} style={{ padding: 0, overflow: "hidden", borderColor: "transparent", background: "var(--ink)", color: "#fff", cursor: "pointer" }}>
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

const SpendOverview = ({ expenses, budget, onOpen }) => {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const data = Object.entries(byCat)
    .map(([id, v]) => ({ value: v, color: CAT[id]?.hex || "#999", label: CAT[id]?.label || id, id }))
    .sort((a, b) => b.value - a.value);

  const top5 = data.slice(0, 5);
  const donutData = top5.length > 0 ? top5 : [{ value: 1, color: "#E8E5DC", label: "", id: "empty" }];
  const budgetPct = budget && total > 0 ? Math.round((total / budget) * 100) : null;

  return (
    <div className="card" onClick={onOpen} style={{ padding: 20, cursor: "pointer" }}>
      {/* Top row: text on right (RTL start), donut on left (RTL end) */}
      <div className="hstack between" style={{ alignItems: "center" }}>
        <div>
          <div className="tiny">החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          {budgetPct !== null && (
            <div className="small muted" style={{ marginTop: 4 }}>
              מתוך {shek(budget, 0)} · {budgetPct}% · תקציב
            </div>
          )}
        </div>
        <Donut data={donutData} size={124} stroke={16} />
      </div>

      {/* Category legend */}
      {top5.length > 0 && (
        <div className="vstack gap-10" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          {top5.map(d => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.id} className="hstack between" style={{ alignItems: "center" }}>
                <div className="hstack gap-8" style={{ alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                </div>
                <div className="hstack gap-10">
                  <span className="small muted">{pct}%</span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 700 }}>{shek(d.value, 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const BalanceCard = ({ balance, people, onSettle }) => {
  const others = people.filter(p => !p.isYou);
  const counterpart = others[0];
  if (!counterpart || people.length < 2) return null;

  const settled = Math.abs(balance) < 0.5;
  const youOwe = balance < 0;
  const feminine = counterpart.name?.endsWith("ה");

  return (
    <div className="card" style={{ padding: 18, background: "var(--cream-soft)", border: "none" }}>
      <div className="hstack between" style={{ alignItems: "center" }}>
        <div className="vstack gap-4">
          <div className="tiny">סילוק תשלומים</div>
          {settled ? (
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--good)", marginTop: 2 }}>
              מסולק ✓
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {youOwe
                  ? <>אתה חייב ל<span style={{ fontWeight: 800 }}>{counterpart.name}</span></>
                  : <><span style={{ fontWeight: 800 }}>{counterpart.name}</span> {feminine ? "חייבת" : "חייב"} לך</>}
              </div>
              <div className="h2 num" style={{ marginTop: 4 }}>{shek(Math.abs(balance), 0)}</div>
            </>
          )}
        </div>
        <div className="vstack" style={{ alignItems: "center", gap: 8 }}>
          <AvatarStack people={people} size="" />
          {!settled && (
            <button className="btn sm" style={{ width: "auto" }} onClick={onSettle}>סלק חוב</button>
          )}
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
    <div className="card" onClick={onOpen} style={{ padding: 18, cursor: "pointer" }}>
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
        <Icon name="chevron" size={16} color="var(--text-2)" />
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
              <span className="tiny">{!item.addedBy ? "AI" : author?.short || author?.name || ""}</span>
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

const formatActivityDate = (iso) => {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  }
  return iso;
};

const RecentTransactions = ({ expenses, bills, people, limit = 5, onSeeAll }) => {
  const activities = [
    ...expenses.map(e => ({
      key: `exp-${e.id}`,
      label: e.label,
      amount: e.amount,
      category: e.category,
      personId: e.paidBy,
      sortKey: e.createdAt || e.date || "",
      dateLabel: e.createdAt ? formatActivityDate(e.createdAt.slice(0, 10)) : (e.date || ""),
    })),
    ...(bills || []).filter(b => b.paid).map(b => ({
      key: `bill-${b.id}`,
      label: b.label,
      amount: b.amount,
      category: b.category,
      personId: b.assignee,
      sortKey: b.dueDate || "",
      dateLabel: formatActivityDate(b.dueDate),
    })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const recent = activities.slice(0, limit);

  return (
    <div>
      <div className="hstack between mb-12">
        <div className="h3">פעילות אחרונה</div>
        {activities.length > limit && (
          <span className="small" style={{ fontWeight: 700, cursor: "pointer" }} onClick={onSeeAll}>הכל</span>
        )}
      </div>
      {activities.length === 0 ? (
        <div className="card" style={{ padding: 18, textAlign: "center" }}>
          <div className="small muted">עדיין אין פעילות. ספר ל-AI או הוסף ידנית.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: "0 18px" }}>
          {recent.map(item => {
            const c = CAT[item.category] || CAT.household;
            const person = people.find(p => p.id === item.personId);
            const subtitle = [item.dateLabel, person?.name].filter(Boolean).join(" · ");
            return (
              <div key={item.key} className="row" onClick={onSeeAll} style={{ cursor: "pointer" }}>
                <div className={`lead bg-${c.color}`} style={{ width: 52, height: 52, borderRadius: 16 }}>
                  <Icon name={c.icon} size={22} color="#0E0E0E" />
                </div>
                <div className="meta">
                  <div className="t">{item.label}</div>
                  {subtitle && <div className="s">{subtitle}</div>}
                </div>
                <div className="trail">
                  <div className="amt num">{shek(item.amount, item.amount % 1 ? 2 : 0)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginTop: 2 }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AIInsightCard = ({ insights }) => {
  const now = new Date();
  const active = (insights || []).filter(i => !i.expiresAt || new Date(i.expiresAt) > now);
  if (active.length === 0) return null;
  const insight = active[0];
  return (
    <div className="card" style={{ padding: 18, background: "var(--cream-soft)", border: "none" }}>
      <div className="hstack gap-6" style={{ marginBottom: 10, alignItems: "center" }}>
        <span className="ai-text" style={{ fontSize: 11, letterSpacing: "0.06em" }}>NEST AI</span>
        <span className="ai-dot" style={{ width: 8, height: 8 }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>{insight.title}</div>
      {insight.body && <div className="small muted" style={{ lineHeight: 1.6 }}>{insight.body}</div>}
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

const billMonthKey = (s) => {
  const m = s && /^(\d{4})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}` : null;
};

const HomeScreen = ({ nav, openBills, openGrocery, openExpense, openHistory, onAISubmit }) => {
  const { state } = useAppState();
  const { expenses, bills, grocery, budget, people, insights } = state;

  const now = new Date();
  const nowMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthExpenses = expenses.filter(e => {
    if (!e.createdAt) return true;
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisMonthPaidBills = bills.filter(b => b.paid && billMonthKey(b.dueDate) === nowMonthKey);
  const combinedSpending = [...thisMonthExpenses, ...thisMonthPaidBills];

  const totalSpent = combinedSpending.reduce((s, e) => s + e.amount, 0);
  const balance = computeBalance(expenses, people);
  const you = people.find(p => p.isYou) || people[0];

  return (
    <div className="scroll">
      <div style={{ padding: "10px 22px 18px", position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(to bottom, var(--paper) 55%, transparent)" }}>
        <div className="hstack between mb-16">
          <div className="hstack gap-10">
            <button className="btn icon-only soft" style={{ background: "var(--cream-soft)" }} onClick={() => nav("notifications")}>
              <Icon name="bell" size={20} />
            </button>
            <div onClick={() => nav("household")} style={{ cursor: "pointer" }}>
              <Avatar name={you?.name || "?"} color={you?.color || "sky"} />
            </div>
          </div>
          <NestLogo size={22} />
        </div>
        <div className="hstack between" style={{ alignItems: "flex-end" }}>
          <div>
            <div className="small muted">היי {you?.name || ""}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em" }}>
              {"מבט מהיר על " + new Date().toLocaleDateString("he-IL", { month: "long" })}
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
        <AIInsightCard insights={insights} />
        <OverdueBills bills={bills} people={people} onOpen={openBills} />
        <BalanceCard balance={balance} people={people} onSettle={() => nav("household")} />
        <SpendOverview expenses={combinedSpending} budget={budget} onOpen={openHistory} />
        <GroceryPreview items={grocery} people={people} onOpen={openGrocery} onAdd={openGrocery} />
        <RecentTransactions expenses={expenses} bills={bills} people={people} limit={5} onSeeAll={openBills} />
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen, shek, SpendOverview, BalanceCard, GroceryPreview, RecentTransactions, AIInput, OverdueBills });
