-- These policies allow public, anonymous users to read data from the
-- 'events' and 'performers' tables. This is necessary for the main page
-- to display event information without requiring a user to be logged in.

-- 1. Create policy for `events` table
DROP POLICY IF EXISTS "Allow public read access for events" ON public.events;
CREATE POLICY "Allow public read access for events"
ON public.events
FOR SELECT
USING (true);

-- 2. Create policy for `performers` table
DROP POLICY IF EXISTS "Allow public read access for performers" ON public.performers;
CREATE POLICY "Allow public read access for performers"
ON public.performers
FOR SELECT
USING (true); 