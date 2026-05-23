/* global React, Icon, Avatar, AvatarStack, NestLogo, Donut, Sparkline, BarChart, CATEGORIES, CAT, PEOPLE, EXPENSES_MAY, BILLS, AI_INSIGHTS, GROCERY_INIT, GROCERY_SECTIONS */
// Home / Summary screen — with layout variations

const { useState, useMemo } = React;

const shek = (n, decimals = 0) => "₪" + n.toLocaleString("en-IL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const AICard = ({ insight, onAct }) => {
  return (
    <div className="ai-border cream">
      <div className="ai-border-inner" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
      <div className="hstack gap-8" style={{ marginBottom: 10 }}>
        <span className="ai-dot"></span>
        <span className="tiny ai-text" style={{ fontWeight: 700 }}>Nest AI</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        {insight.headline}
      </div>
      <div className="small" style={{ marginTop: 6, lineHeight: 1.45, color: "var(--text-2)" }}>
        {insight.body}
      </div>
      {insight.cta && (
        <button className="btn sm" style={{ width: "auto", marginTop: 14 }} onClick={onAct}>{insight.cta}</button>
      )}
      </div>
    </div>
  );
};

const OverdueBills = ({ bills, onOpen }) => {
  const overdue = bills.filter(b => b.status === "overdue");
  if (!overdue.length) return null;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "transparent", background: "var(--ink)", color: "#fff" }}>
      <div style={{ padding: "16px 18px 12px" }}>
        <div className="hstack between">
          <div className="hstack gap-8">
            <div className="bg-coral" style={{ width: 24, height: 24, borderRadius: 8, display: "grid", placeItems: "center" }}>
              <Icon name="bell" size={14} color="#0E0E0E"/>
            </div>
            <span className="tiny" style={{ color: "rgba(255,255,255,.7)" }}>בפיגור</span>
          </div>
          <span className="small" style={{ color: "rgba(255,255,255,.6)" }}>{overdue.length} {overdue.length > 1 ? "חשבונות" : "חשבון"}</span>
        </div>
        {overdue.slice(0, 2).map(b => {
          const c = CAT[b.category];
          const assignee = PEOPLE.find(p => p.id === b.assignee);
          return (
            <div key={b.id} className="hstack between" style={{ marginTop: 14 }}>
              <div className="hstack gap-12">
                <div className={`bg-${c.color}`} style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center" }}>
                  <Icon name={c.icon} size={18} color="#0E0E0E"/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{b.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>
                    {b.daysOverdue} ימים באיחור · {assignee?.name}
                  </div>
                </div>
              </div>
              <div className="num" style={{ fontSize: 15, fontWeight: 800 }}>{shek(b.amount, 2)}</div>
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

const SpendOverview = ({ expenses, budget = 8200 }) => {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const data = Object.entries(byCat)
    .map(([id, v]) => ({ value: v, color: CAT[id].hex, label: CAT[id].label, id }))
    .sort((a,b) => b.value - a.value);

  const pct = Math.round((total / budget) * 100);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="hstack between mb-12">
        <div>
          <div className="tiny">החודש</div>
          <div className="h1 num" style={{ marginTop: 4 }}>{shek(total, 0)}</div>
          <div className="small muted">מתוך {shek(budget, 0)} תקציב · {pct}%</div>
        </div>
        <Donut data={data.slice(0, 5)} size={104} stroke={14}/>
      </div>
      <div className="vstack gap-8" style={{ marginTop: 6 }}>
        {data.slice(0, 4).map(d => {
          const p = Math.round((d.value / total) * 100);
          return (
            <div key={d.id} className="hstack between">
              <div className="hstack gap-8">
                <span className="swatch" style={{ background: d.color }}/>
                <span className="small" style={{ fontWeight: 600, color: "var(--text)" }}>{d.label}</span>
              </div>
              <div className="hstack gap-8">
                <span className="small muted">{p}%</span>
                <span className="small num" style={{ fontWeight: 700, color: "var(--text)" }}>{shek(d.value, 0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BalanceCard = ({ onSettle }) => {
  return (
    <div className="card" style={{ padding: 18, background: "var(--cream-soft)", border: "1px solid var(--line)" }}>
      <div className="hstack between">
        <div className="vstack gap-4">
          <div className="tiny">מאזן</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
            את חייבת ל<span style={{ fontWeight: 800 }}>נועה</span>
          </div>
          <div className="h2 num" style={{ marginTop: 2 }}>{shek(612, 0)}</div>
        </div>
        <div className="vstack" style={{ alignItems: "center", gap: 6 }}>
          <AvatarStack people={[{ name: "Maya", color: "pink" }, { name: "Noa", color: "mint" }]} size=""/>
          <button className="btn sm" style={{ width: "auto" }} onClick={onSettle}>סגירת חשבון</button>
        </div>
      </div>
    </div>
  );
};

const GroceryPreview = ({ items, onOpen }) => {
  const pending = items.filter(i => !i.checked);
  const top = pending.slice(0, 4);
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="hstack between mb-12">
        <div className="hstack gap-8">
          <div className="bg-mint" style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center" }}>
            <Icon name="cart" size={16} color="#0E0E0E"/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>קניות</div>
            <div className="small muted">{pending.length} פריטים ממתינים · התחילה נועה</div>
          </div>
        </div>
        <button className="chip" onClick={onOpen} style={{ background: "transparent" }}>
          פתח
          <Icon name="chevron" size={14}/>
        </button>
      </div>
      <div className="vstack gap-6">
        {top.map(item => {
          const author = PEOPLE.find(p => p.id === item.addedBy);
          return (
            <div key={item.id} className="hstack between" style={{ padding: "6px 0" }}>
              <div className="hstack gap-10">
                <div className="check" style={{ width: 18, height: 18, borderRadius: 6 }}/>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                <span className="small muted">· {item.qty}</span>
              </div>
              <span className="tiny">{item.addedBy === "ai" ? "AI" : author?.short || author?.name}</span>
            </div>
          );
        })}
        {pending.length > 4 && (
          <div className="small muted" style={{ marginTop: 4 }}>+ עוד {pending.length - 4} פריטים</div>
        )}
      </div>
    </div>
  );
};

const RecentTransactions = ({ expenses, onSeeAll }) => {
  const recent = expenses.slice(0, 5);
  return (
    <div>
      <div className="hstack between mb-12">
        <div className="h3">פעילות אחרונה</div>
        <span className="small" style={{ fontWeight: 700, cursor: "pointer" }} onClick={onSeeAll}>הכל</span>
      </div>
      <div className="card" style={{ padding: "4px 18px" }}>
        {recent.map(e => {
          const c = CAT[e.category];
          const author = PEOPLE.find(p => p.id === e.paidBy);
          return (
            <div key={e.id} className="row">
              <div className={`lead bg-${c.color}`}>
                <Icon name={c.icon} size={20} color="#0E0E0E"/>
              </div>
              <div className="meta">
                <div className="t">{e.label}</div>
                <div className="s">{e.date} · שילמה {author?.name}</div>
              </div>
              <div className="trail">
                <div className="amt num">{shek(e.amount, 0)}</div>
                <div className="tiny" style={{ marginTop: 2 }}>{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuickCategories = ({ onPick }) => {
  const items = [
    { id: "groceries",   label: "קניות",       icon: "cart",   color: "mint" },
    { id: "rent",        label: "שכירות",      icon: "house",  color: "cream" },
    { id: "electricity", label: "חשמל",        icon: "bolt",   color: "butter" },
    { id: "water",       label: "מים",         icon: "drop",   color: "sky" },
    { id: "internet",    label: "אינטרנט",     icon: "wifi",   color: "lavender" },
    { id: "transport",   label: "תחבורה",      icon: "car",    color: "pink" },
    { id: "dining",      label: "מסעדות",      icon: "coffee", color: "coral" },
    { id: "more",        label: "עוד",         icon: "more",   color: "cream" },
  ];
  return (
    <div className="card" style={{ padding: "20px 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {items.map(c => (
          <button key={c.id} onClick={() => onPick(c.id)}
            style={{
              background: "transparent", border: "none", padding: 0, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              fontFamily: "inherit",
            }}>
            <div className={`bg-${c.color}`} style={{
              width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center",
            }}>
              <Icon name={c.icon} size={22} color="#0E0E0E"/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const AIInput = ({ onSubmit, onAttach, onVoice }) => {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onSubmit && onSubmit(text);
    setText("");
  };
  return (
    <div className="ai-input-wrap">
      <div className="ai-input-inner">
        <span className="ai-dot" style={{ marginInlineEnd: 4 }}/>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="ספרי לי על מה הוצאת…"
        />
        <button className="ai-input-icon" onClick={onAttach} title="צילום קבלה">
          <Icon name="camera" size={20}/>
        </button>
        <button className="ai-input-icon" onClick={onVoice} title="הודעה קולית">
          <Icon name="mic" size={20}/>
        </button>
        <button className="ai-send" onClick={submit} title="שלחי">
          <Icon name="send" size={16}/>
        </button>
      </div>
    </div>
  );
};

const ActionRow = ({ onAdd, onAI, onPay }) => (
  <div style={{
    background: "var(--ink)", borderRadius: 18, padding: "16px 8px",
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6,
  }}>
    {[
      { id: "add", label: "הוצאה", icon: "plus",     onClick: onAdd },
      { id: "ai",  label: "AI",     icon: "sparkles", onClick: onAI },
      { id: "pay", label: "חשבון",  icon: "receipt",  onClick: onPay },
    ].map(a => (
      <button key={a.id} onClick={a.onClick} style={{
        background: "transparent", border: "none", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "8px 4px", cursor: "pointer", fontFamily: "inherit",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 50, border: "1.5px solid rgba(255,255,255,.6)",
          display: "grid", placeItems: "center",
        }}>
          <Icon name={a.icon} size={18}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</span>
      </button>
    ))}
  </div>
);

const HomeScreen = ({ layout = "calm", nav, openAI, openBills, openGrocery, openExpense, openHistory }) => {
  const expenses = EXPENSES_MAY;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const header = (
    <div style={{ padding: "10px 22px 18px" }}>
      <div className="hstack between mb-16">
        <NestLogo size={22}/>
        <div className="hstack gap-10">
          <button className="btn icon-only soft" style={{ background: "var(--cream-soft)" }} onClick={() => nav("notifications")}>
            <Icon name="bell" size={20}/>
          </button>
          <Avatar name="Maya" color="pink"/>
        </div>
      </div>
      <div className="hstack between" style={{ alignItems: "flex-end" }}>
        <div>
          <div className="small muted">היי מאיה</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em" }}>
            מבט על מאי
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div className="tiny">הוצאות</div>
          <div className="h2 num" style={{ marginTop: 2 }}>{shek(totalSpent, 0)}</div>
        </div>
      </div>
    </div>
  );

  if (layout === "calm") {
    return (
      <div className="scroll">
        {header}
        <div className="vstack gap-16 px-22">
          <AIInput onSubmit={openAI} onAttach={openAI} onVoice={openAI}/>
          <AICard insight={AI_INSIGHTS[0]}/>
          <OverdueBills bills={BILLS} onOpen={openBills}/>
          <BalanceCard onSettle={() => nav("household")}/>
          <GroceryPreview items={GROCERY_INIT} onOpen={openGrocery}/>
          <SpendOverview expenses={expenses}/>
          <RecentTransactions expenses={expenses} onSeeAll={openHistory}/>
        </div>
      </div>
    );
  }

  if (layout === "dense") {
    return (
      <div className="scroll">
        {header}
        <div className="vstack gap-14 px-22">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card" style={{ padding: 14, background: "var(--cream)" }}>
              <div className="tiny">הוצאות</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{shek(totalSpent, 0)}</div>
              <div className="small muted" style={{ marginTop: 2 }}>מתוך ₪8,200</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="tiny">חייבת לנועה</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{shek(612, 0)}</div>
              <div className="small" style={{ marginTop: 2, color: "var(--text-2)", fontWeight: 700, cursor: "pointer" }}
                onClick={() => nav("household")}>סגירת חשבון ←</div>
            </div>
          </div>
          <OverdueBills bills={BILLS} onOpen={openBills}/>
          <AICard insight={AI_INSIGHTS[0]}/>
          <QuickCategories onPick={openExpense}/>
          <GroceryPreview items={GROCERY_INIT} onOpen={openGrocery}/>
          <RecentTransactions expenses={expenses} onSeeAll={openHistory}/>
        </div>
      </div>
    );
  }

  if (layout === "hero") {
    return (
      <div className="scroll">
        <div className="hero-band" style={{ paddingBottom: 24 }}>
          <div className="hstack between mb-20">
            <NestLogo size={22}/>
            <div className="hstack gap-10">
              <button className="btn icon-only" style={{ background: "transparent", borderColor: "transparent" }} onClick={() => nav("notifications")}>
                <Icon name="bell" size={20}/>
              </button>
              <Avatar name="Maya" color="paper"/>
            </div>
          </div>
          <div className="small muted">היי מאיה, הנה התקציר היומי</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginTop: 8 }}>
            את <span style={{ color: "var(--good)" }}>18% מתחת</span> לתקציב הקניות — אבל יש חוב על נטפליקס.
          </div>
          <div className="hstack gap-8" style={{ marginTop: 20 }}>
            <button className="btn sm" style={{ width: "auto" }} onClick={openBills}>שלמי לנטפליקס</button>
            <button className="btn sm ghost" style={{ width: "auto" }} onClick={openAI}>
              <Icon name="sparkles" size={16}/> שאלי את ה-AI
            </button>
          </div>
        </div>
        <div className="vstack gap-16 px-22" style={{ paddingTop: 18 }}>
          <SpendOverview expenses={expenses}/>
          <BalanceCard onSettle={() => nav("household")}/>
          <GroceryPreview items={GROCERY_INIT} onOpen={openGrocery}/>
          <RecentTransactions expenses={expenses} onSeeAll={openHistory}/>
        </div>
      </div>
    );
  }
};

Object.assign(window, { HomeScreen, shek, AICard, SpendOverview, BalanceCard, GroceryPreview, RecentTransactions, ActionRow, AIInput, OverdueBills });
