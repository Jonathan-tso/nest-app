-- Allow household members to insert AI insights (needed for client-side generation)
CREATE POLICY "household members can insert ai_insights" ON ai_insights
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE profile_id = auth.uid()
    )
  );
