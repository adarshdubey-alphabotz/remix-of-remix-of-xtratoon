-- Ensure exactly one profile row per user
WITH duplicate_profiles AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.profiles
)
DELETE FROM public.profiles p
USING duplicate_profiles d
WHERE p.id = d.id
  AND d.rn > 1;

-- Ensure duplicate usernames are cleared before adding unique index
WITH duplicate_usernames AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY lower(username) ORDER BY created_at ASC, id ASC) AS rn
  FROM public.profiles
  WHERE username IS NOT NULL
)
UPDATE public.profiles p
SET username = NULL
FROM duplicate_usernames d
WHERE p.id = d.id
  AND d.rn > 1;

-- One profile per user
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_idx
  ON public.profiles (user_id);

-- Username must be globally unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Allow users to set their own initial role rows (reader/publisher)
CREATE POLICY "Users can insert own reader/publisher role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('reader'::public.app_role, 'publisher'::public.app_role)
);

-- Allow users to remove their own non-admin roles (for role switching safety)
CREATE POLICY "Users can delete own non-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND role <> 'admin'::public.app_role
);

-- Strengthen/normalize creator search (supports legacy creator text too)
CREATE OR REPLACE FUNCTION public.search_creators(search_term text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $function$
  SELECT p.*
  FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND (
      p.role_type IN ('publisher', 'creator')
      OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role = 'publisher'::public.app_role
      )
    )
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR COALESCE(p.display_name, '') ILIKE '%' || search_term || '%'
    )
  ORDER BY p.username
  LIMIT 20;
$function$;