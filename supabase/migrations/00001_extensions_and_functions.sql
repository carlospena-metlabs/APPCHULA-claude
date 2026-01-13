-- Migration: 00001_extensions_and_functions
-- Description: Enable required PostgreSQL extensions and create utility functions
-- Created: 2026-01-11

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure random tokens (for invitations)
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(length), 'hex');
END;
$$ LANGUAGE plpgsql;
