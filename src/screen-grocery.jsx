/* global React, Icon, Avatar, TopBar, Sheet, InlineNameInput, useAppState, GROCERY_SECTIONS */

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

const GroceryItem = ({ item, people, onToggle, onDelete, onEdit }) => {
  const author = people.find(p => p.id === item.addedBy);
  return (
    <SwipeRow onDelete={onDelete}>
      <div className="hstack between" style={{
        padding: "12px 18px",
        background: "var(--paper)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="hstack gap-12" style={{ flex: 1, minWidth: 0 }}>
          <div
            className={`check ${item.checked ? "on" : ""}`}
            onClick={onToggle}
            style={{ cursor: "pointer" }}
          />
          <div onClick={onEdit} style={{ minWidth: 0, flex: 1, cursor: "pointer" }}>
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

const GroceryItemSheet = ({ open, item, onClose, onUpdate, onDelete }) => {
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [section, setSection] = React.useState("pantry");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open && item) {
      setName(item.name || "");
      setQty(item.qty || "");
      setSection(item.section || "pantry");
    }
  }, [open, item]);

  if (!item) return <Sheet open={false} onClose={onClose}><div /></Sheet>;

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onUpdate(item.id, { name: name.trim(), qty: qty.trim(), section });
      onClose && onClose();
    } catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const del = async () => {
    if (!confirm(`למחוק את "${item.name}"?`)) return;
    setBusy(true);
    try {
      await onDelete(item.id);
      onClose && onClose();
    } catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        <div className="h2 mt-8">עריכת פריט</div>

        <div className="mt-16">
          <div className="field-label">שם</div>
          <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="mt-16">
          <div className="field-label">כמות</div>
          <input
            className="input"
            value={qty}
            onChange={e => setQty(e.target.value)}
            placeholder="לדוגמה: 2 ק״ג"
          />
        </div>

        <div className="mt-16">
          <div className="field-label">סוג</div>
          <div className="hstack gap-6" style={{ flexWrap: "wrap" }}>
            {GROCERY_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`chip ${section === s.id ? "active" : "outline"}`}
                style={{ fontFamily: "inherit", gap: 6 }}
              >
                <div className={`bg-${s.color}`} style={{
                  width: 16, height: 16, borderRadius: 5, display: "grid", placeItems: "center",
                }}>
                  <Icon name={s.icon} size={10} color="#0E0E0E" />
                </div>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="vstack gap-8 mt-20">
          <button className="btn" onClick={save} disabled={busy || !name.trim()}>שמור</button>
          <button
            className="btn ghost"
            onClick={del}
            disabled={busy}
            style={{ color: "var(--danger)", borderColor: "var(--line)" }}
          >
            <Icon name="trash" size={16} /> מחק
          </button>
        </div>
      </div>
    </Sheet>
  );
};

const ListActionsSheet = ({ open, list, people, onClose, onRename, onDelete, onToggleMember }) => {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) { setRenaming(false); setName(list?.name || ""); }
  }, [open, list]);

  if (!list) return <Sheet open={false} onClose={onClose}><div /></Sheet>;

  const memberIds = list.memberIds || [];

  const doRename = async () => {
    const v = name.trim();
    if (!v || v === list.name) { setRenaming(false); return; }
    setBusy(true);
    try { await onRename(list.id, v); setRenaming(false); }
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

  const toggleMember = async (profileId) => {
    setBusy(true);
    try { await onToggleMember(list.id, profileId); }
    catch (e) { alert(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-22" style={{ paddingBottom: 22 }}>
        {renaming ? (
          <>
            <div className="h2 mt-8">שנה שם רשימה</div>
            <div className="mt-16">
              <div className="field-label">שם חדש</div>
              <InlineNameInput
                className="input"
                value={name}
                onChange={setName}
                onSubmit={doRename}
                onCancel={() => setRenaming(false)}
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
          <>
            <div className="h2 mt-8">{list.name}</div>

            <div className="mt-16">
              <div className="field-label">משתתפים</div>
              <div className="vstack gap-6" style={{ marginTop: 4 }}>
                {people.map(p => {
                  const on = memberIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleMember(p.id)}
                      disabled={busy}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 14, cursor: "pointer",
                        background: on ? "var(--cream-soft)" : "transparent",
                        border: `1px solid ${on ? "var(--line-strong)" : "var(--line)"}`,
                        fontFamily: "inherit", width: "100%", textAlign: "right",
                      }}
                    >
                      <Avatar name={p.name} color={p.color} size="sm" />
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                        {p.name}
                        {p.isYou && <span className="tiny" style={{ marginInlineStart: 8, color: "var(--text-3)" }}>· את/ה</span>}
                      </div>
                      <div className={`check ${on ? "on" : ""}`} style={{ pointerEvents: "none" }} />
                    </button>
                  );
                })}
              </div>
            </div>

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
          </>
        )}
      </div>
    </Sheet>
  );
};

