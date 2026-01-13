-- Migration: 00009_create_audit_logs
-- Description: Create audit_logs table for complete audit trail
-- Created: 2026-01-11

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE audit_logs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who performed the action (NULL for system actions)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  -- Change tracking (JSONB for flexibility)
  old_values JSONB,
  new_values JSONB,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite index for entity history
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);

-- GIN indexes for JSONB queries
CREATE INDEX idx_audit_logs_old_values ON audit_logs USING GIN(old_values);
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING GIN(new_values);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all financial and administrative operations';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system/automated actions)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: INSERT, UPDATE, DELETE, or custom action names';
COMMENT ON COLUMN audit_logs.entity_type IS 'Table/entity name affected';
COMMENT ON COLUMN audit_logs.entity_id IS 'Primary key of affected entity';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values (for UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values (for INSERT/UPDATE)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address if available';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent if available';
