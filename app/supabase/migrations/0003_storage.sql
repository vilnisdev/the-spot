insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  20971520, -- 20MB (audio max; image max enforced at app layer)
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/mp4']
);
