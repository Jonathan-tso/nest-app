/* global React, Icon, TopBar, Sheet, useAppState, useAuth, CAT */

const SUGGESTIONS = [
  "הוצאתי ₪40 על קפה",
  "כמה הוצאתי החודש?",
  "מה צריך לשלם השבוע?",
  "תוסיף עגבניות לקניות",
];

const ApiKeyPrompt = ({ onSave }) => {
  const [val, setVal] = React.useState("");
  return (
    <div style={{
      margin: "8px 22px 16px", padding: 16, borderRadius: 18,
      background: "var(--cream-soft)", border: "1px solid var(--line)",
    }}>
      <div className="hstack gap-8" style={{ marginBottom: 8 }}>
        <span className="ai-dot" />
        <span className="ai-text" style={{ fontSize: 12 }}>הגדרה ראשונית</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>חבר את המפתח של Anthropic</div>
      <div className="small muted" style={{ marginBottom: 12 }}>
        המפתח שלך נשמר מוצפן בחשבונך. הוא נמצא ב-console.anthropic.com.
      </div>
      <input
        type="password" className="input" placeholder="sk-ant-..."
        value={val} onChange={e => setVal(e.target.value)} autoComplete="off"
      />
      <button className="btn" style={{ marginTop: 10 }}
        onClick={() => val.trim() && onSave(val.trim())}
      >שמור והמשך</button>
    </div>
  );
};

const SettingsSheet = ({ open, onClose }) => {
  const { state, setApiKey, setModel, setBudget, clearChat, wipeHousehold } = useAppState();
  const { signOut, profile } = useAuth();
  const [key, setKey] = React.useState("");
  React.useEffect(() => { if (open) setKey(state.apiKey || ""); }, [open, state.apiKey]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">הגדרות</div>

        {profile && (
          <div className="small muted mt-4">
            מחובר כ-{profile.display_name} · {profile.id?.slice(0, 8)}
          </div>
        )}

        <div className="mt-16">
          <div className="field-label">מפתח Anthropic API</div>
          <input
            type="password" className="input"
            placeholder="sk-ant-..." value={key}
            onChange={e => setKey(e.target.value)} autoComplete="off"
          />
        </div>

        <div className="mt-16">
          <div className="field-label">מודל</div>
          <select className="input" value={state.model || "claude-haiku-4-5"}
            onChange={e => setModel(e.target.value)}>
            <option value="claude-haiku-4-5">Haiku 4.5 (מהיר)</option>
            <option value="claude-sonnet-4-5">Sonnet 4.5</option>
            <option value="claude-opus-4-5">Opus 4.5</option>
          </select>
        </div>

        <div className="mt-16">
          <div className="field-label">תקציב חודשי</div>
          <input type="number" inputMode="numeric" className="input num"
            value={state.budget || 0}
            onChange={e => setBudget(parseInt(e.target.value) || 0)} />
        </div>

        <button className="btn mt-16" onClick={() => { setApiKey(key); onClose(); }}>שמור</button>

        <div className="vstack gap-8 mt-16">
          <button className="btn ghost" onClick={() => { clearChat(); onClose(); }}>
            נקה היסטוריית צ׳אט
          </button>
          <button
            className="btn ghost"
            style={{ color: "var(--danger)", borderColor: "var(--line)" }}
            onClick={async () => {
              if (confirm("למחוק את כל הנתונים של הבית (הוצאות, חשבונות, קניות)?")) {
                await wipeHousehold(); onClose();
              }
            }}
          >מחק נתוני בית</button>
          <button
            className="btn ghost"
            style={{ borderColor: "var(--line)" }}
            onClick={async () => { await signOut(); onClose(); }}
          >התנתק</button>
        </div>
      </div>
    </Sheet>
  );
};

const extractText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  }
  return "";
};
const extractToolUses = (content) => {
  if (!Array.isArray(content)) return [];
  return content.filter(b => b.type === "tool_use");
};

const TOOL_LABELS = {
  add_expense:      "הוצאה נוספה",
  add_bill:         "חשבון נוסף",
  mark_bill_paid:   "חשבון עודכן",
  add_grocery_item: "פריט נוסף לקניות",
  get_state:        "קורא נתונים",
};

