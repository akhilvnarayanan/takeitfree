-- Enable extensions
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  phone text,
  reputation_points int not null default 0,
  created_at timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  image_url text,
  location text,
  status text not null default 'available' check (status in ('available','reserved','completed')),
  created_at timestamptz not null default now()
);

-- Requests
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  message text,
  created_at timestamptz not null default now(),
  unique(post_id, requester_id)
);

-- Chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Stories and highlights
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  caption text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.highlight_stories (
  highlight_id uuid references public.highlights(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  primary key (highlight_id, story_id)
);

-- Badges
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text
);

create table if not exists public.profile_badges (
  profile_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key(profile_id, badge_id)
);

-- Community challenges
create table if not exists public.community_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.community_challenges(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null,
  updated_at timestamptz not null default now()
);

-- Trigger: secure "no selling" check at DB layer
create or replace function public.ensure_free_post()
returns trigger
language plpgsql
as $$
begin
  if new.title ~* '(sell|\\$[0-9]+|price|paypal|venmo|cash)'
     or new.description ~* '(sell|\\$[0-9]+|price|paypal|venmo|cash)' then
    raise exception 'Selling language detected. Only free items are allowed.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_free_post on public.posts;
create trigger trg_ensure_free_post
before insert or update on public.posts
for each row execute procedure public.ensure_free_post();

-- Enable Row-Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.requests enable row level security;
alter table public.chat_messages enable row level security;
alter table public.stories enable row level security;
alter table public.highlights enable row level security;
alter table public.profile_badges enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;

-- Basic RLS policies
create policy "Profiles are viewable" on public.profiles for select using (true);
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Posts visible to all" on public.posts for select using (true);
create policy "Users create own posts" on public.posts for insert with check (auth.uid() = owner_id);
create policy "Users update own posts" on public.posts for update using (auth.uid() = owner_id);

create policy "Requests visible to participants" on public.requests for select using (auth.uid() = requester_id or auth.uid() = owner_id);
create policy "Requester inserts own request" on public.requests for insert with check (auth.uid() = requester_id);
create policy "Owner updates request" on public.requests for update using (auth.uid() = owner_id);

create policy "Chat visible to request participants" on public.chat_messages
for select using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
  )
);
create policy "Chat insert by participants" on public.chat_messages
for insert with check (
  sender_id = auth.uid() and
  exists (
    select 1 from public.requests r
    where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
  )
);

create policy "Stories visible" on public.stories for select using (true);
create policy "Story owners manage" on public.stories for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Highlights visible" on public.highlights for select using (true);
create policy "Highlight owners manage" on public.highlights for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Badges visible to owner" on public.profile_badges for select using (profile_id = auth.uid());
create policy "Challenge entries owner" on public.challenge_entries for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Notifications owner" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Push token owner" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage bucket (run once via SQL editor with service role if needed)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
