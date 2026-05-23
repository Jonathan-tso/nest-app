/* global React, Icon, Avatar, TopBar, Sheet, useAppState, GROCERY_SECTIONS */

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
      if (abs > 70) onDelete && onDelete();
      if (inner) inner.style.transform = "";
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

const GroceryItem = ({ item, people, onToggle, onDelete }) => {
  const author = people.find(p => p.id === item.addedBy);
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
            {item.qty && <div className="small muted" style={{ marginTop: 2 }}>{item.qty}</div>}
          </div>
        </div>
        <div className="hstack gap-8">
          {!item.addedBy && <span className="ai-chip">AI</span>}
          {item.addedBy && author && (
            <Avatar name={author.name} color={author.color} size="sm" />
          )}
        </div>
      </div>
    </SwipeRow>
  );
};

const CreateListSheet = ({ open, onClose, onCreate }) => {
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  React.useEffect(() => { if (open) { setName(""); setErr(""); } }, [open]);
  const submit = async () => {
    const v = name.trim();
    if (!v) return;
    setBusy(true); setErr("");
    try {
      await onCreate(v);
      onClose && onClose();
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">רשימה חדשה</div>
        <div className="small muted mt-4">לדוגמה: ערב שבת, סופר חודשי, בית מרקחת.</div>
        <div className="mt-16">
          <div className="field-label">שם הרשימה</div>
          <input
            className="input"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="שם הרשימה…"
          />
        </div>
        {err && <div className="small mt-12" style={{ color: "var(--danger)", fontWeight: 600 }}>{err}</div>}
        <button className="btn mt-16" onClick={submit} disabled={busy || !name.trim()}>
          {busy ? "רגע…" : "צור רשימה"}
        </button>
      </div>
    </Sheet>
  );
};

const ListActionsSheet = ({ open, list, onClose, onRename, onDelete }) => {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) { setRenaming(false); setName(list?.name || ""); }
  }, [open, list]);

  if (!list) return <Sheet open={false} onClose={onClose}><div /></Sheet>;

  const doRename = async () => {
    const v = name.trim();
    if (!v || v === list.name) { setRenaming(false); return; }
    setBusy(true);
    try { await onRename(list.id, v); onClose && onClose(); }
    catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!confirm(`למחוק את הרשימה "${list.name}" וכל הפריטים שלה?`)) return;
    setBusy(true);
    try { await onDelete(list.id); onClose && onClose(); }
    catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">{list.name}</div>

        {renaming ? (
          <>
            <div className="mt-16">
              <div className="field-label">שם חדש</div>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doRename()}
                autoFocus
              />
            </div>
            <button className="btn mt-16" onClick={doRename} disabled={busy || !name.trim()}>
              שמור
            </button>
            <button className="btn ghost mt-8" onClick={() => setRenaming(false)} disabled={busy}>
              בטל
            </button>
          </>
        ) : (
          <div className="vstack gap-8 mt-16">
            <button className="btn ghost" onClick={() => setRenaming(true)} disabled={busy}>
              <Icon name="settings" size={16} /> שנה שם
            </button>
            <button
              className="btn ghost"
              onClick={doDelete}
              disabled={busy}
              style={{ color: "var(--danger)", borderColor: "var(--line)" }}
            >
              <Icon name="trash" size={16} /> מחק רשימה
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
};

