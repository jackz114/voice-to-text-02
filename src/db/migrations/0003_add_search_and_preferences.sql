-- Migration: 0003_add_search_and_preferences
-- Phase 3: Retention Engine - Search and Notifications

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add search_vector column with generated tsvector
ALTER TABLE knowledge_items
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('chinese', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('chinese', coalesce(array_to_string(tags, ' '), '')), 'A') ||
  setweight(to_tsvector('chinese', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('chinese', coalesce(source, '')), 'C')
) STORED;

-- Step 3: Add embedding column for Phase 4
ALTER TABLE knowledge_items
ADD COLUMN embedding vector(1536);

-- Step 4: Create GIN index for full-text search
CREATE INDEX knowledge_items_search_idx ON knowledge_items USING GIN(search_vector);

-- Step 5: Create HNSW index for vector similarity (Phase 4)
CREATE INDEX knowledge_items_embedding_idx ON knowledge_items
USING hnsw(embedding vector_cosine_ops);

-- Step 6: Create user_preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  daily_reminder_time text NOT NULL DEFAULT '09:00',
  reminder_timezone text NOT NULL DEFAULT 'Asia/Shanghai',
  included_domains text[] NOT NULL DEFAULT '{}',
  save_search_history boolean NOT NULL DEFAULT true,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 7: Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policy for user_preferences
CREATE POLICY "Users can only access their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 9: Trigger to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Step 11: Backfill preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Step 12: Update existing rows to populate search_vector (force recalculation)
UPDATE knowledge_items SET title = title WHERE search_vector IS NULL;
