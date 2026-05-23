/* global hebrewDate */
// Claude API client + tool definitions. Tools return DB-ready rows;
// the store performs the actual writes against Supabase.

const CATEGORY_IDS = ["groceries","rent","electricity","water","internet","tv","transport","gas","dining","health","household"];
const SECTION_IDS = ["produce","dairy","bakery","pantry","household"];

const buildTools = (people) => {
  const peopleIds = (people && people.length ? people : []).map(p => p.id);
  // If no people yet, leave enum loose (just string) so the model can still be called.
  const personSchema = peopleIds.length
    ? { type: "string", enum: peopleIds }
    : { type: "string" };

  return [
    {
      name: "add_expense",
      description: "הוסף הוצאה חדשה. השתמש כשהמשתמש מתאר משהו שכבר הוצאו עליו כסף.",
      input_schema: {
        type: "object",
        properties: {
          label: { type: "string", description: "תיאור קצר. לדוגמה: 'שופרסל', 'קפה'." },
          amount: { type: "number" },
          category: { type: "string", enum: CATEGORY_IDS },
          paid_by: { ...personSchema, description: "uuid של מי ששילם. ברירת מחדל: המשתמש הנוכחי" },
          split: { type: "number", enum: [50, 100, 0], description: "50=חצי-חצי, 100=על מישהו אחר, 0=אישי" },
          date: { type: "string" },
          recurring: { type: "boolean" }
        },
        required: ["label", "amount", "category"]
      }
    },
    {
      name: "add_bill",
      description: "הוסף חשבון לתשלום עתידי.",
      input_schema: {
        type: "object",
        properties: {
          label: { type: "string" },
          amount: { type: "number" },
          category: { type: "string", enum: CATEGORY_IDS },
          due_date: { type: "string" },
          recurring: { type: "string", description: "חודשי / דו-חודשי / שנתי. ריק אם חד-פעמי." },
          assignee: { ...personSchema, description: "uuid של האחראי. ברירת מחדל: המשתמש הנוכחי" }
        },
        required: ["label", "amount", "category"]
      }
    },
    {
      name: "mark_bill_paid",
      description: "סמן חשבון כשולם או החזר ללא שולם.",
      input_schema: {
        type: "object",
        properties: {
          bill_id: { type: "string", description: "uuid של החשבון" },
          paid: { type: "boolean" }
        },
        required: ["bill_id"]
      }
    },
    {
      name: "add_grocery_item",
      description: "הוסף פריט לרשימת הקניות.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          qty: { type: "string" },
          section: { type: "string", enum: SECTION_IDS }
        },
        required: ["name"]
      }
    },
    {
      name: "get_state",
      description: "החזר את כל הנתונים: הוצאות, חשבונות, קניות, סיכומים, חברי הבית.",
      input_schema: { type: "object", properties: {} }
    }
  ];
};

// Pure tool runner — returns { result, next } where result includes a `row`
// that the store will persist to Supabase.
const executeTool = (name, input, state) => {
  const me = state.userId;
  switch (name) {
    case "add_expense": {
      const row = {
        label: input.label,
        amount: Number(input.amount) || 0,
        category: input.category,
        paidBy: input.paid_by || me,
        split: input.split ?? 50,
        date: input.date || hebrewDate(),
        recurring: !!input.recurring,
      };
      const optimistic = { ...row, id: `tmp-${Date.now()}` };
      return {
        result: { ok: true, row, summary: `נוספה הוצאה: ${row.label} (₪${row.amount})` },
        next: { ...state, expenses: [optimistic, ...state.expenses] },
      };
    }
    case "add_bill": {
      const row = {
        label: input.label,
        amount: Number(input.amount) || 0,
        category: input.category,
        dueDate: input.due_date || "",
        recurring: input.recurring || null,
        assignee: input.assignee || me,
        status: "upcoming",
        paid: false,
      };
      const optimistic = { ...row, id: `tmp-${Date.now()}` };
      return {
        result: { ok: true, row, summary: `נוסף חשבון: ${row.label} (₪${row.amount})` },
        next: { ...state, bills: [optimistic, ...state.bills] },
      };
    }
    case "mark_bill_paid": {
      const id = input.bill_id;
      const paid = input.paid !== false;
      const found = state.bills.find(b => b.id === id);
      if (!found) return { result: { ok: false, error: `חשבון ${id} לא נמצא` }, next: state };
      const bills = state.bills.map(b => b.id === id ? {
        ...b, paid, status: paid ? "paid" : (b.status === "overdue" ? "overdue" : "upcoming"),
      } : b);
      return {
        result: { ok: true, id, paid, summary: paid ? `סומן כשולם: ${found.label}` : `הוחזר ללא שולם: ${found.label}` },
        next: { ...state, bills },
      };
    }
    case "add_grocery_item": {
      const row = {
        name: input.name,
        qty: input.qty || "1",
        section: input.section || "pantry",
        addedBy: "ai",
        checked: false,
      };
      const optimistic = { ...row, id: `tmp-${Date.now()}`, addedBy: null };
      return {
        result: { ok: true, row, summary: `נוסף לקניות: ${row.name}` },
        next: { ...state, grocery: [optimistic, ...state.grocery] },
      };
    }
    case "get_state": {
      const totalSpent = state.expenses.reduce((s,e) => s + (e.amount || 0), 0);
      const byCat = {};
      state.expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
      const balances = {};
      (state.people || []).forEach(p => { balances[p.id] = { name: p.name, paid: 0, share: 0 }; });
      state.expenses.forEach(e => {
        if (!balances[e.paidBy]) balances[e.paidBy] = { name: "(unknown)", paid: 0, share: 0 };
        balances[e.paidBy].paid += e.amount;
        if (e.split === 50) {
          const n = Math.max((state.people || []).length, 1);
          (state.people || []).forEach(p => { if (balances[p.id]) balances[p.id].share += e.amount / n; });
        } else if (e.split === 100) {
          const others = (state.people || []).filter(p => p.id !== e.paidBy);
          const n = Math.max(others.length, 1);
          others.forEach(p => { if (balances[p.id]) balances[p.id].share += e.amount / n; });
        } else if (e.split === 0) {
          if (balances[e.paidBy]) balances[e.paidBy].share += e.amount;
        }
      });
      const balanceList = Object.entries(balances).map(([id, b]) => ({
        id, name: b.name, balance: b.paid - b.share,
      }));

      return {
        result: {
          household_members: state.people || [],
          current_user_id: state.userId,
          total_spent: totalSpent,
          budget: state.budget,
          by_category: byCat,
          balances: balanceList,
          expenses_count: state.expenses.length,
          expenses: state.expenses.slice(0, 30),
          bills: state.bills,
          bills_overdue: state.bills.filter(b => b.status === "overdue"),
          bills_unpaid: state.bills.filter(b => !b.paid),
          grocery_pending: state.grocery.filter(g => !g.checked),
          grocery_checked_count: state.grocery.filter(g => g.checked).length,
        },
        next: state,
      };
    }
    default:
      return { result: { ok: false, error: `כלי לא ידוע: ${name}` }, next: state };
  }
};

