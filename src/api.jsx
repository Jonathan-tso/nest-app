/* global hebrewDate */
// Claude API client + tool definitions, parameterised by current household members.

const CATEGORY_IDS = ["groceries","rent","electricity","water","internet","tv","transport","gas","dining","health","household"];
const SECTION_IDS = ["produce","dairy","bakery","pantry","household"];

const buildTools = (people) => {
  const peopleIds = (people && people.length ? people : [{ id: "you" }]).map(p => p.id);
  return [
    {
      name: "add_expense",
      description: "הוסף הוצאה חדשה. השתמש כאשר המשתמש מתאר משהו שכבר הוצאו עליו כסף.",
      input_schema: {
        type: "object",
        properties: {
          label: { type: "string", description: "תיאור קצר. לדוגמה: 'שופרסל', 'קפה'." },
          amount: { type: "number", description: "סכום בשקלים, מספר חיובי." },
          category: { type: "string", enum: CATEGORY_IDS },
          paid_by: { type: "string", enum: peopleIds, description: "id של מי ששילם. ברירת מחדל: you" },
          split: { type: "number", enum: [50, 100, 0], description: "50=חצי-חצי, 100=על מישהו אחר, 0=אישי. ברירת מחדל 50" },
          date: { type: "string", description: "תאריך בעברית. ברירת מחדל: היום" },
          recurring: { type: "boolean", description: "האם זאת הוצאה חוזרת" }
        },
        required: ["label", "amount", "category"]
      }
    },
    {
      name: "add_bill",
      description: "הוסף חשבון לתשלום עתידי (חוזר או חד פעמי).",
      input_schema: {
        type: "object",
        properties: {
          label: { type: "string" },
          amount: { type: "number" },
          category: { type: "string", enum: CATEGORY_IDS },
          due_date: { type: "string", description: "תאריך התשלום, בעברית" },
          recurring: { type: "string", description: "חודשי / דו-חודשי / שנתי. ריק אם חד-פעמי." },
          assignee: { type: "string", enum: peopleIds, description: "id של האחראי לתשלום. ברירת מחדל: you" }
        },
        required: ["label", "amount", "category"]
      }
    },
    {
      name: "mark_bill_paid",
      description: "סמן חשבון כשולם, או החזר ללא שולם אם paid=false.",
      input_schema: {
        type: "object",
        properties: {
          bill_id: { type: "string" },
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
          qty: { type: "string", description: "לדוגמה: '1 ק״ג', '2', 'חבילה'." },
          section: { type: "string", enum: SECTION_IDS }
        },
        required: ["name"]
      }
    },
    {
      name: "get_state",
      description: "החזר את כל הנתונים: הוצאות, חשבונות, קניות, סיכומים, חברי הבית. השתמש כדי לענות על שאלות.",
      input_schema: { type: "object", properties: {} }
    }
  ];
};

