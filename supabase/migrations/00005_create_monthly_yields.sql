-- Migration: 00005_create_monthly_yields
-- Description: Create monthly_yields table for storing individual user yield records
-- Created: 2026-01-11

-- ============================================
-- MONTHLY YIELDS TABLE
-- ============================================

CREATE TABLE monthly_yields (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Period identification
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Yield calculation details
  percentage_applied DECIMAL(5,2) NOT NULL CHECK (percentage_applied >= 0),
  yield_amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,

  -- Proportional yield flag (for users who joined mid-month)
  is_proportional BOOLEAN NOT NULL DEFAULT FALSE,

  -- Tracking
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one yield record per user per month
  UNIQUE(user_id, year, month),

  -- Validate yield calculation
  CONSTRAINT valid_yield_calculation CHECK (
    balance_after = balance_before + yield_amount
  ),
  CONSTRAINT non_negative_yield_balances CHECK (
    balance_before >= 0 AND balance_after >= 0
  )
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_monthly_yields_user_id ON monthly_yields(user_id);
CREATE INDEX idx_monthly_yields_year_month ON monthly_yields(year, month);
CREATE INDEX idx_monthly_yields_created_at ON monthly_yields(created_at);
CREATE INDEX idx_monthly_yields_executed_by ON monthly_yields(executed_by);

-- Composite index for user history queries
CREATE INDEX idx_monthly_yields_user_period ON monthly_yields(user_id, year DESC, month DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE monthly_yields IS 'Stores individual yield records for each user per month';
COMMENT ON COLUMN monthly_yields.percentage_applied IS 'Actual percentage applied (may differ from closure percentage for guaranteed users)';
COMMENT ON COLUMN monthly_yields.yield_amount IS 'Calculated yield amount added to balance';
COMMENT ON COLUMN monthly_yields.is_proportional IS 'TRUE if yield was prorated for partial month';
COMMENT ON COLUMN monthly_yields.executed_by IS 'Admin who executed the closure that created this record';
