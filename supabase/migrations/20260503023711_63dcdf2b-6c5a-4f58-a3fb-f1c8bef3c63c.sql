
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
       SET unread_admin_count = 0
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_admin_unread ON public.chat_messages;
CREATE TRIGGER trg_bump_admin_unread
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_admin_unread();

-- Backfill current unread counts
UPDATE public.chat_conversations c
SET unread_admin_count = COALESCE((
  SELECT COUNT(*) FROM public.chat_messages m
  WHERE m.conversation_id = c.id
    AND m.message_type = 'user'
    AND m.created_at > COALESCE((
      SELECT MAX(m2.created_at) FROM public.chat_messages m2
      WHERE m2.conversation_id = c.id AND m2.message_type = 'admin'
    ), '1970-01-01'::timestamptz)
), 0);
