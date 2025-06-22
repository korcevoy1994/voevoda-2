-- This script grants explicit SELECT (read) permissions to the public-facing
-- 'anon' role. While RLS policies define *which rows* can be accessed,
-- these GRANT statements provide the fundamental ability to read from the tables at all.
-- This is a crucial step for making data publicly available.

GRANT SELECT ON TABLE public.events TO anon;
GRANT SELECT ON TABLE public.performers TO anon;
GRANT SELECT ON TABLE public.zones TO anon;
GRANT SELECT ON TABLE public.seats TO anon; 