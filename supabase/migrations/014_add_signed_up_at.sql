-- Add signed_up_at timestamp to profiles
-- NULL means the partner has been approved but has not yet created their PIN.
-- Non-NULL means they completed signup; the value is the exact moment they did so.
ALTER TABLE public.profiles
  ADD COLUMN signed_up_at timestamptz DEFAULT NULL;
