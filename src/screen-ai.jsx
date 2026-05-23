/* global React, Icon, TopBar, Sheet, CHAT_SEED, CAT, shek */
// AI: full-screen chat, bottom sheet, and FAB action pad

const SUGGESTIONS = [
  "הוסף הוצאה",
  "כמה הוצאנו על אוכל החודש?",
  "מה צריך לשלם השבוע?",
  "כמה אני חייב לנועה?",
];

const AIChat = ({ onBack }) => {
  const [msgs, setMsgs] = React.useState(CHAT_SEED);
  const [text, setText] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, thinking]);

  const send = (val) => {
    const t = (val || text).trim();
    if (!t) return;
    setMsgs(prev => [...prev, { id: `m-${Date.now()}`, from: "you", text: t }]);
    setText("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const reply = mockReply(t);
      setMsgs(prev => [...prev, reply]);
    }, 900);
  };

  const mockReply = (q) => {
    const id = `m-${Date.now()}`;
    if (/חייב|מאזן|חוב/.test(q)) {
      return { id, from: "ai", text: "אתה חייב לנועה ₪612. רוצה לסגור חשבון?" };
    }
    if (/אוכל|מסעדה|קניות/.test(q)) {
      return {
        id, from: "ai",
        text: "הוצאת ₪491 על קניות ו-₪164 על מסעדות החודש.",
        card: { label: "קניות + מסעדות", amount: 655, category: "groceries" },
      };
    }
    if (/לשלם|חשבון|מועד/.test(q)) {
      return { id, from: "ai", text: "השבוע: נטפליקס בפיגור (₪54.90) וחשמל ב-28 במאי (₪380)." };
    }
    const amtMatch = q.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(",", ".")) : null;
    if (amount) {
      const category = /קפה|מסעד|אוכל/.test(q) ? "dining" : /קני|סופר|שופרסל/.test(q) ? "groceries" : "household";
      return {
        id, from: "ai",
        text: `נוספה הוצאה של ${shek(amount, 2)} ב-"${CAT[category].label}". לחלק עם נועה?`,
        card: { label: q.replace(/\d+(?:[.,]\d+)?/, "").trim() || CAT[category].label, amount, category },
      };
    }
    return { id, from: "ai", text: "לא הבנתי. אפשר לכתוב סכום, להעלות קבלה, או לשאול על הוצאות." };
  };

  return (
    <div className="scroll" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <TopBar title="" onBack={onBack} trailing={<Icon name="more" size={20} />} />
        <div className="px-22" style={{ paddingBottom: 12 }}>
          <div className="hstack gap-8" style={{ marginBottom: 4 }}>
            <span className="ai-dot" />
            <span className="ai-text" style={{ fontSize: 13 }}>Nest AI</span>
          </div>
          <div className="h2">איך אפשר לעזור?</div>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto",
          padding: "8px 22px 16px",
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        {msgs.map(m => (
          <div key={m.id} className="vstack" style={{ alignItems: m.from === "you" ? "flex-end" : "flex-start" }}>
            <div className={`bubble ${m.from === "you" ? "you" : "ai"}`}>
              {m.text}
              {m.card && (
                <div className="meta-card hstack between">
                  <div className="hstack gap-10">
                    <div className={`bg-${CAT[m.card.category].color}`} style={{
                      width: 36, height: 36, borderRadius: 11, display: "grid", placeItems: "center",
                    }}>
                      <Icon name={CAT[m.card.category].icon} size={18} color="#0E0E0E" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{m.card.label}</div>
                      <div className="small muted">{CAT[m.card.category].label}</div>
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 15, fontWeight: 800 }}>{shek(m.card.amount, 2)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="bubble ai" style={{ display: "inline-flex", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s ease infinite alternate" }} />
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s 0.15s ease infinite alternate" }} />
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s 0.3s ease infinite alternate" }} />
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: "8px 22px 22px", background: "var(--paper)" }}>
        {msgs.length <= 2 && (
          <div className="hstack gap-6" style={{ marginBottom: 10, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="chip outline"
                onClick={() => send(s)}
                style={{ fontFamily: "inherit" }}
              >{s}</button>
            ))}
          </div>
        )}
        <div className="ai-input-wrap">
          <div className="ai-input-inner">
            <button className="ai-input-icon" title="צילום קבלה"><Icon name="camera" size={20} /></button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="כתוב משהו…"
            />
            <button className="ai-input-icon" title="הודעה קולית"><Icon name="mic" size={20} /></button>
            <button className="ai-send" onClick={() => send()}><Icon name="send" size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AISheet = ({ open, onClose }) => {
  const [text, setText] = React.useState("");
  const submit = () => {
    if (!text.trim()) return;
    setText("");
    onClose && onClose();
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="hstack gap-8" style={{ marginTop: 4 }}>
          <span className="ai-dot" />
          <span className="ai-text" style={{ fontSize: 13 }}>Nest AI</span>
        </div>
        <div className="h2 mt-8">ספר לי על מה הוצאת</div>
        <div className="mt-16">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="input"
            style={{ minHeight: 100 }}
            placeholder="לדוגמה: ₪127 בשופרסל היום"
          />
        </div>
        <div className="hstack gap-8" style={{ marginTop: 12 }}>
          <button className="btn icon-only ghost" style={{ width: 48, height: 48 }}><Icon name="camera" size={20} /></button>
          <button className="btn icon-only ghost" style={{ width: 48, height: 48 }}><Icon name="mic" size={20} /></button>
          <button className="btn" style={{ flex: 1 }} onClick={submit}>
            <Icon name="send" size={16} /> שלח
          </button>
        </div>
      </div>
    </Sheet>
  );
};

const AIActionPad = ({ open, onClose }) => {
  const actions = [
    { id: "scan",  label: "צילום קבלה", icon: "camera",   color: "mint" },
    { id: "voice", label: "הקלטה",       icon: "mic",      color: "lavender" },
    { id: "type",  label: "הקלדה",       icon: "pencil",   color: "butter" },
    { id: "bill",  label: "חשבון חדש",   icon: "receipt",  color: "sky" },
  ];
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="hstack gap-8" style={{ marginTop: 4 }}>
          <span className="ai-dot" />
          <span className="ai-text" style={{ fontSize: 13 }}>Nest AI</span>
        </div>
        <div className="h2 mt-8">מה להוסיף?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {actions.map(a => (
            <button
              key={a.id}
              onClick={onClose}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: 16,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <div className={`bg-${a.color}`} style={{
                width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center",
              }}>
                <Icon name={a.icon} size={20} color="#0E0E0E" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
};

Object.assign(window, { AIChat, AISheet, AIActionPad });
