-- Run after removing archived objects and the avatars bucket through Storage API.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars')
     OR EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'avatars') THEN
    RAISE EXCEPTION 'Remove avatars through Storage API before dropping its policies';
  END IF;
END $$;

DROP POLICY avatars_auth_delete ON storage.objects;
DROP POLICY avatars_auth_insert ON storage.objects;
DROP POLICY avatars_auth_update ON storage.objects;
DROP POLICY avatars_public_read ON storage.objects;
