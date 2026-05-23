/* global React */
// Generic bottom sheet — mount-on-open, unmount-after-close.
// While closed the sheet is absent from the DOM, so it can never
// contribute to the page's scrollable height or leak its drop shadow
// into the page behind it.

const Sheet = ({ open, onClose, children }) => {
  const sheetRef = React.useRef(null);
  const dragState = React.useRef({ y0: 0, dy: 0, dragging: false });
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // Two RAFs so the browser paints the initial (closed) frame
      // before we flip to the open class — otherwise CSS skips the
      // transition.
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 360);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  if (!mounted) return null;

  return (
    <>
      <div className={`scrim ${shown ? "open" : ""}`} onClick={onClose} />
      <div
        ref={sheetRef}
        className={`sheet ${shown ? "open" : ""}`}
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
