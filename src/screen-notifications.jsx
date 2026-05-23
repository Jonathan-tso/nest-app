/* global React, Icon, TopBar, NOTIFICATIONS */

const KIND_META = {
  overdue:  { icon: "bell",     color: "coral" },
  added:    { icon: "plus",     color: "mint" },
  ai:       { icon: "sparkles", color: "lavender" },
  settle:   { icon: "receipt",  color: "butter" },
  reminder: { icon: "calendar", color: "sky" },
};

const NotificationsScreen = ({ onBack }) => {
  const [items, setItems] = React.useState(NOTIFICATIONS);
  const unread = items.filter(n => !n.read).length;

  const markAll = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const tap = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="scroll">
      <TopBar
        title="התראות"
        onBack={onBack}
        trailing={
          unread > 0 ? (
            <button
              className="chip outline"
              onClick={markAll}
              style={{ fontFamily: "inherit" }}
            >סמן הכל</button>
          ) : null
        }
      />
      <div className="px-22">
        {unread > 0 && (
          <div className="small muted" style={{ marginBottom: 10 }}>
            {unread} חדשות
          </div>
        )}
        <div className="card" style={{ padding: "4px 18px" }}>
          {items.map(n => {
            const m = KIND_META[n.kind] || KIND_META.reminder;
            return (
              <div key={n.id} className="row" onClick={() => tap(n.id)} style={{ cursor: "pointer" }}>
                <div className={`lead bg-${m.color}`} style={{ position: "relative" }}>
                  <Icon name={m.icon} size={20} color="#0E0E0E" />
                  {!n.read && (
                    <span style={{
                      position: "absolute", top: -2, insetInlineEnd: -2,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "var(--danger)", border: "2px solid var(--paper)",
                    }} />
                  )}
                </div>
                <div className="meta">
                  <div className="t" style={{ fontWeight: n.read ? 600 : 800 }}>{n.title}</div>
                  <div className="s" style={{ marginTop: 2 }}>{n.body}</div>
                  <div className="tiny" style={{ marginTop: 4, color: "var(--text-3)" }}>{n.who} · {n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NotificationsScreen });
