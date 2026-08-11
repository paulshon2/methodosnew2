-- MethodOS profiles (Clerk user id = profiles.id)
create table if not exists public.profiles (
  id               text primary key,
  email            text,
  name             text,
  image_url        text,
  plan             text not null default 'free',
  role             text not null default 'student',
  approval_status  text not null default 'pending'
                     check (approval_status in ('pending','approved','rejected')),
  is_special_member boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_approval_idx on public.profiles(approval_status);

create table if not exists public.user_permission_overrides (
  user_id text not null references public.profiles(id) on delete cascade,
  permission_code text not null,
  allowed boolean,
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_code)
);
