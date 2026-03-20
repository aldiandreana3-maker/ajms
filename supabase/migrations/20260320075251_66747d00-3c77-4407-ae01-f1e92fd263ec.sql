
-- Broadcast messages table
CREATE TABLE public.broadcast_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Message read status table
CREATE TABLE public.broadcast_message_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_message_reads ENABLE ROW LEVEL SECURITY;

-- Policies for broadcast_messages
CREATE POLICY "Admin can insert broadcast messages"
ON public.broadcast_messages FOR INSERT
WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Admin can delete broadcast messages"
ON public.broadcast_messages FOR DELETE
USING (is_admin_or_above(auth.uid()));

CREATE POLICY "Authenticated users can view broadcast messages"
ON public.broadcast_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policies for broadcast_message_reads
CREATE POLICY "Admin can insert read records"
ON public.broadcast_message_reads FOR INSERT
WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Users can view own read status"
ON public.broadcast_message_reads FOR SELECT
USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Users can update own read status"
ON public.broadcast_message_reads FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Index for performance
CREATE INDEX idx_broadcast_reads_user ON public.broadcast_message_reads(user_id, is_read);
CREATE INDEX idx_broadcast_reads_message ON public.broadcast_message_reads(message_id);
