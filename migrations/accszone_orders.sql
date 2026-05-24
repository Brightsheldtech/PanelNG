-- Run this in your Supabase SQL editor

create table if not exists public.accszone_orders (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  accszone_order_id text,
  product_id       text,
  product_name     text,
  platform         text,
  quantity         integer not null default 1,
  unit_price       numeric(10,2) not null,
  total_cost       numeric(10,2) not null,
  status           text not null default 'pending',
  delivered_data   jsonb,
  created_at       timestamptz not null default now()
);

alter table public.accszone_orders enable row level security;

create policy "Users can read their own accszone orders"
  on public.accszone_orders for select
  using (auth.uid() = user_id);

create policy "Service role can insert accszone orders"
  on public.accszone_orders for insert
  with check (true);

create index accszone_orders_user_id_idx on public.accszone_orders(user_id);
create index accszone_orders_created_at_idx on public.accszone_orders(created_at desc);
