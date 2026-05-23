/* global React */
// Nest — shared components & icons

const { useState, useEffect, useRef, useMemo } = React;

// ====== ICONS ======
const Icon = ({ name, size = 22, stroke = 1.8, color = "currentColor" }) => {
  const s = size;
  const c = color;
  const sw = stroke;
  const directional = ["forward", "chevron", "chevronLeft", "send", "arrow"];
  const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const flip = directional.includes(name) && isRTL;
  const common = {
    width: s, height: s, viewBox: "0 0 24 24", fill: "none",
    stroke: c, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
    style: flip ? { transform: "scaleX(-1)" } : undefined
  };

  const paths = {
    home: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></>,
    bills: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    cart: <><path d="M3 4h2l2.5 11.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20.5" r="1.2" /><circle cx="17" cy="20.5" r="1.2" /></>,
    bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    back: <><path d="M9 6l6 6-6 6" /></>,
    forward: <><path d="M9 6l6 6-6 6" /></>,
    sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="M19 16l.7 2L21.5 19l-1.8.7L19 22l-.7-2.3L16.5 19l1.8-.7L19 16Z" /></>,
    camera: <><path d="M5 7h2.5l1.2-1.8a1 1 0 0 1 .85-.45h4.9a1 1 0 0 1 .85.45L16.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.5" /></>,
    mic: <><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5 12a7 7 0 0 0 14 0" /><path d="M12 19v3" /></>,
    image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M4 17l4.5-4 4 4 3-2.5L20 18" /></>,
    chat: <><path d="M4.5 5h15v11h-9l-4 3v-3h-2V5Z" /></>,
    chevron: <><path d="M9 6l6 6-6 6" /></>,
    chevronDown: <><path d="M6 9l6 6 6-6" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></>,
    more: <><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></>,
    check: <><path d="M5 12l4.5 4.5L19 7" /></>,
    calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    repeat: <><path d="M4 9l3-3h9a4 4 0 0 1 4 4" /><path d="M20 15l-3 3H8a4 4 0 0 1-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    grocery: <><path d="M4 7h3l1.5 9a1.5 1.5 0 0 0 1.5 1.3h7" /><path d="M7 10h13l-1.5 5.5a1.5 1.5 0 0 1-1.5 1.1H9" /></>,
    bolt: <><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></>,
    drop: <><path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></>,
    wifi: <><path d="M3 9.5a14 14 0 0 1 18 0" /><path d="M6 13a10 10 0 0 1 12 0" /><path d="M9 16.5a6 6 0 0 1 6 0" /><circle cx="12" cy="19.5" r="1" /></>,
    tv: <><rect x="3.5" y="5.5" width="17" height="12" rx="2" /><path d="M9 21h6M12 17.5V21" /></>,
    car: <><path d="M5 11l1.6-4a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11" /><rect x="3.5" y="11" width="17" height="6" rx="1.5" /><circle cx="7.5" cy="17" r="1.2" /><circle cx="16.5" cy="17" r="1.2" /></>,
    house: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /></>,
    flame: <><path d="M12 3s4.5 4 4.5 9a4.5 4.5 0 1 1-9 0c0-2 1-3 1.5-3.5C9.5 9 9 6 12 3Z" /></>,
    coffee: <><path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2" /><path d="M8 3v2M11 3v2M14 3v2" /></>,
    health: <><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" /></>,
    leaf: <><path d="M20 4c0 9-5.5 14-12 14a6 6 0 0 1-4-1.5C4 9 11 4 20 4Z" /><path d="M4 20c2-6 6-10 12-12" /></>,
    receipt: <><path d="M5.5 3.5h13V21l-2-1.3L14 21l-2-1.3L10 21l-2-1.3L5.5 21V3.5Z" /><path d="M9 8h6M9 11.5h6M9 15h4" /></>,
    upload: <><path d="M12 16V5" /><path d="M7 10l5-5 5 5" /><path d="M4 19h16" /></>,
    send: <><path d="M21 4 11 14" /><path d="M21 4 14 21l-3-7-7-3 17-7Z" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    pencil: <><path d="M4 20l1-4 11-11 3 3-11 11-4 1Z" /><path d="M14 7l3 3" /></>,
    download: <><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></>,
    paperclip: <><path d="M20 11.5 12.5 19a4.5 4.5 0 1 1-6.4-6.4l8-8a3 3 0 1 1 4.3 4.3l-7.9 7.9a1.5 1.5 0 1 1-2.1-2.1L15 8" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></>,
  };
  return <svg {...common} style={{ strokeWidth: "1px" }}>{paths[name] || null}</svg>;
};