const GroceryScreen = ({ onBack }) => {
  const {
    state,
    addGroceryItem, toggleGroceryItem, removeGroceryItem,
    createGroceryList, renameGroceryList, deleteGroceryList, selectList,
  } = useAppState();
  const lists = state.groceryLists;
  const selectedListId = state.selectedListId;
  const allItems = state.grocery;
  const people = state.people;
  const items = React.useMemo(
    () => allItems.filter(i => i.listId === selectedListId),
    [allItems, selectedListId]
  );

  const [text, setText] = React.useState("");
  const [hideChecked, setHideChecked] = React.useState(false);
  const [creatingList, setCreatingList] = React.useState(false);
  const [actingOnList, setActingOnList] = React.useState(null);

  const add = async () => {
    const v = text.trim();
    if (!v || !selectedListId) return;
    setText("");
    try {
      await addGroceryItem({ name: v, qty: "", section: "pantry", listId: selectedListId });
    } catch (e) {
      alert(e.message || String(e));
      setText(v);
    }
  };

  const visible = items.filter(i => !hideChecked || !i.checked);
  const grouped = GROCERY_SECTIONS.map(s => ({
    ...s,
    items: visible.filter(i => i.section === s.id),
  })).filter(s => s.items.length > 0);

  const pending = items.filter(i => !i.checked).length;
  const done = items.filter(i => i.checked).length;
  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="scroll" style={{ paddingBottom: 130 }}>
      <TopBar
        title="קניות"
        onBack={onBack}
        trailing={
          <div className="hstack gap-6">
            {items.length > 0 && (
              <button
                className="btn icon-only soft"
                style={{ background: "var(--cream-soft)" }}
                onClick={() => setHideChecked(!hideChecked)}
                title="הצג/הסתר מסומנים"
              >
                <Icon name={hideChecked ? "filter" : "check"} size={18} />
              </button>
            )}
            <button
              className="btn icon-only soft"
              style={{ background: "var(--cream-soft)" }}
              onClick={() => setCreatingList(true)}
              title="רשימה חדשה"
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        }
      />

      {lists.length === 0 ? (
        <div className="px-22">
          <button
            onClick={() => setCreatingList(true)}
            className="card dashed"
            style={{
              background: "transparent", padding: 32, textAlign: "center", cursor: "pointer",
              fontFamily: "inherit", width: "100%",
            }}
          >
            <div className="small muted" style={{ marginBottom: 8 }}>אין עדיין רשימות קניות</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>+ צור רשימה ראשונה</div>
          </button>
        </div>
      ) : (
        <>
          <div className="px-22" style={{ marginBottom: 12 }}>
            <div
              className="hstack gap-6"
              style={{ overflowX: "auto", paddingBottom: 6 }}
            >
              {lists.map(l => (
                <button
                  key={l.id}
                  className={`chip ${l.id === selectedListId ? "active" : "outline"}`}
                  onClick={() => {
                    if (l.id === selectedListId) setActingOnList(l);
                    else selectList(l.id);
                  }}
                  style={{ fontFamily: "inherit", flexShrink: 0 }}
                >
                  {l.name}
                </button>
              ))}
              <button
                className="chip outline"
                onClick={() => setCreatingList(true)}
                style={{
                  fontFamily: "inherit", flexShrink: 0,
                  borderStyle: "dashed",
                }}
                title="רשימה חדשה"
              >
                + חדשה
              </button>
            </div>
          </div>

          <div className="px-22 vstack gap-12">
            {selectedList && (
              <div className="card" style={{ padding: 18, background: "var(--mint)", border: "none" }}>
                <div className="tiny" style={{ color: "var(--ink)", opacity: 0.7 }}>{selectedList.name}</div>
                <div className="h2" style={{ marginTop: 4 }}>
                  {items.length === 0 ? "רשימה ריקה" : `${pending} פריטים`}
                </div>
                {done > 0 && (
                  <div className="small" style={{ marginTop: 2, color: "var(--ink)", opacity: 0.7 }}>
                    {done} סומנו
                  </div>
                )}
              </div>
            )}

            <div className="ai-input-wrap">
              <div className="ai-input-inner">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && add()}
                  placeholder={selectedListId ? "הוסף פריט…" : "בחר רשימה כדי להוסיף"}
                  disabled={!selectedListId}
                />
                <button
                  className="ai-send"
                  onClick={add}
                  title="הוסף"
                  disabled={!selectedListId || !text.trim()}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {grouped.length === 0 ? (
              <div className="small muted" style={{ padding: "40px 22px", textAlign: "center" }}>
                {items.length === 0
                  ? "הרשימה ריקה. הוסף פריט או ספר ל-AI"
                  : hideChecked
                    ? "כל הפריטים סומנו"
                    : "אין פריטים"}
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
                      people={people}
                      onToggle={() => toggleGroceryItem(item.id)}
                      onDelete={() => removeGroceryItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CreateListSheet
        open={creatingList}
        onClose={() => setCreatingList(false)}
        onCreate={createGroceryList}
      />
      <ListActionsSheet
        open={!!actingOnList}
        list={actingOnList}
        onClose={() => setActingOnList(null)}
        onRename={renameGroceryList}
        onDelete={deleteGroceryList}
      />
    </div>
  );
};

Object.assign(window, { GroceryScreen });
