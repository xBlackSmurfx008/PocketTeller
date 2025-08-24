
-- Create table for persistent user memory
create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- High-level grouping to help retrieval and prompting
  -- Suggested values: 'preference', 'goal', 'constraint', 'habit', 'profile', 'fact', 'note'
  category text not null,
  -- Optional key to deduplicate/merge (e.g., 'preferred_budgeting_style', 'saving_goal_home_downpayment')
  key text,
  -- Structured payload. Expected shape example:
  -- {
  --   "text": "User prefers zero-based budgeting",
  --   "details": {...optional...}
  -- }
  value jsonb not null,
  importance smallint not null default 3,  -- 1 (low) to 5 (critical)
  confidence numeric not null default 0.7, -- 0.0 to 1.0
  occurrences integer not null default 1,
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  tags text[] not null default '{}',
  source text,                  -- e.g. 'ai_extracted', 'user_declared', 'import'
  thread_id uuid,               -- optional link to a conversation thread
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_reinforced_at timestamptz,
  expires_at timestamptz
);

-- Enable RLS
alter table public.user_memories enable row level security;

-- Owner-only policies
create policy "Users can read their own memories"
  on public.user_memories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own memories"
  on public.user_memories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own memories"
  on public.user_memories
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own memories"
  on public.user_memories
  for delete
  using (auth.uid() = user_id);

-- Keep updated_at current
drop trigger if exists trg_user_memories_updated_at on public.user_memories;
create trigger trg_user_memories_updated_at
  before update on public.user_memories
  for each row
  execute procedure public.update_updated_at_column();

-- Helpful indexes
create index if not exists idx_user_memories_user_updated
  on public.user_memories (user_id, updated_at desc);

create index if not exists idx_user_memories_user_pinned_updated
  on public.user_memories (user_id, is_pinned desc, updated_at desc);

create index if not exists idx_user_memories_user_expires
  on public.user_memories (user_id, expires_at);

-- Partial unique index for dedup when key is known and not deleted
create unique index if not exists ux_user_memories_user_category_key_active
  on public.user_memories (user_id, category, key)
  where key is not null and is_deleted = false;
