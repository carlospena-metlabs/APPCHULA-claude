-- Migration: 00006_create_withdrawals
-- Description: Create withdrawals table for managing withdrawal requests
-- Created: 2026-01-11

-- ============================================
-- WITHDRAWALS TABLE
-- ============================================

CREATE TABLE withdrawals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Withdrawal details
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('parcial', 'total')),
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN (
    'solicitado',
    'aprobado',
    'ejecutado',
    'rechazado'
  )),

  -- Withdrawal window (quarterly dates: Mar 31, Jun 30, Sep 30, Dec 31)
  withdrawal_window DATE NOT NULL,

  -- Request tracking
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Approval tracking
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Execution tracking
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Rejection tracking
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Notes (reasons, comments)
  notes TEXT,

  -- Validate withdrawal window is a valid quarterly date
  CONSTRAINT valid_withdrawal_window CHECK (
    (EXTRACT(MONTH FROM withdrawal_window) = 3 AND EXTRACT(DAY FROM withdrawal_window) = 31) OR
    (EXTRACT(MONTH FROM withdrawal_window) = 6 AND EXTRACT(DAY FROM withdrawal_window) = 30) OR
    (EXTRACT(MONTH FROM withdrawal_window) = 9 AND EXTRACT(DAY FROM withdrawal_window) = 30) OR
    (EXTRACT(MONTH FROM withdrawal_window) = 12 AND EXTRACT(DAY FROM withdrawal_window) = 31)
  )
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_withdrawal_window ON withdrawals(withdrawal_window);
CREATE INDEX idx_withdrawals_requested_at ON withdrawals(requested_at);

-- Admin workflow indexes
CREATE INDEX idx_withdrawals_approved_by ON withdrawals(approved_by);
CREATE INDEX idx_withdrawals_executed_by ON withdrawals(executed_by);

-- Composite index for pending withdrawals per window
CREATE INDEX idx_withdrawals_window_status ON withdrawals(withdrawal_window, status);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE withdrawals IS 'Manages withdrawal requests with quarterly window restrictions';
COMMENT ON COLUMN withdrawals.type IS 'Withdrawal type: parcial (partial) or total (full exit)';
COMMENT ON COLUMN withdrawals.status IS 'Request status: solicitado, aprobado, ejecutado, rechazado';
COMMENT ON COLUMN withdrawals.withdrawal_window IS 'Target quarterly window date (Mar 31, Jun 30, Sep 30, Dec 31)';
COMMENT ON COLUMN withdrawals.notes IS 'Admin notes or rejection reasons';
