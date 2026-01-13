-- Migration: 00008_create_invitations
-- Description: Create invitations table for user activation tokens
-- Created: 2026-01-11

-- ============================================
-- INVITATIONS TABLE
-- ============================================

CREATE TABLE invitations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user being invited
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token for activation link
  token TEXT UNIQUE NOT NULL,

  -- Expiration (default 24 hours from creation)
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage tracking
  used_at TIMESTAMPTZ,

  -- Admin who created the invitation
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validate expiration is in the future at creation time
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_invitations_user_id ON invitations(user_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_invitations_created_by ON invitations(created_by);

-- Active invitations index (not used and not expired)
CREATE INDEX idx_invitations_active ON invitations(expires_at)
  WHERE used_at IS NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE invitations IS 'Stores user activation tokens for invitation-only registration';
COMMENT ON COLUMN invitations.token IS 'Secure random token for activation URL';
COMMENT ON COLUMN invitations.expires_at IS 'Token expiration timestamp (24h default)';
COMMENT ON COLUMN invitations.used_at IS 'Timestamp when token was used (NULL if unused)';
COMMENT ON COLUMN invitations.created_by IS 'Admin who created/sent the invitation';
