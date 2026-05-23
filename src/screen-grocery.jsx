/* global React, Icon, Avatar, TopBar, GROCERY_INIT, GROCERY_SECTIONS, PEOPLE */
// Grocery list — swipe to delete, tap to check, sections + add input

const SECTIONS = GROCERY_SECTIONS;

const SwipeRow = ({ children, onDelete }) => {
  const ref = React.useRef(null);
  const state = React.useRef({ x0: 0, dx: 0, dragging: false });

  const onPointerDown = (e) => {
    if (e.target.closest("button, input, .check")) return;
    state.current.dragging = true;
    state.current.x0 = e.clientX;
    state.current.dx = 0;
    ref.current && ref.current.classList.add("dragging");
  };
  const onPointerMove = (e) => {
    if (!state.current.dragging) return;
    // RTL: swipe right (positive dx) reveals action on the right (which is "start" in RTL)
    const raw = e.clientX - state.current.x0;
    const isRTL = document.documentElement.dir === "rtl";
    const dx = isRTL ? Math.max(0, raw) : Math.min(0, raw);
    state.current.dx = dx;
    if (ref.current) {
      const inner = ref.current.querySelector(".swipe-content");
      if (inner) inner.style.transform = `translateX(${dx}px)`;
    }
  };
  const onPointerUp = () => {
    if (!state.current.dragging) return;
    state.current.dragging = false;
    if (ref.current) {
      ref.current.classList.remove("dragging");
      const inner = ref.current.querySelector(".swipe-content");
      const abs = Math.abs(state.current.dx);
      if (abs > 70) {
        onDelete && onDelete();
        if (inner) inner.style.transform = "";
      } else {
        if (inner) inner.style.transform = "";
      }
    }
  };

  return (
    <div
      ref={ref}
      className="swipe-row"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "pan-y" }}
    >
      <div className="swipe-action">
        <Icon name="trash" size={20} color="#fff" />
      </div>
      <div className="swipe-content">{children}</div>
    </div>
  );
};

const GroceryItem = ({ item, onToggle, onDelete }) => {
  const author = PEOPLE.find(p => p.id === item.addedBy);
  return (
    <SwipeRow onDelete={onDelete}>
      <div
        className="hstack between"
        style={{
          padding: "12px 18px",
          background: "var(--paper)",
          borderBottom: "1px solid var(--line)",
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <div className="hstack gap-12" style={{ flex: 1, minWidth: 0 }}>
          <div className={`check ${item.checked ? "on" : ""}`} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 600,
              textDecoration: item.checked ? "line-through" : "none",
              opacity: item.checked ? 0.45 : 1,
            }}>{item.name}</div>
            <div className="small muted" style={{ marginTop: 2 }}>{item.qty}</div>
          </div>
        </div>
        <div className="hstack gap-8">
          {item.suggested && <span className="ai-chip">AI</span>}
          {item.addedBy !== "ai" && author && (
            <Avatar name={author.name} color={author.color} size="sm" />
          )}
        </div>
      </div>
    </SwipeRow>
  );
};

const GroceryScreen = ({ onBack, onCheckout }) => {
  const [items, setItems] = React.useState(GROCERY_INIT);
  const [text, setText] = React.useState("");
  const [hideChecked, setHideChecked] = React.useState(false);

  const toggle = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const add = () => {
    const v = text.trim();
    if (!v) return;
    setItems(prev => [
      { id: `new-${Date.now()}`, section: "pantry", name: v, qty: "1", addedBy: "you", checked: false },
      ...prev,
    ]);
    setText("");
  };

  const visible = items.filter(i => !hideChecked || !i.checked);
  const grouped = SECTIONS.map(s => ({
    ...s,
    items: visible.filter(i => i.section === s.id),
  })).filter(s => s.items.length > 0);

  const pending = items.filter(i => !i.checked).length;
  const done = items.filter(i => i.checked).length;

  return (
    <div className="scroll" style={{ paddingBottom: 130 }}>
      <TopBar
        title="קניות"
        onBack={onBack}
        trailing={
          <button
            className="btn icon-only soft"
            style={{ background: "var(--cream-soft)" }}
            onClick={() => setHideChecked(!hideChecked)}
            title="הצג/הסתר מסומנים"
          >
            <Icon name={hideChecked ? "filter" : "check"} size={18} />
          </button>
        }
      />
      <div className="px-22 vstack gap-12">
        <div className="card" style={{ padding: 18, background: "var(--mint)", border: "none" }}>
          <div className="hstack between">
            <div>
              <div className="tiny" style={{ color: "var(--ink)", opacity: 0.7 }}>רשימת קניות פעילה</div>
              <div className="h2" style={{ marginTop: 4 }}>{pending} פריטים</div>
              <div className="small" style={{ marginTop: 2, color: "var(--ink)", opacity: 0.7 }}>
                {done} סומנו · נועה ומאיה
              </div>
            </div>
            <button className="btn sm" style={{ width: "auto" }} onClick={onCheckout}>
              <Icon name="cart" size={16} /> סיום קנייה
            </button>
          </div>
        </div>

        <div className="ai-input-wrap">
          <div className="ai-input-inner">
            <span className="ai-dot" style={{ marginInlineEnd: 4 }} />
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              placeholder="הוסיפי פריט או ספרי ל-AI…"
            />
            <button className="ai-send" onClick={add} title="הוסיפי">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {grouped.length === 0 ? (
          <div className="small muted" style={{ padding: "40px 22px", textAlign: "center" }}>
            {hideChecked ? "כל הפריטים סומנו 🎉" : "אין פריטים. הוסיפי משהו"}
          </div>
        ) : grouped.map(section => (
          <div key={section.id} style={{ marginBottom: 16 }}>
            <div className="hstack gap-8" style={{ padding: "10px 22px 6px" }}>
              <div className={`bg-${section.color}`} style={{
                width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
              }}>
                <Icon name={section.icon} size={12} color="#0E0E0E" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{section.label}</div>
              <span className="tiny" style={{ marginInlineStart: "auto" }}>{section.items.length}</span>
            </div>
            <div style={{ background: "var(--paper)" }}>
              {section.items.map(item => (
                <GroceryItem
                  key={item.id}
                  item={item}
                  onToggle={() => toggle(item.id)}
                  onDelete={() => remove(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { GroceryScreen });
