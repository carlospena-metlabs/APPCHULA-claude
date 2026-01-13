-- Migration: 00003_create_capital_movements
-- Description: Create capital_movements table for tracking all capital changes
-- Created: 2026-01-11

-- ============================================
-- CAPITAL MOVEMENTS TABLE
-- ============================================

CREATE TABLE capital_movements (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Movement details
  type TEXT NOT NULL CHECK (type IN (
    'deposito_inicial',
    'incremento',
    'retiro',
    'comision_entrada',
    'comision_salida'
  )),
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,

  -- Tracking
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_movement_amount CHECK (amount > 0),
  CONSTRAINT non_negative_balances CHECK (balance_before >= 0 AND balance_after >= 0)
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_capital_movements_user_id ON capital_movements(user_id);
CREATE INDEX idx_capital_movements_type ON capital_movements(type);
CREATE INDEX idx_capital_movements_created_at ON capital_movements(created_at);
CREATE INDEX idx_capital_movements_executed_by ON capital_movements(executed_by);

-- Composite index for user history queries
CREATE INDEX idx_capital_movements_user_created ON capital_movements(user_id, created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE capital_movements IS 'Tracks all capital changes for users (deposits, withdrawals, commissions)';
COMMENT ON COLUMN capital_movements.type IS 'Type of movement: deposito_inicial, incremento, retiro, comision_entrada, comision_salida';
COMMENT ON COLUMN capital_movements.amount IS 'Absolute amount of the movement (always positive)';
COMMENT ON COLUMN capital_movements.balance_before IS 'User balance before this movement';
COMMENT ON COLUMN capital_movements.balance_after IS 'User balance after this movement';
COMMENT ON COLUMN capital_movements.executed_by IS 'Admin/operator who executed this movement';