// ====== Avatars ======
const Avatar = ({ name, color = "cream", size = "" }) => {
  const init = (name || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("");
  const cls = `avatar ${size} bg-${color}`;
  return <div className={cls}>{init}</div>;
};

const AvatarStack = ({ people, size = "sm" }) =>
<div style={{ display: "inline-flex" }}>
    {people.map((p, i) =>
  <div key={p.name} style={{ marginLeft: i === 0 ? 0 : -10 }}>
        <div className={`avatar ${size} bg-${p.color || "cream"}`} style={{ border: "2px solid #fff" }}>
          {p.name.split(/\s+/).map((s) => s[0]).slice(0, 1).join("")}
        </div>
      </div>
  )}
  </div>;


// ====== Status bar ======
const StatusBar = ({ inverted = false }) =>
<div className="statusbar" style={{ color: inverted ? "#fff" : "var(--ink)" }}>
    <div>9:41</div>
    <div className="right">
      <span className="dots">
        <span style={{ background: "currentColor" }} />
        <span style={{ background: "currentColor" }} />
        <span style={{ background: "currentColor" }} />
        <span style={{ background: "currentColor" }} />
      </span>
      <svg width="16" height="11" viewBox="0 0 18 12" fill="none" style={{ marginLeft: 6 }}>
        <path d="M9 11.5 16 4.5a10 10 0 0 0-14 0L9 11.5Z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" />
      </svg>
      <svg width="24" height="11" viewBox="0 0 26 12" fill="none" style={{ marginLeft: 4 }}>
        <rect x="1" y="1" width="22" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="3" y="3" width="18" height="6" rx="1" fill="currentColor" />
        <rect x="24" y="4" width="1.6" height="4" rx="0.5" fill="currentColor" />
      </svg>
    </div>
  </div>;


// ====== Top bar ======
const TopBar = ({ title, onBack, trailing }) =>
<div className="topbar">
    <div className="back" onClick={onBack}>
      {onBack ? <Icon name="back" size={20} /> : null}
    </div>
    <h1>{title}</h1>
    <div className="back" style={{ visibility: trailing ? "visible" : "hidden" }}>
      {trailing}
    </div>
  </div>;


// ====== Logo ======
const NestLogo = ({ size = 22 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <img
      src="./nest-logo.svg"
      alt=""
      height={size}
      width={Math.round(size * 753 / 855)}
      style={{ display: "block" }}
    />
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.04em" }}>Nest</span>
  </div>
);


// ====== Donut chart ======
const Donut = ({ data, size = 140, stroke = 18 }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  return (
    <svg className="donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--field)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = d.value / total * C;
        const seg = <circle key={i}
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={d.color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt" />;

        offset += len;
        return seg;
      })}
    </svg>);

};

// ====== Sparkline ======
const Sparkline = ({ points, width = 280, height = 56, color = "#0E0E0E" }) => {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = width / (points.length - 1);
  const norm = (v) => height - 8 - (v - min) / (max - min || 1) * (height - 16);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${norm(p)}`).join(" ");
  const area = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={area} fill="rgba(20,18,14,.06)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => i === points.length - 1 ?
      <circle key={i} cx={i * stepX} cy={norm(p)} r="4" fill={color} /> :
      null)}
    </svg>);

};

// ====== Bar chart ======
const BarChart = ({ data, height = 120, color = "#0E0E0E" }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
      {data.map((d, i) =>
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{
          width: "100%",
          height: `${d.value / max * (height - 24)}px`,
          background: d.highlight ? color : "var(--cream)",
          borderRadius: "8px 8px 0 0",
          transition: "height .35s ease"
        }} />
          <div className="tiny" style={{ color: d.highlight ? "var(--ink)" : "var(--text-2)", fontWeight: 700 }}>{d.label}</div>
        </div>
      )}
    </div>);

};

// Export to window
// ====== Inline name editor ======
// Auto-focused input with Enter-to-submit, Escape/empty-blur to cancel.
// Reused for inline-creating and inline-renaming named entities.
const InlineNameInput = ({
  value, onChange, onSubmit, onCancel,
  className, style, placeholder,
}) => (
  <input
    autoFocus
    value={value}
    onChange={e => onChange(e.target.value)}
    onKeyDown={e => {
      if (e.key === "Enter") onSubmit();
      else if (e.key === "Escape") onCancel();
    }}
    onBlur={() => { if (!(value || "").trim()) onCancel(); }}
    className={className}
    style={style}
    placeholder={placeholder}
  />
);

Object.assign(window, { Icon, Avatar, AvatarStack, StatusBar, TopBar, NestLogo, Donut, Sparkline, BarChart, InlineNameInput });
