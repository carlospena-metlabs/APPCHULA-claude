-- Migration: 00013_add_monthly_closures_totals
-- Description: Add total_users_affected and total_yield_amount columns to monthly_closures
-- Created: 2026-01-12

-- ============================================
-- ADD MISSING COLUMNS TO MONTHLY CLOSURES
-- ============================================

ALTER TABLE monthly_closures
ADD COLUMN IF NOT EXISTS total_users_affected INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_yield_amount DECIMAL(15,2) NOT NULL DEFAULT 0;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN monthly_closures.total_users_affected IS 'Number of users who received yields in this closure';
COMMENT ON COLUMN monthly_closures.total_yield_amount IS 'Total amount of yields distributed in this closure';
