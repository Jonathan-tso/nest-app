/* global React, Icon */
// Tweaks — floating design controls (dev-only quick switcher)

const useTweaks = (defaults) => {
  const [state, setState] = React.useState(() => {
    try {
      const stored = localStorage.getItem("nest:tweaks");
      if (stored) return { ...defaults, ...JSON.parse(stored) };
    } catch (e) {}
    return defaults;
  });
  const set = (key, val) => {
    setState(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem("nest:tweaks", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  return [state, set];
};

const TweaksPanel = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="tweaks-anchor">
      {open && (
        <div style={{
          position: "absolute",
          insetInlineEnd: 0, bottom: 56,
          width: 280, maxHeight: "70vh", overflowY: "auto",
          background: "var(--paper)",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 24px 60px rgba(20,18,14,.22), 0 6px 16px rgba(20,18,14,.10)",
          border: "1px solid var(--line)",
          direction: "rtl",
        }}>
          <div className="hstack between mb-12">
            <div style={{ fontSize: 13, fontWeight: 800 }}>טוויקים</div>
            <div onClick={() => setOpen(false)} style={{ cursor: "pointer", width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 8 }}>
              <Icon name="close" size={16} />
            </div>
          </div>
          {children}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label="טוויקים"
        style={{
          width: 44, height: 44, borderRadius: 14,
          background: "var(--ink)",
          color: "#fff",
          border: "none",
          display: "grid", placeItems: "center",
          cursor: "pointer",
          boxShadow: "0 12px 24px rgba(20,18,14,.22)",
        }}
      >
        <Icon name="settings" size={20} />
      </button>
    </div>
  );
};

const TweakSection = ({ label }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: "10px 0 6px" }}>
    {label}
  </div>
);

const TweakRadio = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div className="field-label" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`chip ${value === o.value ? "active" : "outline"}`}
          style={{ fontFamily: "inherit" }}
        >{o.label}</button>
      ))}
    </div>
  </div>
);

const TweakSelect = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div className="field-label" style={{ marginBottom: 6 }}>{label}</div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input"
      style={{ height: 38, fontSize: 13, fontFamily: "inherit" }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TweakColor = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div className="field-label" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", gap: 8 }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-label={o.label}
          style={{
            width: 26, height: 26, borderRadius: 8,
            background: o.hex,
            border: value === o.value ? "2px solid var(--ink)" : "1px solid var(--line-strong)",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  </div>
);

Object.assign(window, { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor });
