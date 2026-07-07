-- Migration 008: Safely drop the `time` column if it still exists
ALTER TABLE events DROP COLUMN IF EXISTS time;