const GroceryScreen = ({ onBack }) => {
  const {
    state,
    addGroceryItem, toggleGroceryItem, removeGroceryItem, updateGroceryItem,
    createGroceryList, renameGroceryList, deleteGroceryList, selectList,
    toggleListMember,
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
  const [section, setSection] = React.useState("pantry");
  const [hideChecked, setHideChecked] = React.useState(false);
  const [newListName, setNewListName] = React.useState(null);
  const [actingOnList, setActingOnList] = React.useState(null);
  const [editingItem, setEditingItem] = React.useState(null);

  const add = async () => {
    const v = text.trim();
    if (!v || !selectedListId) return;
    setText("");
    try {
      await addGroceryItem({ name: v, qty: "", section, listId: selectedListId });
    } catch (e) {
      alert(e.message || String(e));
      setText(v);
    }
  };

  const startCreateList = () => setNewListName("");
  const cancelCreateList = () => setNewListName(null);
  const submitCreateList = async () => {
    const v = (newListName || "").trim();
    if (!v) { setNewListName(null); return; }
    try {
      await createGroceryList(v);
      setNewListName(null);
    } catch (e) {
      alert(e.message || String(e));
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
    <div className="scroll">
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
              onClick={startCreateList}
              title="רשימה חדשה"
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        }
      />

      {lists.length === 0 ? (
        <div className="px-22">
          {newListName !== null ? (
            <div className="card dashed" style={{
              background: "transparent", padding: 22, textAlign: "center",
            }}>
              <div className="small muted" style={{ marginBottom: 10 }}>איך נקרא לרשימה?</div>
              <InlineNameInput
                className="input"
                value={newListName}
                onChange={setNewListName}
                onSubmit={submitCreateList}
                onCancel={cancelCreateList}
                placeholder="שם הרשימה…"
                style={{ textAlign: "center" }}
              />
            </div>
          ) : (
            <button
              onClick={startCreateList}
              className="card dashed"
              style={{
                background: "transparent", padding: 22, textAlign: "center", cursor: "pointer",
                fontFamily: "inherit", width: "100%",
              }}
            >
              <div className="small muted" style={{ marginBottom: 6 }}>אין עדיין רשימות קניות</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>+ צור רשימה ראשונה</div>
            </button>
          )}
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
              {newListName !== null ? (
                <InlineNameInput
                  className="chip"
                  value={newListName}
                  onChange={setNewListName}
                  onSubmit={submitCreateList}
                  onCancel={cancelCreateList}
                  placeholder="שם רשימה…"
                  style={{
                    fontFamily: "inherit", flexShrink: 0,
                    border: "1.5px dashed var(--line-strong)",
                    background: "transparent", outline: "none",
                    minWidth: 110, width: 130,
                    fontSize: 13, fontWeight: 600,
                  }}
                />
              ) : (
                <button
                  className="chip outline"
                  onClick={startCreateList}
                  style={{
                    fontFamily: "inherit", flexShrink: 0,
                    borderStyle: "dashed",
                  }}
                  title="רשימה חדשה"
                >
                  + חדשה
                </button>
              )}
            </div>
          </div>

          <div className="px-22 vstack gap-12">
            {selectedList && (
              <div
                className="card"
                onClick={() => setActingOnList(selectedList)}
                style={{
                  padding: 18, background: "var(--mint)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
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
                <div
                  aria-label="עריכת הרשימה"
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "rgba(255,255,255,.4)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}
                >
                  <Icon name="more" size={18} color="var(--ink)" />
                </div>
              </div>
            )}

            <div style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && add()}
                placeholder={selectedListId ? "הוסף פריט…" : "בחר רשימה כדי להוסיף"}
                disabled={!selectedListId}
                style={{
                  flex: 1, border: "none", background: "transparent", outline: "none",
                  padding: "10px 14px", fontSize: 15, fontFamily: "inherit", minWidth: 0,
                }}
              />
              <button
                onClick={add}
                title="הוסף"
                disabled={!selectedListId || !text.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 14, border: "none",
                  background: "var(--ink)", color: "#fff",
                  display: "grid", placeItems: "center", cursor: "pointer",
                  opacity: (!selectedListId || !text.trim()) ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                <Icon name="plus" size={18} />
              </button>
            </div>

            <div className="hstack gap-6" style={{ overflowX: "auto", paddingBottom: 2 }}>
              {GROCERY_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`chip ${section === s.id ? "active" : "outline"}`}
                  style={{ fontFamily: "inherit", flexShrink: 0, gap: 6 }}
                >
                  <div className={`bg-${s.color}`} style={{
                    width: 16, height: 16, borderRadius: 5, display: "grid", placeItems: "center",
                  }}>
                    <Icon name={s.icon} size={10} color="#0E0E0E" />
                  </div>
                  {s.label}
                </button>
              ))}
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
            ) : grouped.map(sec => (
              <div key={sec.id} style={{ marginBottom: 16 }}>
                <div className="hstack gap-8" style={{ padding: "10px 22px 6px" }}>
                  <div className={`bg-${sec.color}`} style={{
                    width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                  }}>
                    <Icon name={sec.icon} size={12} color="#0E0E0E" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{sec.label}</div>
                  <span className="tiny" style={{ marginInlineStart: "auto" }}>{sec.items.length}</span>
                </div>
                <div style={{ background: "var(--paper)" }}>
                  {sec.items.map(item => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      people={people}
                      onToggle={() => toggleGroceryItem(item.id)}
                      onDelete={() => removeGroceryItem(item.id)}
                      onEdit={() => setEditingItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ListActionsSheet
        open={!!actingOnList}
        list={actingOnList && lists.find(l => l.id === actingOnList.id)}
        people={people}
        onClose={() => setActingOnList(null)}
        onRename={renameGroceryList}
        onDelete={deleteGroceryList}
        onToggleMember={toggleListMember}
      />

      <GroceryItemSheet
        open={!!editingItem}
        item={editingItem && allItems.find(i => i.id === editingItem.id)}
        onClose={() => setEditingItem(null)}
        onUpdate={updateGroceryItem}
        onDelete={removeGroceryItem}
      />
    </div>
  );
};

Object.assign(window, { GroceryScreen });
