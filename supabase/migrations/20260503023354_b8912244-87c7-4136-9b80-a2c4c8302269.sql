
-- 1. Merge duplicate chat conversations per user (keep oldest, move messages, delete others)
DO $$
DECLARE
  rec RECORD;
  keep_id UUID;
BEGIN
  FOR rec IN
    SELECT user_id FROM chat_conversations GROUP BY user_id HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id FROM chat_conversations
      WHERE user_id = rec.user_id
      ORDER BY created_at ASC
      LIMIT 1;
    UPDATE chat_messages SET conversation_id = keep_id
      WHERE conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = rec.user_id AND id <> keep_id
      );
    -- update aggregated stats from latest message
    UPDATE chat_conversations c SET
      last_message = m.content,
      last_message_at = m.created_at,
      unread_admin_count = COALESCE((
        SELECT COUNT(*) FROM chat_messages
        WHERE conversation_id = keep_id AND message_type = 'user' AND is_read = false
      ), 0)
    FROM (
      SELECT content, created_at FROM chat_messages
      WHERE conversation_id = keep_id ORDER BY created_at DESC LIMIT 1
    ) m
    WHERE c.id = keep_id;

    DELETE FROM chat_conversations
      WHERE user_id = rec.user_id AND id <> keep_id;
  END LOOP;
END $$;

-- 2. Enforce one conversation per user
CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_user_id_unique
  ON chat_conversations(user_id);

-- 3. Add staff_building_service role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staff_building_service' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'staff_building_service';
  END IF;
END $$;
