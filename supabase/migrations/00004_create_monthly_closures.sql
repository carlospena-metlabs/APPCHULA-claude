-- Migration: 00004_create_monthly_closures
-- Description: Create monthly_closures table for tracking monthly yield closure processes
-- Created: 2026-01-11

-- ============================================
-- MONTHLY CLOSURES TABLE
-- ============================================

CREATE TABLE monthly_closures (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Period identification
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Yield percentage for this month
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'executed')),

  -- Execution tracking
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one closure per month
  UNIQUE(year, month)
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_monthly_closures_year_month ON monthly_closures(year, month);
CREATE INDEX idx_monthly_closures_status ON monthly_closures(status);
CREATE INDEX idx_monthly_closures_executed_by ON monthly_closures(executed_by);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE monthly_closures IS 'Tracks monthly yield closure processes';
COMMENT ON COLUMN monthly_closures.percentage IS 'Yield percentage applied for this month';
COMMENT ON COLUMN monthly_closures.status IS 'Closure status: draft (can be modified) or executed (finalized)';
COMMENT ON COLUMN monthly_closures.executed_by IS 'Admin who executed the closure';
COMMENT ON COLUMN monthly_closures.executed_at IS 'Timestamp when closure was executed';
