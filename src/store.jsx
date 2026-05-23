/* global React */
// App state — expenses, bills, grocery, chat, settings. Persisted in localStorage.

const STORAGE_KEY = "nest:state:v2";

const initialState = () => ({
  expenses: [],
  bills: [],
  grocery: [],
  chat: [],
  people: window.DEFAULT_PEOPLE,
  budget: 8200,
  apiKey: "",
  model: "claude-haiku-4-5",
});

const AppStateContext = React.createContext(null);
const useAppState = () => React.useContext(AppStateContext);

const AppStateProvider = ({ children }) => {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...initialState(), ...JSON.parse(raw) };
    } catch (e) {}
    return initialState();
  });
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  // mutable ref so tool loop can read fresh state across async iterations
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // ===== mutators =====
  const addExpense = (e) => {
    const exp = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      paidBy: "you", split: 50,
      date: hebrewDate(),
      ...e,
    };
    setState(p => ({ ...p, expenses: [exp, ...p.expenses] }));
    return exp;
  };
  const updateExpense = (id, patch) =>
    setState(p => ({ ...p, expenses: p.expenses.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const removeExpense = (id) =>
    setState(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }));

  const addBill = (b) => {
    const bill = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      status: "upcoming", assignee: "you",
      ...b,
    };
    setState(p => ({ ...p, bills: [bill, ...p.bills] }));
    return bill;
  };
  const updateBill = (id, patch) =>
    setState(p => ({ ...p, bills: p.bills.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const removeBill = (id) =>
    setState(p => ({ ...p, bills: p.bills.filter(x => x.id !== id) }));

  const addGroceryItem = (i) => {
    const item = {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      checked: false, addedBy: "you", section: "pantry", qty: "",
      ...i,
    };
    setState(p => ({ ...p, grocery: [item, ...p.grocery] }));
    return item;
  };
  const toggleGroceryItem = (id) =>
    setState(p => ({ ...p, grocery: p.grocery.map(x => x.id === id ? { ...x, checked: !x.checked } : x) }));
  const removeGroceryItem = (id) =>
    setState(p => ({ ...p, grocery: p.grocery.filter(x => x.id !== id) }));

  const setApiKey = (k) => setState(p => ({ ...p, apiKey: k }));
  const setModel = (m) => setState(p => ({ ...p, model: m }));
  const setBudget = (b) => setState(p => ({ ...p, budget: b }));

  const addPerson = (input) => {
    const name = (input.name || "").trim();
    if (!name) return null;
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
    const person = {
      id,
      name,
      color: input.color || "mint",
      short: input.short || name.split(/\s+/)[0].slice(0, 2),
    };
    setState(p => ({ ...p, people: [...p.people, person] }));
    return person;
  };
  const updatePerson = (id, patch) => {
    setState(p => ({ ...p, people: p.people.map(x => x.id === id ? { ...x, ...patch } : x) }));
  };
  const removePerson = (id) => {
    setState(p => ({ ...p, people: p.people.filter(x => x.id !== id) }));
  };

  const clearChat = () => setState(p => ({ ...p, chat: [] }));

  const resetAll = () => {
    setState(p => ({ ...initialState(), apiKey: p.apiKey, model: p.model }));
  };

  // ===== chat orchestration =====
  // Sends a user message, runs tool-use loop against Claude API, updates chat + data live.
  const sendChatMessage = async (text) => {
    if (!text || !text.trim()) return;
    const cur = stateRef.current;
    if (!cur.apiKey) return; // UI gates this; no-op if somehow called
    let history = [...cur.chat, { role: "user", content: text }];
    setState(p => ({ ...p, chat: history }));
    setPending(true);

    // local mutable working state so multiple tool calls in one turn see fresh data
    let working = {
      expenses: cur.expenses,
      bills: cur.bills,
      grocery: cur.grocery,
      budget: cur.budget,
    };

    try {
      for (let i = 0; i < 6; i++) {
        const resp = await window.callClaude({
          apiKey: cur.apiKey,
          model: cur.model,
          messages: history,
          people: stateRef.current.people,
        });
        history = [...history, { role: "assistant", content: resp.content }];
        setState(p => ({ ...p, chat: history }));

        if (resp.stop_reason !== "tool_use") break;

        const toolResults = [];
        for (const block of resp.content) {
          if (block.type === "tool_use") {
            const { result, next } = window.executeTool(block.name, block.input, working);
            working = next;
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: typeof result === "string" ? result : JSON.stringify(result),
            });
          }
        }
        history = [...history, { role: "user", content: toolResults }];
        setState(p => ({
          ...p,
          chat: history,
          expenses: working.expenses,
          bills: working.bills,
          grocery: working.grocery,
        }));
      }
      // commit final data
      setState(p => ({
        ...p,
        expenses: working.expenses,
        bills: working.bills,
        grocery: working.grocery,
      }));
    } catch (err) {
      setState(p => ({
        ...p,
        chat: [
          ...history,
          { role: "assistant", content: [{ type: "text", text: `שגיאה מה-API: ${err.message}` }] },
        ],
      }));
    } finally {
      setPending(false);
    }
  };

  const value = {
    state,
    pending,
    addExpense, updateExpense, removeExpense,
    addBill, updateBill, removeBill,
    addGroceryItem, toggleGroceryItem, removeGroceryItem,
    setApiKey, setModel, setBudget,
    addPerson, updatePerson, removePerson,
    sendChatMessage, clearChat,
    resetAll,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

const hebrewDate = () => {
  try {
    return new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  } catch (e) {
    return new Date().toLocaleDateString();
  }
};

Object.assign(window, { AppStateContext, AppStateProvider, useAppState, hebrewDate });
