ALTER TABLE public.broadcast_message_reads REPLICA IDENTITY FULL;
ALTER TABLE public.bills REPLICA IDENTITY FULL;
ALTER TABLE public.keluhan REPLICA IDENTITY FULL;
ALTER TABLE public.work_permits REPLICA IDENTITY FULL;
ALTER TABLE public.field_inspections REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.keluhan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_permits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_inspections;