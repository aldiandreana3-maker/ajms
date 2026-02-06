-- Create agent_gallery table for storing agent property images
CREATE TABLE public.agent_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_gallery ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can view gallery)
CREATE POLICY "Gallery images are viewable by everyone" 
ON public.agent_gallery 
FOR SELECT 
USING (true);

-- Only super_admin can manage gallery (fix argument order: user_id first, role second)
CREATE POLICY "Super admin can insert gallery images" 
ON public.agent_gallery 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can update gallery images" 
ON public.agent_gallery 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can delete gallery images" 
ON public.agent_gallery 
FOR DELETE 
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_agent_gallery_updated_at
BEFORE UPDATE ON public.agent_gallery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for agent gallery images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-gallery', 'agent-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agent gallery bucket
CREATE POLICY "Agent gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-gallery');

CREATE POLICY "Super admin can upload agent gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-gallery' AND public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can update agent gallery images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agent-gallery' AND public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can delete agent gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-gallery' AND public.has_role(auth.uid(), 'super_admin'::app_role));