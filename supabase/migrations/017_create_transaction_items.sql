create table if not exists transaction_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  transaction_id uuid references transactions(id) on delete cascade not null,
  name text not null,
  quantity numeric(10, 2) default 1 not null,
  unit_price numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transaction_items enable row level security;

create policy "Users can view their own transaction items"
  on transaction_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transaction items"
  on transaction_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transaction items"
  on transaction_items
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transaction items"
  on transaction_items
  for delete
  using (auth.uid() = user_id);

create index if not exists idx_transaction_items_user_date
  on transaction_items(user_id, created_at);

create index if not exists idx_transaction_items_user_name
  on transaction_items(user_id, name);

