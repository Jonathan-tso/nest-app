/* global React */
// Nest — נתוני זרע + קטגוריות (עברית)

const CATEGORIES = [
  { id: "groceries",    label: "קניות",          color: "mint",     hex: "#9BD3A8", icon: "cart"    },
  { id: "rent",         label: "שכירות",         color: "cream",    hex: "#EDDFCF", icon: "house"   },
  { id: "electricity",  label: "חשמל",           color: "butter",   hex: "#F5CD6E", icon: "bolt"    },
  { id: "water",        label: "מים",            color: "sky",      hex: "#9DBFE4", icon: "drop"    },
  { id: "internet",     label: "אינטרנט",        color: "lavender", hex: "#B9A8E0", icon: "wifi"    },
  { id: "tv",           label: "טלוויזיה",       color: "pink",     hex: "#F4A7B5", icon: "tv"      },
  { id: "transport",    label: "תחבורה",         color: "cream",    hex: "#D9C9B0", icon: "car"     },
  { id: "gas",          label: "גז וחימום",      color: "coral",    hex: "#FFB89A", icon: "flame"   },
  { id: "dining",       label: "מסעדות",         color: "coral",    hex: "#FFB89A", icon: "coffee"  },
  { id: "health",       label: "בריאות",         color: "pink",     hex: "#F4A7B5", icon: "health"  },
  { id: "household",    label: "בית",            color: "mint",     hex: "#C7E8CF", icon: "leaf"    },
];

const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const PEOPLE = [
  { id: "you", name: "דניאל", color: "sky",  short: "אתה" },
  { id: "noa", name: "נועה",  color: "mint", short: "נועה" },
];

const EXPENSES_MAY = [
  { id: "e1",  category: "groceries",   label: "שופרסל",            amount: 287.40, date: "21 במאי", paidBy: "you", split: 50 },
  { id: "e2",  category: "electricity", label: "חברת חשמל — אפריל",  amount: 412.00, date: "19 במאי", paidBy: "noa", split: 50, paid: true, recurring: true },
  { id: "e3",  category: "dining",      label: "קפה לוינסקי",        amount: 88.00,  date: "18 במאי", paidBy: "you", split: 50 },
  { id: "e4",  category: "groceries",   label: "טיב טעם",            amount: 142.90, date: "15 במאי", paidBy: "noa", split: 50 },
  { id: "e5",  category: "water",       label: "מי אביבים",          amount: 156.00, date: "14 במאי", paidBy: "noa", split: 50, paid: true, recurring: true },
  { id: "e6",  category: "transport",   label: "יאנגו",              amount: 124.00, date: "12 במאי", paidBy: "you", split: 50 },
  { id: "e7",  category: "groceries",   label: "שוק האיכרים",        amount: 64.00,  date: "11 במאי", paidBy: "you", split: 50 },
  { id: "e8",  category: "health",      label: "בית מרקחת",          amount: 92.50,  date: "9 במאי",  paidBy: "noa", split: 0 },
  { id: "e9",  category: "internet",    label: "בזק",                amount: 99.00,  date: "8 במאי",  paidBy: "you", split: 50, paid: true, recurring: true },
  { id: "e10", category: "dining",      label: "מיזנון",              amount: 76.00,  date: "7 במאי",  paidBy: "noa", split: 100 },
  { id: "e11", category: "rent",        label: "שכר דירה — מאי",      amount: 5800.00, date: "1 במאי", paidBy: "you", split: 50, paid: true, recurring: true },
  { id: "e12", category: "household",   label: "איקאה",              amount: 189.00, date: "3 במאי",  paidBy: "noa", split: 50 },
];

const BILLS = [
  { id: "b1", category: "rent",        label: "שכר דירה — יוני",     amount: 5800, dueDate: "1 ביוני",  dueIso: "2026-06-01", status: "upcoming", recurring: "חודשי", assignee: "you" },
  { id: "b2", category: "tv",          label: "נטפליקס",             amount: 54.90, dueDate: "24 במאי", dueIso: "2026-05-22", status: "overdue",  recurring: "חודשי", assignee: "noa", daysOverdue: 1 },
  { id: "b3", category: "electricity", label: "חשמל — מאי",          amount: 380,   dueDate: "28 במאי", dueIso: "2026-05-28", status: "upcoming", recurring: "דו-חודשי", assignee: "noa" },
  { id: "b4", category: "internet",    label: "בזק",                 amount: 99,    dueDate: "8 ביוני", dueIso: "2026-06-08", status: "upcoming", recurring: "חודשי", assignee: "you" },
  { id: "b5", category: "water",       label: "מי אביבים",           amount: 156,   dueDate: "14 ביוני", dueIso: "2026-06-14", status: "upcoming", recurring: "דו-חודשי", assignee: "noa" },
  { id: "b6", category: "tv",          label: "ספוטיפיי",            amount: 39.90, dueDate: "12 ביוני", dueIso: "2026-06-12", status: "upcoming", recurring: "חודשי", assignee: "you" },
];

