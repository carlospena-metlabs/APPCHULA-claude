-- Migration: 00010_create_internal_notes
-- Description: Create internal_notes table for admin notes on users
-- Created: 2026-01-11

-- ============================================
-- INTERNAL NOTES TABLE
-- ============================================

CREATE TABLE internal_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User this note is about
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Note content
  content TEXT NOT NULL,

  -- Admin/operator who created the note
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query indexes
CREATE INDEX idx_internal_notes_user_id ON internal_notes(user_id);
CREATE INDEX idx_internal_notes_created_by ON internal_notes(created_by);
CREATE INDEX idx_internal_notes_created_at ON internal_notes(created_at);

-- Composite index for user notes history
CREATE INDEX idx_internal_notes_user_history ON internal_notes(user_id, created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE internal_notes IS 'Internal admin/operator notes about users (not visible to users)';
COMMENT ON COLUMN internal_notes.user_id IS 'User this note is about';
COMMENT ON COLUMN internal_notes.content IS 'Note content (text)';
COMMENT ON COLUMN internal_notes.created_by IS 'Admin/operator who created the note';
