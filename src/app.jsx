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
  const { sendChatMessage } = useAppState();
  const [route, setRoute] = useState("home");
  const [addOpen, setAddOpen] = useState(false);
  const [stack, setStack] = useState(["home"]);
  const screenRef = React.useRef(null);
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
    const dir = isRTL ? -1 : 1;
    const w = window.innerWidth;
    const clientX = (e) => (e.touches?.[0] || e.changedTouches?.[0])?.clientX ?? 0;
    const clientY = (e) => (e.touches?.[0] || e.changedTouches?.[0])?.clientY ?? 0;

    const node = () => screenRef.current;
    const setXY = (dx, animated) => {
      const el = node();
      if (!el) return;
      el.style.transition = animated ? "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease" : "none";
      if (dx > 0) {
        el.style.transform = `translateX(${dx * dir}px)`;
        el.style.boxShadow = `${-6 * dir}px 0 24px rgba(0,0,0,${0.12 * Math.min(dx / w, 1)})`;
      } else {
        el.style.transform = "";
        el.style.boxShadow = "";
      }
    };

    const onStart = (e) => {
      const x = clientX(e);
      if (isRTL ? x > w - 36 : x < 36) {
        t.tracking = true; t.startX = x; t.startY = clientY(e);
      }
    };

    const onMove = (e) => {
      if (!t.tracking) return;
      e.preventDefault();
      const dx = isRTL ? t.startX - clientX(e) : clientX(e) - t.startX;
      const dy = Math.abs(clientY(e) - t.startY);
      if (dy > 40 && dx < 10) { t.tracking = false; setXY(0, true); return; }
      if (dx > 0 && stack.length > 1) setXY(Math.min(dx, w), false);
    };

    const onEnd = (e) => {
      if (!t.tracking) return;
      t.tracking = false;
      const dx = isRTL ? t.startX - clientX(e) : clientX(e) - t.startX;
      if (dx > w * 0.35 && stack.length > 1) {
        setXY(w, true);
        setTimeout(() => { back(); setXY(0, false); }, 310);
      } else {
        setXY(0, true);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [stack]);

  return (
    <>
      <div ref={screenRef} style={{ position: "absolute", inset: 0 }}>
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

const Gate = () => (
  <AppStateProvider>
    <PhoneFrame><Inner /></PhoneFrame>
  </AppStateProvider>
);

const Inner = () => {
  const { session, profile, household, loading } = useAuth();
  const { hydrating } = useAppState();

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (!profile || !household) return <LoadingScreen />;
  if (hydrating) return <LoadingScreen />;

  try {
    const u = new URL(window.location.href);
    if (u.searchParams.has("invite")) {
      u.searchParams.delete("invite");
      window.history.replaceState({}, "", u.toString());
    }
  } catch (e) {}

  return <Shell />;
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