const GROCERY_INIT = [
  { id: "g1", section: "produce",  name: "עגבניות",      qty: "1 ק״ג",     addedBy: "you", checked: false },
  { id: "g2", section: "produce",  name: "מלפפונים",     qty: "4",         addedBy: "noa", checked: false },
  { id: "g3", section: "produce",  name: "אבוקדו",       qty: "3",         addedBy: "you", checked: false },
  { id: "g4", section: "produce",  name: "לימונים",      qty: "5",         addedBy: "noa", checked: true },
  { id: "g6", section: "dairy",    name: "יוגורט יווני",  qty: "500 ג׳",    addedBy: "you", checked: false },
  { id: "g7", section: "dairy",    name: "קוטג׳",         qty: "2",         addedBy: "noa", checked: false },
  { id: "g8", section: "dairy",    name: "פטה",          qty: "200 ג׳",    addedBy: "you", checked: false },
  { id: "g9", section: "dairy",    name: "חלב",          qty: "1 ליטר",    addedBy: "ai",  checked: false, suggested: true },
  { id: "g10", section: "bakery",  name: "לחם",          qty: "כיכר",      addedBy: "you", checked: false },
  { id: "g11", section: "bakery",  name: "פיתות",         qty: "חבילה",     addedBy: "noa", checked: false },
  { id: "g12", section: "pantry",  name: "שמן זית",       qty: "750 מ״ל",   addedBy: "noa", checked: false },
  { id: "g13", section: "pantry",  name: "טחינה",         qty: "1",         addedBy: "you", checked: true },
  { id: "g15", section: "household", name: "סבון כלים",   qty: "1",         addedBy: "you", checked: false },
  { id: "g16", section: "household", name: "נייר טואלט",  qty: "12 גלילים", addedBy: "noa", checked: false },
];

const GROCERY_SECTIONS = [
  { id: "produce",   label: "ירקות ופירות", icon: "leaf",    color: "mint" },
  { id: "dairy",     label: "חלב וביצים",   icon: "drop",    color: "sky" },
  { id: "bakery",    label: "מאפים",        icon: "coffee",  color: "butter" },
  { id: "pantry",    label: "יבשים",        icon: "leaf",    color: "cream" },
  { id: "household", label: "לבית",         icon: "leaf",    color: "pink" },
];

const AI_INSIGHTS = [
  {
    id: "i1",
    headline: "אתה 18% מתחת לתקציב הקניות",
    body: "₪491 מתוך ₪600.",
    tone: "good",
  },
  {
    id: "i2",
    headline: "נועה שילמה יותר החודש",
    body: "כיסתה ₪612 יותר ממך.",
    cta: "סגירת חשבון",
    tone: "neutral",
  },
];

const NOTIFICATIONS = [
  { id: "n1", kind: "overdue",  who: "Nest",    time: "לפני שעתיים", title: "נטפליקס בפיגור", body: "₪54.90 — נועה רשומה כמשלמת.", read: false },
  { id: "n2", kind: "added",    who: "נועה",    time: "לפני 5 שעות", title: "נועה הוסיפה 4 פריטים לקניות", body: "מלפפונים, קוטג׳, פיתות, סבון כלים", read: false },
  { id: "n3", kind: "ai",       who: "Nest AI", time: "אתמול",       title: "זוהה חשבון בזק במייל",       body: "₪99 נוסף לחשבונות החוזרים.", read: true },
  { id: "n5", kind: "reminder", who: "Nest",    time: "לפני 3 ימים", title: "חשבון חשמל בעוד 5 ימים",      body: "₪380 — נועה אחראית.", read: true },
];

const MONTHLY_HISTORY = [
  { month: "מאי 2026",    total: 7531, change: -4,  budget: 8200, status: "current" },
  { month: "אפריל 2026",  total: 7848, change: 6,   budget: 8200 },
  { month: "מרץ 2026",    total: 7401, change: -2,  budget: 8200 },
  { month: "פברואר 2026", total: 7552, change: 12,  budget: 8200 },
  { month: "ינואר 2026",  total: 6740, change: -8,  budget: 8200 },
  { month: "דצמבר 2025",  total: 7320, change: 4,   budget: 7800 },
];

const CHAT_SEED = [
  { id: "c0", from: "ai", text: "שלח לי קבלה או ספר לי על מה הוצאת — ואני ארשום." },
];

Object.assign(window, {
  CATEGORIES, CAT, PEOPLE,
  EXPENSES_MAY, BILLS,
  GROCERY_INIT, GROCERY_SECTIONS,
  AI_INSIGHTS, NOTIFICATIONS, MONTHLY_HISTORY,
  CHAT_SEED,
});
