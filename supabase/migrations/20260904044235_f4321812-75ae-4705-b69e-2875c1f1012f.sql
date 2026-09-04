INSERT INTO public.user_roles (user_id, role)
VALUES ('a97ee566-6b89-4b90-9204-a1768e19972d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;