const buildSystemPrompt = (people) => {
  const list = (people || []).map(p =>
    `${p.id}=${p.name}${p.isYou ? " (המשתמש המדבר)" : ""}${p.owner ? " [owner]" : ""}`
  ).join(", ") || "(אין חברי בית)";
  return `אתה Nest AI — עוזר ניהול הוצאות הבית.

חברי הבית הפעילים (uuid → שם): ${list}.

תפקיד:
- כשהמשתמש מתאר הוצאה — קרא ל-add_expense.
- כשהוא מזכיר חשבון לתשלום עתידי — add_bill.
- כשהוא מבקש להוסיף לקניות — add_grocery_item.
- כשהוא שואל "כמה הוצאתי", "מה לשלם", "מה המאזן" — קרא get_state ותענה לפי הנתונים האמיתיים.
- כשהוא מציין שחשבון שולם — מצא את ה-id עם get_state ואז mark_bill_paid.

קטגוריות זמינות: groceries, rent, electricity, water, internet, tv, transport, gas, dining, health, household.
נחש קטגוריה לפי הקשר (קפה→dining, סופר→groceries, בזק→internet וכו').

הנחיות:
- דבר עברית בלבד, בלשון זכר אל המשתמש (אלא אם השם רומז אחרת).
- תמציתי. משפט-שניים. ידידותי.
- אחרי כלי, אשר בקצרה: "נוסף ₪40 על קפה" — לא יותר.
- אל תכפיל פעולות.
- "אני"/"שלי" = id של המשתמש המדבר. שמות אחרים → התאם ל-id מתוך הרשימה.
- אם חסר סכום או פרט — שאל שאלה קצרה אחת.
- אל תמציא נתונים.`;
};

async function callClaude({ apiKey, model = "claude-haiku-4-5", messages, people = [], maxTokens = 1024 }) {
  const tools = buildTools(people);
  const system = buildSystemPrompt(people);
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, tools, messages }),
  });
  if (!resp.ok) {
    let detail = "";
    try {
      const errBody = await resp.json();
      detail = errBody?.error?.message || JSON.stringify(errBody).slice(0, 200);
    } catch (e) {
      detail = await resp.text().catch(() => "");
    }
    throw new Error(`${resp.status} — ${detail || "request failed"}`);
  }
  return await resp.json();
}

// Base44 Superagent integration
// Base URL is copied from Superagent Settings > API (pattern: https://www.base44.app/api/apps/{app_id})
const BASE44_SUPERAGENT_API_KEY = "d9e3bb73c59444bd85463687f04d42cf";
const BASE44_SUPERAGENT_BASE_URL = "https://www.base44.app/api/apps/d9e3bb73c59444bd85463687f04d42cf";

async function callBase44Superagent({ message, conversationId }) {
  const headers = {
    "Authorization": `Bearer ${BASE44_SUPERAGENT_API_KEY}`,
    "Content-Type": "application/json",
  };

  let convId = conversationId;

  if (!convId) {
    const createResp = await fetch(`${BASE44_SUPERAGENT_BASE_URL}/agents/conversations`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (!createResp.ok) {
      let detail = "";
      try {
        const errBody = await createResp.json();
        detail = errBody?.error?.message || JSON.stringify(errBody).slice(0, 200);
      } catch (e) {
        detail = await createResp.text().catch(() => "");
      }
      throw new Error(`${createResp.status} — ${detail || "failed to create conversation"}`);
    }
    const conv = await createResp.json();
    convId = conv.id;
  }

  const msgResp = await fetch(`${BASE44_SUPERAGENT_BASE_URL}/agents/conversations/${convId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: message }),
  });
  if (!msgResp.ok) {
    let detail = "";
    try {
      const errBody = await msgResp.json();
      detail = errBody?.error?.message || JSON.stringify(errBody).slice(0, 200);
    } catch (e) {
      detail = await msgResp.text().catch(() => "");
    }
    throw new Error(`${msgResp.status} — ${detail || "failed to send message"}`);
  }
  const assistantMsg = await msgResp.json();
  return { conversationId: convId, content: assistantMsg.content };
}

Object.assign(window, { callClaude, callBase44Superagent, BASE44_SUPERAGENT_API_KEY, executeTool, buildTools, buildSystemPrompt });
