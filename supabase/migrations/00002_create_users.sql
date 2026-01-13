-- Migration: 00002_create_users
-- Description: Create the users table with all fields for clients, agents, and super agents
-- Created: 2026-01-11

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,

  -- User classification
  user_type TEXT NOT NULL CHECK (user_type IN ('cliente', 'agente', 'super_agente')),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'no_verificado', 'bloqueado')),

  -- Commercial relationships (self-references)
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  super_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Operational roles (independent of user_type)
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_operator BOOLEAN NOT NULL DEFAULT FALSE,

  -- KYC fields (preparation for future Sumsub integration)
  kyc_status TEXT DEFAULT 'pending',
  kyc_provider TEXT,
  kyc_verified_at TIMESTAMPTZ,

  -- Financial data
  initial_capital DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  guaranteed_percentage DECIMAL(5,2) CHECK (
    guaranteed_percentage IS NULL
    OR guaranteed_percentage IN (2.5, 3.25, 4.25, 5.0)
  ),
  yield_start_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT positive_capital CHECK (initial_capital >= 0),
  CONSTRAINT positive_balance CHECK (current_balance >= 0)
);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- INDEXES
-- ============================================

-- Filter indexes
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

-- Relationship indexes
CREATE INDEX idx_users_agent_id ON users(agent_id);
CREATE INDEX idx_users_super_agent_id ON users(super_agent_id);

-- Lookup indexes
CREATE INDEX idx_users_email ON users(email);

-- Partial indexes for role checks
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX idx_users_is_operator ON users(is_operator) WHERE is_operator = TRUE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Core user table for clients, agents, and super agents';
COMMENT ON COLUMN users.user_type IS 'User classification: cliente, agente, or super_agente';
COMMENT ON COLUMN users.status IS 'Account status: activo, no_verificado, or bloqueado';
COMMENT ON COLUMN users.agent_id IS 'Reference to assigned agent (for clients)';
COMMENT ON COLUMN users.super_agent_id IS 'Reference to super agent (for agents or direct clients)';
COMMENT ON COLUMN users.is_admin IS 'Admin role - full backoffice access';
COMMENT ON COLUMN users.is_operator IS 'Operator role - limited backoffice access';
COMMENT ON COLUMN users.guaranteed_percentage IS 'Guaranteed minimum yield percentage: 2.5, 3.25, 4.25, or 5.0';
COMMENT ON COLUMN users.yield_start_date IS 'Date from which yields start being calculated';
