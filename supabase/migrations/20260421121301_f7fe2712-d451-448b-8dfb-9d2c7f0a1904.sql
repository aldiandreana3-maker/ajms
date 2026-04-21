-- Conversations
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'auto_reply',
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_admin_count INTEGER NOT NULL DEFAULT 0,
  unread_user_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conv_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conv_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_conv_last ON public.chat_conversations(last_message_at DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversation"
  ON public.chat_conversations FOR SELECT
  USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Users create own conversation"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own conversation"
  ON public.chat_conversations FOR UPDATE
  USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Admin delete conversation"
  ON public.chat_conversations FOR DELETE
  USING (is_admin_or_above(auth.uid()));

-- Messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages of accessible conversations"
  ON public.chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations
      WHERE user_id = auth.uid() OR is_admin_or_above(auth.uid())
    )
  );

CREATE POLICY "Insert messages in accessible conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.chat_conversations
      WHERE user_id = auth.uid() OR is_admin_or_above(auth.uid())
    )
  );

CREATE POLICY "Update own/admin messages"
  ON public.chat_messages FOR UPDATE
  USING (
    sender_id = auth.uid() OR is_admin_or_above(auth.uid())
    OR conversation_id IN (SELECT id FROM public.chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin delete messages"
  ON public.chat_messages FOR DELETE
  USING (is_admin_or_above(auth.uid()));

-- Knowledge Base
CREATE TABLE public.chat_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated view active KB"
  ON public.chat_knowledge_base FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_active OR is_admin_or_above(auth.uid())));

CREATE POLICY "Admin manage KB"
  ON public.chat_knowledge_base FOR ALL
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

-- Triggers updated_at
CREATE TRIGGER chat_conv_updated BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER chat_kb_updated BEFORE UPDATE ON public.chat_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;