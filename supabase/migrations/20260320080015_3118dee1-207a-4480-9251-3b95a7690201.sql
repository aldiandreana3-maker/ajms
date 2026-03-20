
-- Add target columns to broadcast_messages
ALTER TABLE public.broadcast_messages
  ADD COLUMN target_type text NOT NULL DEFAULT 'all',
  ADD COLUMN target_value text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.broadcast_messages.target_type IS 'all, tower, unit, custom';
COMMENT ON COLUMN public.broadcast_messages.target_value IS 'Tower names, unit numbers, or user_ids depending on target_type';
