create table if not exists debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  type text check (type in ('credit_card', 'loan', 'personal', 'other')) default 'other',
  original_amount decimal(10, 2) not null check (original_amount >= 0),
  remaining_amount decimal(10, 2) not null check (remaining_amount >= 0),
  interest_rate decimal(5, 2),
  due_date date,
  min_monthly_payment decimal(10, 2),
  status text check (status in ('active', 'paid', 'defaulted')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table debts enable row level security;

create policy "Users can view their own debts"
  on debts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own debts"
  on debts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own debts"
  on debts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own debts"
  on debts for delete
  using (auth.uid() = user_id);

create table if not exists debt_payments (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references debts(id) not null,
  user_id uuid references auth.users(id) not null,
  transaction_id uuid references transactions(id),
  amount decimal(10, 2) not null check (amount > 0),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table debt_payments enable row level security;

create policy "Users can view their own debt payments"
  on debt_payments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own debt payments"
  on debt_payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own debt payments"
  on debt_payments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own debt payments"
  on debt_payments for delete
  using (auth.uid() = user_id);

