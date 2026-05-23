/* global React */
// Generic bottom sheet with drag-to-dismiss gesture

const Sheet = ({ open, onClose, children, height = "auto", maxHeight = "92%" }) => {
  const sheetRef = React.useRef(null);
  const dragState = React.useRef({ y0: 0, dy: 0, dragging: false });

  const onPointerDown = (e) => {
    dragState.current.dragging = true;
    dragState.current.y0 = e.clientY;
    dragState.current.dy = 0;
    if (sheetRef.current) sheetRef.current.classList.add("dragging");
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const dy = Math.max(0, e.clientY - dragState.current.y0);
    dragState.current.dy = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = () => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (sheetRef.current) {
      sheetRef.current.classList.remove("dragging");
      sheetRef.current.style.transform = "";
    }
    if (dragState.current.dy > 100) onClose && onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`scrim ${open ? "open" : ""}`} onClick={onClose} />
      <div
        ref={sheetRef}
        className={`sheet ${open ? "open" : ""}`}
        style={{ maxHeight, height }}
      >
        <div
          className="grip-wrap"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ padding: "4px 0 4px", flexShrink: 0, touchAction: "none" }}
        >
          <div className="grip" />
        </div>
        <div style={{ overflowY: "auto", flex: 1, overscrollBehavior: "contain" }}>
          {children}
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Sheet });
