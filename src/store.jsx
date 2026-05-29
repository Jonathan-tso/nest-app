/* global React, useAuth */
// App data store — backed by Supabase Postgres + realtime.

const AppStateContext = React.createContext(null);
const useAppState = () => React.useContext(AppStateContext);

const hebrewDate = () => {
  try { return new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long" }); }
  catch (e) { return new Date().toLocaleDateString(); }
};

// DB row → in-app shape used by existing screens
const mapExpense = (r) => ({
  id: r.id,
  label: r.label,
  amount: Number(r.amount) || 0,
  category: r.category,
  paidBy: r.paid_by,
  split: r.split,
  date: r.date || "",
  recurring: !!r.recurring,
  createdBy: r.created_by,
  createdAt: r.created_at || null,
});
const mapBill = (r) => ({
  id: r.id,
  label: r.label,
  amount: Number(r.amount) || 0,
  category: r.category,
  dueDate: r.due_date || "",
  recurring: r.recurring || null,
  assignee: r.assignee,
  status: r.status || "upcoming",
  paid: !!r.paid,
});
const mapGrocery = (r) => ({
  id: r.id,
  name: r.name,
  qty: r.qty || "",
  section: r.section || "pantry",
  addedBy: r.added_by,
  checked: !!r.checked,
  listId: r.list_id || null,
});
const mapList = (r) => ({
  id: r.id,
  name: r.name,
  createdBy: r.created_by,
  createdAt: r.created_at,
  memberIds: Array.isArray(r.member_ids) ? r.member_ids : [],
});
const mapChat = (r) => ({ role: r.role, content: r.content });
const mapInsight = (r) => ({
  id: r.id,
  title: r.title,
  body: r.body || "",
  createdAt: r.created_at || null,
  expiresAt: r.expires_at || null,
});

const AppStateProvider = ({ children }) => {
  const supabase = window.supabaseClient;
  const { session, profile, household, refreshProfile } = useAuth();
  const userId = profile?.id;
  const householdId = household?.id;

  const [expenses, setExpenses] = React.useState([]);
  const [bills, setBills] = React.useState([]);
  const [grocery, setGrocery] = React.useState([]);
  const [groceryLists, setGroceryLists] = React.useState([]);
  const [selectedListId, setSelectedListId] = React.useState(null);
  const [people, setPeople] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [settings, setSettings] = React.useState({ apiKey: window.BASE44_SUPERAGENT_API_KEY || "enabled", model: "claude-haiku-4-5" });
  const [insights, setInsights] = React.useState([]);
  const [aiStage, setAiStage] = React.useState(null);
  const [hydrating, setHydrating] = React.useState(true);

  // Persist Base44 Superagent conversation_id across messages (localStorage-backed ref)
  const superagentConvIdRef = React.useRef(
    typeof localStorage !== "undefined" ? (localStorage.getItem("superagent_conversation_id") || null) : null
  );
  // User's personal Anthropic API key — stored here so refreshInsight can reach it after hydration
  const anthropicKeyRef = React.useRef(null);
  const generatingInsightRef = React.useRef(false);

  // Track latest snapshot for tool execution / closures
  const stateRef = React.useRef({});
  React.useEffect(() => {
    stateRef.current = { expenses, bills, grocery, groceryLists, selectedListId, people, chat, settings };
  }, [expenses, bills, grocery, groceryLists, selectedListId, people, chat, settings]);

  // ===== Hydrate =====
  const refetchMembers = React.useCallback(async () => {
    if (!supabase || !householdId || !userId) return;
    const { data } = await supabase
      .from("household_members")
      .select("role, profile_id, profiles(id, display_name, color)")
      .eq("household_id", householdId);
    const list = (data || [])
      .map(r => ({
        id: r.profile_id,
        name: r.profiles?.display_name || "",
        color: r.profiles?.color || "mint",
        short: (r.profiles?.display_name || "").split(/\s+/)[0].slice(0, 2),
        owner: r.role === "owner",
        isYou: r.profile_id === userId,
      }))
      .sort((a, b) => (a.isYou ? -1 : b.isYou ? 1 : 0));
    setPeople(list);
  }, [supabase, householdId, userId]);

  React.useEffect(() => {
    if (!supabase || !userId || !householdId) {
      setHydrating(false);
      return;
    }
    let alive = true;
    setHydrating(true);

    (async () => {
      const [expR, bilR, groR, listsR, chmR, stR, insR] = await Promise.all([
        supabase.from("expenses").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
        supabase.from("bills").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
        supabase.from("grocery_items").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
        supabase.from("grocery_lists").select("*").eq("household_id", householdId).order("created_at", { ascending: true }),
        supabase.from("chat_messages").select("*").eq("profile_id", userId).order("created_at", { ascending: true }),
        supabase.from("user_settings").select("*").eq("profile_id", userId).maybeSingle(),
        supabase.from("ai_insights").select("*").eq("household_id", householdId).order("created_at", { ascending: false }).limit(10),
      ]);
      if (!alive) return;
      setExpenses((expR.data || []).map(mapExpense));
      setBills((bilR.data || []).map(mapBill));
      setGrocery((groR.data || []).map(mapGrocery));
      const lists = (listsR.data || []).map(mapList);
      setGroceryLists(lists);
      setSelectedListId(prev => (prev && lists.some(l => l.id === prev)) ? prev : (lists[0]?.id || null));
      setChat((chmR.data || []).map(mapChat));
      if (stR.data) {
        setSettings({
          apiKey: window.BASE44_SUPERAGENT_API_KEY || "enabled",
          model: stR.data.model || "claude-haiku-4-5",
        });
      }
      setInsights((insR.data || []).map(mapInsight));
      await refetchMembers();
      setHydrating(false);

      // Auto-generate an AI insight if none exists from the last 24 hours
      const anthropicKey = stR.data?.api_key;
      anthropicKeyRef.current = anthropicKey || null;
      if (anthropicKey && (expR.data || []).length >= 3) {
        const cutoff = new Date(Date.now() - 86_400_000).toISOString();
        const hasRecent = (insR.data || []).some(r => r.created_at > cutoff);
        if (!hasRecent) {
          window.generateAIInsight({
            apiKey: anthropicKey,
            model: stR.data?.model || "claude-haiku-4-5",
            expenses: (expR.data || []).map(mapExpense),
            bills:    (bilR.data || []).map(mapBill),
          }).then(async (insight) => {
            if (!insight?.title || !alive) return;
            const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
            const { data: row } = await supabase
              .from("ai_insights")
              .insert({ household_id: householdId, title: insight.title, body: insight.body || "", expires_at: expiresAt })
              .select().single();
            if (row && alive) setInsights(prev => [mapInsight(row), ...prev]);
          }).catch(() => {});
        }
      }
    })();

    return () => { alive = false; };
  }, [supabase, userId, householdId, refetchMembers]);

  // ===== Realtime =====
  React.useEffect(() => {
    if (!supabase || !householdId) return;
    const channel = supabase.channel(`hh:${householdId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setExpenses(prev => prev.some(e => e.id === payload.new.id) ? prev : [mapExpense(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setExpenses(prev => prev.map(e => e.id === payload.new.id ? mapExpense(payload.new) : e));
          } else if (payload.eventType === "DELETE") {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "bills", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBills(prev => prev.some(b => b.id === payload.new.id) ? prev : [mapBill(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setBills(prev => prev.map(b => b.id === payload.new.id ? mapBill(payload.new) : b));
          } else if (payload.eventType === "DELETE") {
            setBills(prev => prev.filter(b => b.id !== payload.old.id));
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "grocery_items", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setGrocery(prev => prev.some(g => g.id === payload.new.id) ? prev : [mapGrocery(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setGrocery(prev => prev.map(g => g.id === payload.new.id ? mapGrocery(payload.new) : g));
          } else if (payload.eventType === "DELETE") {
            setGrocery(prev => prev.filter(g => g.id !== payload.old.id));
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "grocery_lists", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setGroceryLists(prev => prev.some(l => l.id === payload.new.id) ? prev : [...prev, mapList(payload.new)]);
          } else if (payload.eventType === "UPDATE") {
            setGroceryLists(prev => prev.map(l => l.id === payload.new.id ? mapList(payload.new) : l));
          } else if (payload.eventType === "DELETE") {
            setGroceryLists(prev => prev.filter(l => l.id !== payload.old.id));
            setSelectedListId(prev => prev === payload.old.id ? null : prev);
          }
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "household_members", filter: `household_id=eq.${householdId}` },
        () => refetchMembers())
      .on("postgres_changes",
        { event: "*", schema: "public", table: "ai_insights", filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInsights(prev => prev.some(i => i.id === payload.new.id) ? prev : [mapInsight(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setInsights(prev => prev.map(i => i.id === payload.new.id ? mapInsight(payload.new) : i));
          } else if (payload.eventType === "DELETE") {
            setInsights(prev => prev.filter(i => i.id !== payload.old.id));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, householdId, refetchMembers]);

  // ===== Mutators =====
  const addExpense = async (e) => {
    if (!supabase || !householdId) return null;
    const row = {
      household_id: householdId,
      label: e.label,
      amount: Number(e.amount) || 0,
      category: e.category,
      paid_by: e.paidBy || userId,
      split: e.split ?? 50,
      date: e.date || hebrewDate(),
      recurring: !!e.recurring,
      created_by: userId,
    };
    const { data, error } = await supabase.from("expenses").insert(row).select().single();
    if (error) throw error;
    setExpenses(prev => prev.some(x => x.id === data.id) ? prev : [mapExpense(data), ...prev]);
    return mapExpense(data);
  };
  const updateExpense = async (id, patch) => {
    const dbPatch = {};
    if ("label" in patch)    dbPatch.label    = patch.label;
    if ("amount" in patch)   dbPatch.amount   = patch.amount;
    if ("category" in patch) dbPatch.category = patch.category;
    if ("paidBy" in patch)   dbPatch.paid_by  = patch.paidBy;
    if ("split" in patch)    dbPatch.split    = patch.split;
    if ("date" in patch)     dbPatch.date     = patch.date;
    if ("recurring" in patch) dbPatch.recurring = patch.recurring;
    const { data, error } = await supabase.from("expenses").update(dbPatch).eq("id", id).select().single();
    if (error) throw error;
    setExpenses(prev => prev.map(x => x.id === id ? mapExpense(data) : x));
  };
  const removeExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    setExpenses(prev => prev.filter(x => x.id !== id));
  };

  const addBill = async (b) => {
    if (!supabase || !householdId) return null;
    const row = {
      household_id: householdId,
      label: b.label,
      amount: Number(b.amount) || 0,
      category: b.category,
      due_date: b.dueDate || "",
      recurring: b.recurring || null,
      assignee: b.assignee || userId,
      status: b.status || "upcoming",
      paid: !!b.paid,
    };
    const { data, error } = await supabase.from("bills").insert(row).select().single();
    if (error) throw error;
    setBills(prev => prev.some(x => x.id === data.id) ? prev : [mapBill(data), ...prev]);
    return mapBill(data);
  };
  const updateBill = async (id, patch) => {
    const dbPatch = {};
    if ("label" in patch)    dbPatch.label = patch.label;
    if ("amount" in patch)   dbPatch.amount = patch.amount;
    if ("category" in patch) dbPatch.category = patch.category;
    if ("dueDate" in patch)  dbPatch.due_date = patch.dueDate;
    if ("recurring" in patch) dbPatch.recurring = patch.recurring;
    if ("assignee" in patch) dbPatch.assignee = patch.assignee;
    if ("status" in patch)   dbPatch.status = patch.status;
    if ("paid" in patch)     dbPatch.paid = patch.paid;
    const { data, error } = await supabase.from("bills").update(dbPatch).eq("id", id).select().single();
    if (error) throw error;
    setBills(prev => prev.map(x => x.id === id ? mapBill(data) : x));
    if (patch.paid === true) refreshInsight().catch(() => {});
  };
  const removeBill = async (id) => {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) throw error;
    setBills(prev => prev.filter(x => x.id !== id));
  };

  const resolveAddedBy = (val) => {
    if (val === "ai") return null;
    if (!val || val === "you") return userId;
    return val;
  };

  const addGroceryItem = async (i) => {
    if (!supabase || !householdId) return null;
    const targetList = i.listId || stateRef.current.selectedListId || stateRef.current.groceryLists[0]?.id || null;
    if (!targetList) throw new Error("צור רשימה לפני הוספת פריט");
    const row = {
      household_id: householdId,
      list_id: targetList,
      name: i.name,
      qty: i.qty || "",
      section: i.section || "pantry",
      added_by: resolveAddedBy(i.addedBy),
      checked: !!i.checked,
    };
    const { data, error } = await supabase.from("grocery_items").insert(row).select().single();
    if (error) throw error;
    setGrocery(prev => prev.some(x => x.id === data.id) ? prev : [mapGrocery(data), ...prev]);
    return mapGrocery(data);
  };

  const createGroceryList = async (name) => {
    if (!supabase || !householdId) return null;
    const trimmed = (name || "").trim();
    if (!trimmed) throw new Error("שם רשימה חובה");
    let { data, error } = await supabase
      .from("grocery_lists")
      .insert({ household_id: householdId, name: trimmed, created_by: userId, member_ids: userId ? [userId] : [] })
      .select().single();
    if (error?.message?.includes("member_ids")) {
      // Column not yet added — run migration-grocery-list-members.sql in Supabase
      ({ data, error } = await supabase
        .from("grocery_lists")
        .insert({ household_id: householdId, name: trimmed, created_by: userId })
        .select().single());
    }
    if (error) throw error;
    const list = mapList(data);
    setGroceryLists(prev => prev.some(l => l.id === list.id) ? prev : [...prev, list]);
    setSelectedListId(list.id);
    return list;
  };

  const setListMembers = async (listId, memberIds) => {
    const unique = Array.from(new Set(memberIds.filter(Boolean)));
    const { data, error } = await supabase
      .from("grocery_lists")
      .update({ member_ids: unique })
      .eq("id", listId)
      .select().single();
    if (error) throw error;
    setGroceryLists(prev => prev.map(l => l.id === listId ? mapList(data) : l));
    return mapList(data);
  };

  const toggleListMember = async (listId, profileId) => {
    const list = stateRef.current.groceryLists.find(l => l.id === listId);
    if (!list) return;
    const has = list.memberIds.includes(profileId);
    const next = has
      ? list.memberIds.filter(id => id !== profileId)
      : [...list.memberIds, profileId];
    await setListMembers(listId, next);
  };

  const renameGroceryList = async (id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) throw new Error("שם רשימה חובה");
    const { data, error } = await supabase
      .from("grocery_lists").update({ name: trimmed }).eq("id", id).select().single();
    if (error) throw error;
    setGroceryLists(prev => prev.map(l => l.id === id ? mapList(data) : l));
  };

  const deleteGroceryList = async (id) => {
    const { error } = await supabase.from("grocery_lists").delete().eq("id", id);
    if (error) throw error;
    setGroceryLists(prev => prev.filter(l => l.id !== id));
    setSelectedListId(prev => {
      if (prev !== id) return prev;
      const remaining = stateRef.current.groceryLists.filter(l => l.id !== id);
      return remaining[0]?.id || null;
    });
    setGrocery(prev => prev.filter(g => g.listId !== id));
  };

  const selectList = (id) => setSelectedListId(id);
  const toggleGroceryItem = async (id) => {
    const item = stateRef.current.grocery.find(g => g.id === id);
    if (!item) return;
    const next = !item.checked;
    setGrocery(prev => prev.map(g => g.id === id ? { ...g, checked: next } : g));
    const { error } = await supabase.from("grocery_items").update({ checked: next }).eq("id", id);
    if (error) {
      // revert on failure
      setGrocery(prev => prev.map(g => g.id === id ? { ...g, checked: item.checked } : g));
    }
  };
  const removeGroceryItem = async (id) => {
    setGrocery(prev => prev.filter(g => g.id !== id));
    await supabase.from("grocery_items").delete().eq("id", id);
  };
  const updateGroceryItem = async (id, patch) => {
    if (!supabase) return;
    const dbPatch = {};
    if ("name" in patch)    dbPatch.name    = patch.name;
    if ("qty" in patch)     dbPatch.qty     = patch.qty;
    if ("section" in patch) dbPatch.section = patch.section;
    if ("checked" in patch) dbPatch.checked = patch.checked;
    const { data, error } = await supabase
      .from("grocery_items").update(dbPatch).eq("id", id).select().single();
    if (error) throw error;
    setGrocery(prev => prev.map(g => g.id === id ? mapGrocery(data) : g));
  };

  // ===== Person actions =====
  const updateMyProfile = async (patch) => {
    if (!supabase || !userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...(patch.name != null ? { display_name: patch.name } : {}),
        ...(patch.color != null ? { color: patch.color } : {}),
      })
      .eq("id", userId)
      .select().single();
    if (error) throw error;
    refreshProfile && refreshProfile();
    await refetchMembers();
    return data;
  };
  const removeMember = async (profileId) => {
    const { error } = await supabase.rpc("remove_member", { target_profile: profileId });
    if (error) throw error;
    await refetchMembers();
  };
  const createInvite = async () => {
    if (!supabase || !householdId || !userId) return null;
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data, error } = await supabase
      .from("invitations")
      .insert({ household_id: householdId, code, created_by: userId })
      .select().single();
    if (error) throw error;
    return data;
  };

  // ===== Settings =====
  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (!supabase || !userId) return;
    await supabase.from("user_settings").upsert({
      profile_id: userId,
      api_key: next.apiKey,
      model: next.model,
    });
  };
  const setApiKey = (apiKey) => saveSettings({ apiKey });
  const setModel  = (model)  => saveSettings({ model });

  // ===== Chat =====
  const persistChat = async (msg) => {
    if (!supabase || !userId) return;
    await supabase.from("chat_messages").insert({
      profile_id: userId,
      role: msg.role,
      content: msg.content,
    });
  };

  const clearChat = async () => {
    setChat([]);
    superagentConvIdRef.current = null;
    localStorage.removeItem("superagent_conversation_id");
    if (supabase && userId) {
      await supabase.from("chat_messages").delete().eq("profile_id", userId);
    }
  };

  const wipeHousehold = async () => {
    if (!supabase) return;
    await supabase.rpc("wipe_household");
    setExpenses([]); setBills([]); setGrocery([]);
  };

  // ===== AI Insight refresh =====
  const refreshInsight = async () => {
    const apiKey = anthropicKeyRef.current;
    if (!apiKey || !supabase || !householdId || generatingInsightRef.current) return;
    generatingInsightRef.current = true;
    try {
      const { expenses: curExpenses, bills: curBills, settings: s } = stateRef.current;
      const insight = await window.generateAIInsight({
        apiKey,
        model: s.model || "claude-haiku-4-5",
        expenses: curExpenses,
        bills: curBills,
      });
      if (!insight?.title) return;
      const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
      const { data: row } = await supabase
        .from("ai_insights")
        .insert({ household_id: householdId, title: insight.title, body: insight.body || "", expires_at: expiresAt })
        .select().single();
      if (row) setInsights(prev => [mapInsight(row), ...prev]);
    } catch (_) {}
    finally { generatingInsightRef.current = false; }
  };

  // ===== Chat orchestration (Base44 Superagent) =====
  const sendChatMessage = async (text) => {
    if (!text || !text.trim() || aiStage !== null) return;

    const userMsg = { role: "user", content: text };
    const history = [...stateRef.current.chat, userMsg];
    setChat(history);
    persistChat(userMsg);

    try {
      const { conversationId, content } = await window.callBase44Superagent({
        message: text,
        conversationId: superagentConvIdRef.current,
        onStage: setAiStage,
      });

      if (conversationId !== superagentConvIdRef.current) {
        superagentConvIdRef.current = conversationId;
        localStorage.setItem("superagent_conversation_id", conversationId);
      }

      const assistantMsg = { role: "assistant", content };
      setChat([...history, assistantMsg]);
      persistChat(assistantMsg);

      // If the agent modified data, refetch the affected tables immediately
      // so changes appear without waiting for realtime or a page reload.
      const toolUses = Array.isArray(content) ? content.filter(b => b.type === "tool_use") : [];
      const calledTools = new Set(toolUses.map(t => t.name));
      if (supabase && householdId && calledTools.size > 0) {
        const fetchExpenses = calledTools.has("add_expense");
        const fetchBills    = calledTools.has("add_bill") || calledTools.has("mark_bill_paid");
        const fetchGrocery  = calledTools.has("add_grocery_item");
        const jobs = [];
        if (fetchExpenses) jobs.push(
          supabase.from("expenses").select("*").eq("household_id", householdId).order("created_at", { ascending: false })
            .then(({ data }) => data && setExpenses(data.map(mapExpense)))
        );
        if (fetchBills) jobs.push(
          supabase.from("bills").select("*").eq("household_id", householdId).order("created_at", { ascending: false })
            .then(({ data }) => data && setBills(data.map(mapBill)))
        );
        if (fetchGrocery) jobs.push(
          supabase.from("grocery_items").select("*").eq("household_id", householdId).order("created_at", { ascending: false })
            .then(({ data }) => data && setGrocery(data.map(mapGrocery)))
        );
        await Promise.all(jobs);
        if (calledTools.has("mark_bill_paid")) refreshInsight().catch(() => {});
      }
    } catch (err) {
      const errMsg = { role: "assistant", content: `שגיאה: ${err.message}` };
      setChat([...history, errMsg]);
      persistChat(errMsg);
    } finally {
      setAiStage(null);
    }
  };

  const value = {
    state: {
      expenses, bills, grocery, groceryLists, selectedListId,
      people, chat, insights, ...settings,
    },
    aiStage, pending: aiStage !== null, hydrating,
    addExpense, updateExpense, removeExpense,
    addBill, updateBill, removeBill,
    addGroceryItem, toggleGroceryItem, removeGroceryItem, updateGroceryItem,
    createGroceryList, renameGroceryList, deleteGroceryList, selectList,
    setListMembers, toggleListMember,
    updateMyProfile, removeMember, createInvite,
    setApiKey, setModel, saveSettings,
    clearChat, wipeHousehold,
    sendChatMessage,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

Object.assign(window, { AppStateContext, AppStateProvider, useAppState, hebrewDate });
