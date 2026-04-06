-- =============================================================
-- Seed data for local development
-- Runs on `supabase db reset` (after all migrations)
-- =============================================================

-- Create anonymous auth users for testing
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, created_at, updated_at, is_anonymous)
values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '{"provider": "anonymous", "providers": ["anonymous"]}', now(), now(), true),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '{"provider": "anonymous", "providers": ["anonymous"]}', now(), now(), true),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '{"provider": "anonymous", "providers": ["anonymous"]}', now(), now(), true);

-- Create identities (required for anonymous auth to work)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
values
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{}', 'anonymous', now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '{}', 'anonymous', now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '{}', 'anonymous', now(), now());

-- =============================================================
-- Group: Fredagsmys
-- =============================================================
insert into groups (id, name, currency, invite_token, created_by)
values ('11111111-0000-0000-0000-000000000001', 'Fredagsmys', 'SEK', 'fredagsmys-token', 'a1111111-1111-1111-1111-111111111111');

insert into group_members (id, group_id, guest_name, user_id)
values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Arvid', 'a1111111-1111-1111-1111-111111111111'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Johan',   'a2222222-2222-2222-2222-222222222222'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Saga', 'a3333333-3333-3333-3333-333333333333');

insert into expenses (id, group_id, paid_by, amount, description, split_among)
values ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000001', 300.00, 'Järnrör',
  array['22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003']::uuid[]);

insert into expenses (id, group_id, paid_by, amount, description, split_among)
values ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000002', 15000.00, 'Metamfetamin',
  array['22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003']::uuid[]);

insert into expenses (id, group_id, paid_by, amount, description, split_among)
values ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000003', 9000.00, 'Glock-18',
  array['22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003']::uuid[]);

-- =============================================================
-- Group: Lunch Club
-- =============================================================
insert into groups (id, name, currency, invite_token, created_by)
values ('11111111-0000-0000-0000-000000000002', 'Lunch Club', 'EUR', 'lunch-club-token', 'a1111111-1111-1111-1111-111111111111');

insert into group_members (id, group_id, guest_name, user_id)
values
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Arvid', 'a1111111-1111-1111-1111-111111111111'),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'Johan',   'a2222222-2222-2222-2222-222222222222');
