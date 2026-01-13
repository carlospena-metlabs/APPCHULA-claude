-- Migration: 00007_create_commissions
-- Description: Create commissions table for tracking agent and super agent commissions
-- Created: 2026-01-11

-- ============================================
-- COMMISSIONS TABLE
-- ============================================

CREATE TABLE commissions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Commission recipient (agent or super agent)
  beneficiary_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Source client generating the commission
  source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Period identification
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Commission calculation
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  base_amount DECIMAL(15,2) NOT NULL CHECK (base_amount >= 0),
  commission_amount DECIMAL(15,2) NOT NULL CHECK (commission_amount >= 0),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'acreditada')),
  credited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent self-commissions
  CONSTRAINT no_self_commission CHECK (beneficiary_id != source_user_id),

  -- Validate commission calculation
  CONSTRAINT valid_commission_calculation CHECK (
    commission_amount = ROUND((base_amount * percentage / 100), 2)
  )
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_commissions_beneficiary_id ON commissions(beneficiary_id);
CREATE INDEX idx_commissions_source_user_id ON commissions(source_user_id);
CREATE INDEX idx_commissions_year_month ON commissions(year, month);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Composite index for agent commission queries
CREATE INDEX idx_commissions_beneficiary_period ON commissions(beneficiary_id, year DESC, month DESC);

-- Pending commissions index
CREATE INDEX idx_commissions_pending ON commissions(status) WHERE status = 'pendiente';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE commissions IS 'Tracks commissions for agents and super agents based on client balances';
COMMENT ON COLUMN commissions.beneficiary_id IS 'Agent or super agent receiving the commission';
COMMENT ON COLUMN commissions.source_user_id IS 'Client whose balance generates the commission';
COMMENT ON COLUMN commissions.percentage IS 'Commission percentage applied';
COMMENT ON COLUMN commissions.base_amount IS 'Client balance used as commission base';
COMMENT ON COLUMN commissions.commission_amount IS 'Calculated commission amount';
COMMENT ON COLUMN commissions.status IS 'Commission status: pendiente or acreditada';