const AIChat = ({ onBack }) => {
  const { state, pending, sendChatMessage, setApiKey } = useAppState();
  const [text, setText] = React.useState("");
  const [showSettings, setShowSettings] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.chat, pending]);

  const send = (val) => {
    const t = (val ?? text).trim();
    if (!t || pending || !state.apiKey) return;
    setText("");
    sendChatMessage(t);
  };

  const visibleMessages = state.chat
    .map((m, idx) => ({ ...m, idx }))
    .filter(m => {
      if (m.role === "user" && Array.isArray(m.content) && m.content.every(b => b.type === "tool_result")) return false;
      return true;
    });

  return (
    <div className="scroll" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <TopBar
          title=""
          onBack={onBack}
          trailing={
            <button className="btn icon-only" style={{ background: "transparent", border: "none" }}
              onClick={() => setShowSettings(true)}>
              <Icon name="settings" size={20} />
            </button>
          }
        />
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
        {!state.apiKey && <ApiKeyPrompt onSave={setApiKey} />}

        {visibleMessages.map(m => {
          if (m.role === "user") {
            const t = typeof m.content === "string" ? m.content : extractText(m.content);
            return (
              <div key={m.idx} className="vstack" style={{ alignItems: "flex-end" }}>
                <div className="bubble you">{t}</div>
              </div>
            );
          }
          const txt = extractText(m.content);
          const tools = extractToolUses(m.content);
          return (
            <div key={m.idx} className="vstack" style={{ alignItems: "flex-start", gap: 6 }}>
              {txt && <div className="bubble ai">{txt}</div>}
              {tools.length > 0 && (
                <div className="hstack gap-6" style={{ flexWrap: "wrap", maxWidth: "80%" }}>
                  {tools.map(t => (
                    <span key={t.id} className="ai-chip" style={{ height: 24, padding: "0 10px" }}>
                      <Icon name="check" size={12} /> {TOOL_LABELS[t.name] || t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {pending && (
          <div className="bubble ai" style={{ display: "inline-flex", gap: 4, alignSelf: "flex-start" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s ease infinite alternate" }} />
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s 0.15s ease infinite alternate" }} />
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-2)", animation: "fadeUp 0.6s 0.3s ease infinite alternate" }} />
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: "8px 22px 22px", background: "var(--paper)" }}>
        {state.apiKey && visibleMessages.filter(m => m.role === "user").length === 0 && (
          <div className="hstack gap-6" style={{ marginBottom: 10, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="chip outline" onClick={() => send(s)} style={{ fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="ai-input-wrap">
          <div className="ai-input-inner">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={state.apiKey ? "כתוב משהו…" : "הזן מפתח כדי להתחיל"}
              disabled={pending || !state.apiKey}
            />
            <button className="ai-send" onClick={() => send()} disabled={pending || !state.apiKey}>
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>

      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

const AISheet = ({ open, onClose }) => {
  const { sendChatMessage } = useAppState();
  const [text, setText] = React.useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    sendChatMessage(t);
    onClose && onClose();
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">ספר לי על מה הוצאת</div>
        <div className="mt-16">
          <textarea value={text} onChange={e => setText(e.target.value)}
            className="input" style={{ minHeight: 100 }}
            placeholder="לדוגמה: ₪127 בשופרסל היום" />
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={submit}>
          <Icon name="send" size={16} /> שלח
        </button>
      </div>
    </Sheet>
  );
};

const AIActionPad = ({ open, onClose }) => {
  const { sendChatMessage } = useAppState();
  const quick = (text) => { sendChatMessage(text); onClose && onClose(); };
  const actions = [
    { id: "expense",  label: "הוסף הוצאה", icon: "plus",     color: "mint",     q: "אני רוצה להוסיף הוצאה" },
    { id: "bill",     label: "חשבון חדש",  icon: "receipt",  color: "sky",      q: "אני רוצה להוסיף חשבון" },
    { id: "grocery",  label: "פריט קניות", icon: "cart",     color: "butter",   q: "תוסיף פריט לקניות" },
    { id: "summary",  label: "סיכום החודש", icon: "sparkles", color: "lavender", q: "כמה הוצאתי החודש?" },
  ];
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">פעולות מהירות</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {actions.map(a => (
            <button key={a.id} onClick={() => quick(a.q)}
              style={{
                background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 18,
                padding: 16, display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}>
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

Object.assign(window, { AIChat, AISheet, AIActionPad, SettingsSheet });
