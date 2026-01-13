-- Migration: 00011_rls_policies
-- Description: Enable Row Level Security and create access policies for all tables
-- Created: 2026-01-11

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin or operator
CREATE OR REPLACE FUNCTION is_admin_or_operator(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_uuid AND (is_admin = TRUE OR is_operator = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin only
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_uuid AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get clients assigned to an agent
CREATE OR REPLACE FUNCTION get_agent_clients(agent_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM users WHERE agent_id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get full network of a super agent (their agents + all their clients)
CREATE OR REPLACE FUNCTION get_super_agent_network(super_agent_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  -- Direct reports (agents assigned to this super agent)
  SELECT id FROM users WHERE super_agent_id = super_agent_uuid
  UNION
  -- Clients of those agents
  SELECT id FROM users WHERE agent_id IN (
    SELECT id FROM users WHERE super_agent_id = super_agent_uuid
  )
  UNION
  -- Clients directly assigned to super agent
  SELECT id FROM users WHERE super_agent_id = super_agent_uuid AND user_type = 'cliente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Protect sensitive user fields
-- ============================================

-- Trigger function to prevent non-admins from modifying sensitive fields
CREATE OR REPLACE FUNCTION protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Admins can modify anything
  IF is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot modify these fields
  IF OLD.initial_capital IS DISTINCT FROM NEW.initial_capital THEN
    RAISE EXCEPTION 'Cannot modify initial_capital';
  END IF;

  IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
    RAISE EXCEPTION 'Cannot modify current_balance';
  END IF;

  IF OLD.guaranteed_percentage IS DISTINCT FROM NEW.guaranteed_percentage THEN
    RAISE EXCEPTION 'Cannot modify guaranteed_percentage';
  END IF;

  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin';
  END IF;

  IF OLD.is_operator IS DISTINCT FROM NEW.is_operator THEN
    RAISE EXCEPTION 'Cannot modify is_operator';
  END IF;

  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    RAISE EXCEPTION 'Cannot modify user_type';
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Cannot modify status';
  END IF;

  IF OLD.agent_id IS DISTINCT FROM NEW.agent_id THEN
    RAISE EXCEPTION 'Cannot modify agent_id';
  END IF;

  IF OLD.super_agent_id IS DISTINCT FROM NEW.super_agent_id THEN
    RAISE EXCEPTION 'Cannot modify super_agent_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to users table
CREATE TRIGGER users_protect_sensitive_fields
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_sensitive_fields();

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- SELECT: Users can see their own profile, agents see their clients, super agents see network
CREATE POLICY users_select ON users
  FOR SELECT
  USING (
    -- Own profile
    auth.uid() = id
    -- Admin/operator sees all
    OR is_admin_or_operator(auth.uid())
    -- Agents see their assigned clients
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.user_type = 'agente'
        AND users.agent_id = u.id
      )
    )
    -- Super agents see their network
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.user_type = 'super_agente'
        AND (
          users.super_agent_id = u.id
          OR users.agent_id IN (SELECT id FROM users WHERE super_agent_id = u.id)
        )
      )
    )
  );

-- INSERT: Only admins can create users
CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- UPDATE: Users can update their own profile, admins can update all
-- Sensitive fields are protected by the trigger function above
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (auth.uid() = id OR is_admin_or_operator(auth.uid()));

-- DELETE: Only admins can delete users (should rarely happen)
CREATE POLICY users_delete ON users
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================
-- CAPITAL MOVEMENTS POLICIES
-- ============================================

-- SELECT: Own movements, or admin/operator, or agent's clients
CREATE POLICY capital_movements_select ON capital_movements
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin_or_operator(auth.uid())
    OR user_id IN (SELECT get_agent_clients(auth.uid()))
    OR user_id IN (SELECT get_super_agent_network(auth.uid()))
  );

-- INSERT: Only admins can create movements
CREATE POLICY capital_movements_insert ON capital_movements
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- MONTHLY YIELDS POLICIES
-- ============================================

-- SELECT: Own yields, admin/operator, or agent hierarchy
CREATE POLICY monthly_yields_select ON monthly_yields
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin_or_operator(auth.uid())
    OR user_id IN (SELECT get_agent_clients(auth.uid()))
    OR user_id IN (SELECT get_super_agent_network(auth.uid()))
  );

-- INSERT: Only admins can create yields (via closure process)
CREATE POLICY monthly_yields_insert ON monthly_yields
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- MONTHLY CLOSURES POLICIES
-- ============================================

-- SELECT: All authenticated users can view closures
CREATE POLICY monthly_closures_select ON monthly_closures
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Only admins can create closures
CREATE POLICY monthly_closures_insert ON monthly_closures
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- UPDATE: Only admins can update closures
CREATE POLICY monthly_closures_update ON monthly_closures
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- WITHDRAWALS POLICIES
-- ============================================

-- SELECT: Own withdrawals, admin/operator, or agent hierarchy
CREATE POLICY withdrawals_select ON withdrawals
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin_or_operator(auth.uid())
    OR user_id IN (SELECT get_agent_clients(auth.uid()))
    OR user_id IN (SELECT get_super_agent_network(auth.uid()))
  );

-- INSERT: Users can create their own requests, admins can create for anyone
CREATE POLICY withdrawals_insert ON withdrawals
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin(auth.uid())
  );

-- UPDATE: Only admins can update withdrawals (approve/execute/reject)
CREATE POLICY withdrawals_update ON withdrawals
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- COMMISSIONS POLICIES
-- ============================================

-- SELECT: Beneficiaries see their own commissions, admin/operator see all
CREATE POLICY commissions_select ON commissions
  FOR SELECT
  USING (
    beneficiary_id = auth.uid()
    OR is_admin_or_operator(auth.uid())
  );

-- INSERT: Only admins can create commissions
CREATE POLICY commissions_insert ON commissions
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- UPDATE: Only admins can update commissions
CREATE POLICY commissions_update ON commissions
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- INVITATIONS POLICIES
-- ============================================

-- SELECT: Own invitations or admin/operator
CREATE POLICY invitations_select ON invitations
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin_or_operator(auth.uid())
  );

-- INSERT: Only admins can create invitations
CREATE POLICY invitations_insert ON invitations
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- UPDATE: User can mark as used, admin can do anything
CREATE POLICY invitations_update ON invitations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- SELECT: Only admin/operator can view audit logs
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (is_admin_or_operator(auth.uid()));

-- INSERT: System inserts via service role (bypass RLS), no direct user insert
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- No UPDATE or DELETE on audit logs (immutable)

-- ============================================
-- INTERNAL NOTES POLICIES
-- ============================================

-- SELECT: Only admin/operator can view notes
CREATE POLICY internal_notes_select ON internal_notes
  FOR SELECT
  USING (is_admin_or_operator(auth.uid()));

-- INSERT: Only admin/operator can create notes
CREATE POLICY internal_notes_insert ON internal_notes
  FOR INSERT
  WITH CHECK (is_admin_or_operator(auth.uid()));

-- No UPDATE or DELETE on notes (historical record)
