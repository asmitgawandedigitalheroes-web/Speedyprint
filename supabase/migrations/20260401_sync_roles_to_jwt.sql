-- JWT Custom Claims sync for Role
-- Syncs public.profiles.role to auth.users.raw_app_metadata.role

-- Create a function to handle role sync
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- We update the auth.users metadata with the new role
  -- Using jsonb_build_object to ensure the 'role' field is updated in existing app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on public.profiles
-- We use AFTER here because we want the profile change to be committed first
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_role_sync();

-- Backfill: sync existing roles to auth.users
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id;

COMMENT ON FUNCTION public.handle_profile_role_sync() IS 'Syncs user role to auth.users metadata for use in JWT claims.';
