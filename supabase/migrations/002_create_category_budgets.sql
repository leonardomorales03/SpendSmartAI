-- Create category_budgets table
create table if not exists category_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  category_id uuid references categories(id) not null,
  amount decimal(10, 2) not null check (amount >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category_id)
);

-- Enable RLS
alter table category_budgets enable row level security;

-- Policies
create policy "Users can view their own category budgets"
  on category_budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own category budgets"
  on category_budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own category budgets"
  on category_budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own category budgets"
  on category_budgets for delete
  using (auth.uid() = user_id);
