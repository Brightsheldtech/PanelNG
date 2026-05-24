-- Settings table for platform-wide config (e.g. USD→NGN exchange rate)
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Seed default exchange rate
insert into public.settings (key, value)
values ('exchange_rate', '1600')
on conflict (key) do nothing;

-- Only admins can write; anyone authenticated can read
alter table public.settings enable row level security;

create policy "Public read" on public.settings
  for select using (true);

create policy "Admin write" on public.settings
  for all using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