const executeTool = (name, input, state) => {
  switch (name) {
    case "add_expense": {
      const exp = {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        label: input.label,
        amount: Number(input.amount) || 0,
        category: input.category,
        paidBy: input.paid_by || "you",
        split: input.split ?? 50,
        date: input.date || hebrewDate(),
        recurring: !!input.recurring,
      };
      return {
        result: { ok: true, id: exp.id, summary: `נוספה הוצאה: ${exp.label} (₪${exp.amount})` },
        next: { ...state, expenses: [exp, ...state.expenses] },
      };
    }
    case "add_bill": {
      const bill = {
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        label: input.label,
        amount: Number(input.amount) || 0,
        category: input.category,
        dueDate: input.due_date || "",
        recurring: input.recurring || null,
        assignee: input.assignee || "you",
        status: "upcoming",
        paid: false,
      };
      return {
        result: { ok: true, id: bill.id, summary: `נוסף חשבון: ${bill.label} (₪${bill.amount})` },
        next: { ...state, bills: [bill, ...state.bills] },
      };
    }
    case "mark_bill_paid": {
      const id = input.bill_id;
      const paid = input.paid !== false;
      const found = state.bills.find(b => b.id === id);
      if (!found) return { result: { ok: false, error: `חשבון ${id} לא נמצא` }, next: state };
      const bills = state.bills.map(b => b.id === id ? {
        ...b,
        paid,
        status: paid ? "paid" : (b.status === "overdue" ? "overdue" : "upcoming"),
      } : b);
      return {
        result: { ok: true, summary: paid ? `סומן כשולם: ${found.label}` : `הוחזר ללא שולם: ${found.label}` },
        next: { ...state, bills },
      };
    }
    case "add_grocery_item": {
      const item = {
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        name: input.name,
        qty: input.qty || "1",
        section: input.section || "pantry",
        addedBy: "ai",
        checked: false,
      };
      return {
        result: { ok: true, summary: `נוסף לקניות: ${item.name}` },
        next: { ...state, grocery: [item, ...state.grocery] },
      };
    }
    case "get_state": {
      const totalSpent = state.expenses.reduce((s,e) => s + (e.amount || 0), 0);
      const byCat = {};
      state.expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
      // Compute balance: per person (paid - fair_share)
      const balances = {};
      (state.people || []).forEach(p => { balances[p.id] = { name: p.name, paid: 0, share: 0 }; });
      state.expenses.forEach(e => {
        if (!balances[e.paidBy]) balances[e.paidBy] = { name: "(orphan)", paid: 0, share: 0 };
        balances[e.paidBy].paid += e.amount;
        if (e.split === 50) {
          (state.people || []).forEach(p => { if (balances[p.id]) balances[p.id].share += e.amount / (state.people.length || 1); });
        } else if (e.split === 100) {
          // someone else owes the full amount; we don't know who without more info
          (state.people || []).forEach(p => {
            if (p.id !== e.paidBy && balances[p.id]) balances[p.id].share += e.amount / Math.max(state.people.length - 1, 1);
          });
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
  const list = (people || []).map(p => `${p.id}=${p.name}${p.owner ? " (המשתמש עצמו)" : ""}`).join(", ") || "you=המשתמש";
  return `אתה Nest AI — עוזר ניהול הוצאות הבית.

חברי הבית הפעילים: ${list}.
המשתמש שמדבר איתך הוא ה-owner (id="you"). פנה אליו בלשון זכר.

תפקיד:
- כשהמשתמש מתאר הוצאה — הוסף אותה דרך add_expense.
- כשהוא מזכיר חשבון לתשלום עתידי — add_bill.
- כשהוא מבקש להוסיף לקניות — add_grocery_item.
- כשהוא שואל "כמה הוצאתי", "מה לשלם", "מה המאזן" — קרא get_state ותענה לפי הנתונים האמיתיים.
- כשהוא מציין שחשבון שולם — מצא את ה-id עם get_state ואז mark_bill_paid.

קטגוריות זמינות: groceries, rent, electricity, water, internet, tv, transport, gas, dining, health, household.
נחש קטגוריה לפי הקשר (קפה→dining, סופר→groceries, בזק→internet וכו').

הנחיות:
- דבר עברית בלבד, בלשון זכר אל המשתמש.
- תמציתי. משפט-שניים. ידידותי. בלי פירוט מיותר.
- אחרי כלי, אשר בקצרה: "נוסף ₪40 על קפה" — לא יותר.
- אל תכפיל פעולות. הוצאה אחת = קריאה אחת ל-add_expense.
- "אני" / "שלי" = id="you". שמות אחרים → התאם ל-id הנכון מ-${list}.
- אם המשתמש לא מציין סכום או פרטים חסרים — שאל שאלה קצרה אחת.
- אל תמציא נתונים. אם אין הוצאות, אמור "אין הוצאות רשומות".`;
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

Object.assign(window, { callClaude, executeTool, buildTools, buildSystemPrompt });
