
-- Add unique constraint for upsert on broadcast_message_reads
ALTER TABLE public.broadcast_message_reads 
ADD CONSTRAINT broadcast_message_reads_message_user_unique 
UNIQUE (message_id, user_id);

-- Allow authenticated users to insert their own read records (for upsert)
CREATE POLICY "Users can insert own read status"
ON public.broadcast_message_reads
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
