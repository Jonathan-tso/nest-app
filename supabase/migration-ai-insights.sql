-- AI Insights: household-scoped cards surfaced on the home screen.
-- Rows are written by a backend process (cron, edge function, etc.).
-- The app only reads them.

CREATE TABLE IF NOT EXISTS ai_insights (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        text NOT NULL,
  body         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz
);

CREATE INDEX IF NOT EXISTS ai_insights_household_created
  ON ai_insights (household_id, created_at DESC);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Household members can read their own insights
CREATE POLICY "household members can read ai_insights"
  ON ai_insights FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
  );
