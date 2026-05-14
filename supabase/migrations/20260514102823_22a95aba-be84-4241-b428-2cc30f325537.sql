CREATE OR REPLACE FUNCTION public.bump_admin_unread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.message_type = 'user' THEN
    UPDATE public.chat_conversations
       SET unread_admin_count = COALESCE(unread_admin_count, 0) + 1,
           last_message = NEW.content,
           last_message_at = NEW.created_at,
           status = CASE WHEN status = 'dibalas_admin' THEN 'menunggu_admin' ELSE status END
     WHERE id = NEW.conversation_id;
  ELSIF NEW.message_type = 'admin' THEN
    UPDATE public.chat_conversations
       SET unread_admin_count = 0,
           status = 'dibalas_admin',
           last_message = NEW.content,
           last_message_at = NEW.created_at
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill: tandai semua conversation yang sudah ada balasan admin terakhir sebagai 'dibalas_admin' dan reset unread
UPDATE public.chat_conversations c
SET status = 'dibalas_admin', unread_admin_count = 0
WHERE EXISTS (
  SELECT 1 FROM public.chat_messages m
  WHERE m.conversation_id = c.id
    AND m.message_type = 'admin'
    AND m.created_at = (
      SELECT MAX(created_at) FROM public.chat_messages
      WHERE conversation_id = c.id
    )
);