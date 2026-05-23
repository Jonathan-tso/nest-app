/* global React */
// Nest — קטגוריות, סקציות. חברי הבית נשמרים ב-store ונערכים על ידי המשתמש.

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

const DEFAULT_PEOPLE = [
  { id: "you", name: "דניאל", color: "sky", short: "אתה", owner: true },
];

const AVATAR_COLORS = ["sky", "mint", "pink", "butter", "coral", "lavender", "cream"];

const GROCERY_SECTIONS = [
  { id: "produce",   label: "ירקות ופירות", icon: "leaf",    color: "mint" },
  { id: "dairy",     label: "חלב וביצים",   icon: "drop",    color: "sky" },
  { id: "bakery",    label: "מאפים",        icon: "coffee",  color: "butter" },
  { id: "pantry",    label: "יבשים",        icon: "leaf",    color: "cream" },
  { id: "household", label: "לבית",         icon: "leaf",    color: "pink" },
];

Object.assign(window, { CATEGORIES, CAT, DEFAULT_PEOPLE, AVATAR_COLORS, GROCERY_SECTIONS });
