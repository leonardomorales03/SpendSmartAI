create table if not exists saving_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  target_amount decimal(10, 2) not null check (target_amount > 0),
  current_amount decimal(10, 2) default 0 check (current_amount >= 0),
  deadline date,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table saving_goals enable row level security;

create policy "Users can view their own saving goals"
  on saving_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saving goals"
  on saving_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saving goals"
  on saving_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saving goals"
  on saving_goals for delete
  using (auth.uid() = user_id);
