/* global React, ReactDOM, Icon, HomeScreen, BillsScreen, GroceryScreen, AIChat, AISheet, AIActionPad, AddExpenseSheet, CategoriesScreen, HistoryScreen, HouseholdScreen, NotificationsScreen, AppStateProvider, useAppState, AuthProvider, useAuth, AuthScreen, SetupRequiredScreen, LoadingScreen */

const { useState } = React;

const BottomNav = ({ active, onChange, onFab }) => (
  <div className="bottomnav">
    <div className={`tab ${active === "home" ? "active" : ""}`} onClick={() => onChange("home")}>
      <Icon name="home" size={22} />
    </div>
    <div className={`tab ${active === "bills" ? "active" : ""}`} onClick={() => onChange("bills")}>
      <Icon name="bills" size={22} />
    </div>
    <div className="fab-wrap">
      <div className="fab ai-fab" onClick={onFab}>
        <Icon name="sparkles" size={26} />
      </div>
    </div>
    <div className={`tab ${active === "grocery" ? "active" : ""}`} onClick={() => onChange("grocery")}>
      <Icon name="cart" size={22} />
    </div>
    <div className={`tab ${active === "history" ? "active" : ""}`} onClick={() => onChange("history")}>
      <Icon name="calendar" size={22} />
    </div>
  </div>
);

const Shell = () => {
  const { sendChatMessage, hydrating } = useAppState();
  const [route, setRoute] = useState("home");
  const [addOpen, setAddOpen] = useState(false);
  const [stack, setStack] = useState(["home"]);
  const [dragX, setDragX] = useState(0);
  const [activeDrag, setActiveDrag] = useState(false);
  const touchRef = React.useRef({ tracking: false, startX: 0, startY: 0 });

  const navigate = (r) => { setStack(prev => [...prev, r]); setRoute(r); };
  const back = () => {
    setStack(prev => {
      const next = prev.slice(0, -1);
      const to = next[next.length - 1] || "home";
      setRoute(to);
      return next.length ? next : ["home"];
    });
  };
  const go = (r) => {
    if (r === route) return;
    if (r === "home") { setStack(["home"]); setRoute("home"); }
    else navigate(r);
  };

  const onFab = () => { if (route !== "ai") navigate("ai"); };
  const submitFromHome = (text) => { navigate("ai"); sendChatMessage(text); };

  React.useEffect(() => {
    const t = touchRef.current;
    const isRTL = document.documentElement.dir === "rtl";
    const w = window.innerWidth;
    const px = (e) => (e.touches || e.changedTouches)[0].clientX;
    const py = (e) => (e.touches || e.changedTouches)[0].clientY;

    const onStart = (e) => {
      const x = px(e);
      if (isRTL ? x > w - 30 : x < 30) {
        t.tracking = true; t.startX = x; t.startY = py(e);
      }
    };

    const onMove = (e) => {
      if (!t.tracking) return;
      const dx = isRTL ? t.startX - px(e) : px(e) - t.startX;
      const dy = Math.abs(py(e) - t.startY);
      if (dy > 40 && dx < 10) { t.tracking = false; setActiveDrag(false); setDragX(0); return; }
      if (dx > 0 && stack.length > 1) { setActiveDrag(true); setDragX(Math.min(dx, w)); }
    };

    const onEnd = (e) => {
      if (!t.tracking) return;
      t.tracking = false;
      const dx = isRTL ? t.startX - px(e) : px(e) - t.startX;
      setActiveDrag(false);
      if (dx > w * 0.35 && stack.length > 1) {
        setDragX(w);
        setTimeout(() => { back(); setDragX(0); }, 280);
      } else {
        setDragX(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [stack]);

  if (hydrating) return <LoadingScreen />;

  const isRTL = document.documentElement.dir === "rtl";
  const dir = isRTL ? -1 : 1;
  const screenStyle = dragX > 0 ? {
    position: "absolute", inset: 0,
    transform: `translateX(${dragX * dir}px)`,
    transition: activeDrag ? "none" : "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
    boxShadow: `${-6 * dir}px 0 20px rgba(0,0,0,0.13)`,
    willChange: "transform",
  } : {
    position: "absolute", inset: 0,
    transition: "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
  };

  return (
    <>
      <div style={screenStyle}>
        {route === "home" && <HomeScreen nav={navigate} openBills={() => navigate("bills")} openGrocery={() => navigate("grocery")} openExpense={() => setAddOpen(true)} openHistory={() => navigate("history")} onAISubmit={submitFromHome} />}
        {route === "bills" && <BillsScreen onBack={back} />}
        {route === "grocery" && <GroceryScreen onBack={back} />}
        {route === "ai" && <AIChat onBack={back} />}
        {route === "categories" && <CategoriesScreen onBack={back} />}
        {route === "history" && <HistoryScreen onBack={back} />}
        {route === "household" && <HouseholdScreen onBack={back} />}
        {route === "notifications" && <NotificationsScreen onBack={back} />}
      </div>
      <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} />
      {route !== "ai" && <BottomNav active={route} onChange={go} onFab={onFab} />}
    </>
  );
};

const PhoneFrame = ({ children }) => (
  <div className="stage">
    <div className="phone">
      <div className="phone-inner">{children}</div>
    </div>
  </div>
);

const Root = () => {
  if (!window.supabaseIsConfigured) {
    return <PhoneFrame><SetupRequiredScreen /></PhoneFrame>;
  }
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
};

const Gate = () => {
  const { session, profile, household, loading } = useAuth();
  if (loading) return <PhoneFrame><LoadingScreen /></PhoneFrame>;
  if (!session) return <PhoneFrame><AuthScreen /></PhoneFrame>;
  if (!profile || !household) return <PhoneFrame><LoadingScreen /></PhoneFrame>;

  try {
    const u = new URL(window.location.href);
    if (u.searchParams.has("invite")) {
      u.searchParams.delete("invite");
      window.history.replaceState({}, "", u.toString());
    }
  } catch (e) {}

  return (
    <AppStateProvider>
      <PhoneFrame><Shell /></PhoneFrame>
    </AppStateProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
