-- ============================================================
-- 创建 avatars 存储桶 (用于又又照片等头像图片)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 任何人可读取
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- 已认证用户可上传
create policy "avatars_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 已认证用户可更新（覆盖）
create policy "avatars_auth_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 已认证用户可删除
create policy "avatars_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
