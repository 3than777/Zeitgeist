-- Zeitgeist AI CFO — conversations schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);
create index if not exists messages_convo_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users can only touch their own conversations.
create policy "select own conversations" on public.conversations
  for select using (auth.uid() = user_id);
create policy "insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "update own conversations" on public.conversations
  for update using (auth.uid() = user_id);
create policy "delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- Messages are reachable only through a conversation the user owns.
create policy "select own messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "insert own messages" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "delete own messages" on public.messages
  for delete using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
