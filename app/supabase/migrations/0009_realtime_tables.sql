-- Enable Realtime for live pin and comment updates (issue #11)
ALTER PUBLICATION supabase_realtime ADD TABLE public.spot_networks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
