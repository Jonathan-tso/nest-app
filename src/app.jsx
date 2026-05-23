/* global React, ReactDOM, Icon, NestLogo, HomeScreen, BillsScreen, GroceryScreen, AIChat, AISheet, AIActionPad, AddExpenseSheet, CategoriesScreen, HistoryScreen, HouseholdScreen, NotificationsScreen, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect */

const { useState, useEffect } = React;

const BottomNav = ({ active, onChange, onFab }) => {
  return (
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
};

const App = () => {
  const TWEAK_DEFAULTS = {
    "homeLayout": "calm",
    "billsViz": "list",
    "aiUX": "chat",
    "accent": "default",
  };
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [route, setRoute] = useState("home");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPadOpen, setAiPadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // simple history stack for back gesture
  const [stack, setStack] = useState(["home"]);
  const navigate = (r) => {
    setStack(prev => [...prev, r]);
    setRoute(r);
  };
  const back = () => {
    setStack(prev => {
      const next = prev.slice(0, -1);
      const to = next[next.length - 1] || "home";
      setRoute(to);
      return next.length ? next : ["home"];
    });
  };

  const onFab = () => {
    if (tweaks.aiUX === "chat") navigate("ai");
    else if (tweaks.aiUX === "sheet") setAiOpen(true);
    else if (tweaks.aiUX === "actions") setAiPadOpen(true);
  };

  const go = (r) => {
    if (r === route) return;
    if (r === "home") {
      setStack(["home"]);
      setRoute("home");
    } else {
      navigate(r);
    }
  };

  const theme = tweaks.accent === "default" ? "" :
    tweaks.accent === "sage" ? "theme-sage" :
    tweaks.accent === "bloom" ? "theme-bloom" :
    tweaks.accent === "mono" ? "theme-mono" : "";

  // back-swipe gesture from screen edge
  React.useEffect(() => {
    let startX = 0, startY = 0, tracking = false;
    const onStart = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const isRTL = document.documentElement.dir === "rtl";
      const w = window.innerWidth;
      if (isRTL ? x > w - 30 : x < 30) {
        tracking = true;
        startX = x;
        startY = y;
      }
    };
    const onEnd = (e) => {
      if (!tracking) return;
      tracking = false;
      const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      if (dx > 60 && dy < 60) {
        if (stack.length > 1) back();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [stack]);

  return (
    <div className={`stage ${theme}`}>
      <div className="phone" data-screen-label={`Phone — ${route}`}>
        <div className="phone-inner">
          {route === "home" &&
            <HomeScreen
              layout={tweaks.homeLayout}
              nav={navigate}
              openAI={onFab}
              openBills={() => navigate("bills")}
              openGrocery={() => navigate("grocery")}
              openExpense={() => setAddOpen(true)}
              openHistory={() => navigate("history")}
            />
          }
          {route === "bills" && <BillsScreen viz={tweaks.billsViz} onBack={back} onAdd={() => setAddOpen(true)} onPick={() => {}} onPay={() => {}} />}
          {route === "grocery" && <GroceryScreen onBack={back} onCheckout={() => {}} />}
          {route === "ai" && <AIChat onBack={back} />}
          {route === "categories" && <CategoriesScreen onBack={back} />}
          {route === "history" && <HistoryScreen onBack={back} />}
          {route === "household" && <HouseholdScreen onBack={back} />}
          {route === "notifications" && <NotificationsScreen onBack={back} />}

          <AISheet open={aiOpen} onClose={() => setAiOpen(false)} />
          <AIActionPad open={aiPadOpen} onClose={() => setAiPadOpen(false)} />
          <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} />

          {route !== "ai" && <BottomNav active={route} onChange={go} onFab={onFab} />}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="מבנה" />
        <TweakRadio
          label="הבית"
          value={tweaks.homeLayout}
          options={[
            { value: "calm", label: "רגוע" },
            { value: "dense", label: "צפוף" },
            { value: "hero", label: "AI מובלט" },
          ]}
          onChange={(v) => setTweak("homeLayout", v)}
        />
        <TweakRadio
          label="חשבונות"
          value={tweaks.billsViz}
          options={[
            { value: "list", label: "רשימה" },
            { value: "calendar", label: "לוח שנה" },
          ]}
          onChange={(v) => setTweak("billsViz", v)}
        />
        <TweakRadio
          label="קלט AI"
          value={tweaks.aiUX}
          options={[
            { value: "chat", label: "צאט" },
            { value: "sheet", label: "מגירה" },
            { value: "actions", label: "FAB" },
          ]}
          onChange={(v) => setTweak("aiUX", v)}
        />

        <TweakSection label="צבע" />
        <TweakSelect
          label="פלטת צבעים"
          value={tweaks.accent}
          options={[
            { value: "default", label: "קרם + פסטלים" },
            { value: "sage", label: "מרווה וחמאה" },
            { value: "bloom", label: "פריחה (לבנדר)" },
            { value: "mono", label: "מונו חמים" },
          ]}
          onChange={(v) => setTweak("accent", v)}
        />
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
