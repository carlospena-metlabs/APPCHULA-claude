-- Migration: 00012_create_audit_triggers
-- Description: Create automatic audit logging triggers for financial tables
-- Created: 2026-01-11

-- ============================================
-- AUDIT TRIGGER FUNCTION
-- ============================================

-- Generic function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  current_user_id UUID;
BEGIN
  -- Get current user from Supabase auth context
  current_user_id := auth.uid();

  -- Prepare data based on operation type
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    current_user_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APPLY TRIGGERS TO FINANCIAL TABLES
-- ============================================

-- Users table audit trigger
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Capital movements audit trigger
CREATE TRIGGER audit_capital_movements
  AFTER INSERT OR UPDATE OR DELETE ON capital_movements
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Monthly yields audit trigger
CREATE TRIGGER audit_monthly_yields
  AFTER INSERT OR UPDATE OR DELETE ON monthly_yields
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Monthly closures audit trigger
CREATE TRIGGER audit_monthly_closures
  AFTER INSERT OR UPDATE OR DELETE ON monthly_closures
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Withdrawals audit trigger
CREATE TRIGGER audit_withdrawals
  AFTER INSERT OR UPDATE OR DELETE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Commissions audit trigger
CREATE TRIGGER audit_commissions
  AFTER INSERT OR UPDATE OR DELETE ON commissions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION create_audit_log() IS 'Generic audit trigger function for automatic change logging';
