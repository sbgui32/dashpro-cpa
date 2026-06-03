-- ============================================================
-- DashPRO CPA — Setup do banco Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela de assinaturas
create table if not exists public.subscriptions (
  id                     uuid default gen_random_uuid() primary key,
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  status                 text not null default 'inactive',
  trial_end              timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- 2. Row Level Security
alter table public.subscriptions enable row level security;

-- Usuário lê apenas sua própria assinatura
create policy "Leitura própria assinatura"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- 3. Desabilitar confirmação de email (para onboarding mais rápido)
-- Faça isso em: Authentication → Settings → Email → "Confirm email" = OFF

-- 4. Definir a URL do site
-- Faça isso em: Authentication → URL Configuration → Site URL = https://dashprocpa.vercel.app
