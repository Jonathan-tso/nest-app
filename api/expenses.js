import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    return handlePost(req, res);
  }
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  res.status(405).json({ error: "Method not allowed" });
}

async function handlePost(req, res) {
  const { description, amount, currency, date } = req.body || {};

  if (!description || amount == null) {
    return res.status(400).json({ error: "description and amount are required" });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).json({ error: "amount must be a number" });
  }

  const { data, error } = await supabase
    .from("api_expenses")
    .insert({
      description: String(description),
      amount: parsedAmount,
      currency: currency || "ILS",
      date: date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
}

async function handleGet(req, res) {
  const { month, year } = req.query;

  let query = supabase
    .from("api_expenses")
    .select("*")
    .order("date", { ascending: false });

  if (month && year) {
    const m = String(month).padStart(2, "0");
    const y = String(year);
    query = query
      .gte("date", `${y}-${m}-01`)
      .lte("date", `${y}-${m}-31`);
  } else if (year) {
    query = query
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
  } else if (month) {
    const y = new Date().getFullYear();
    const m = String(month).padStart(2, "0");
    query = query
      .gte("date", `${y}-${m}-01`)
      .lte("date", `${y}-${m}-31`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
