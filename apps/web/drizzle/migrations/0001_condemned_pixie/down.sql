-- Down migration for: 0001_condemned_pixie (User Creation Trigger)
-- Generated: 2024-10-03
--
-- This file reverses the user creation trigger setup
-- Review carefully before executing in production
-- ==========================================
-- REVERSE TRIGGER OPERATIONS
-- ==========================================
-- Reverse: CREATE TRIGGER on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ==========================================
-- REVERSE FUNCTION OPERATIONS
-- ==========================================
-- Reverse: CREATE FUNCTION public.handle_new_user()
DROP FUNCTION IF EXISTS public.handle_new_user ();
