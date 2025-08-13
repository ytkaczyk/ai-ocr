-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  tenant_id uuid references public.tenants on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tenants table for multi-tenancy
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files table
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tenant_id uuid references public.tenants on delete cascade,
  name text not null,
  type text not null check (type in ('pdf', 'markdown')),
  size bigint not null,
  storage_path text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tenants
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.files
  for each row execute procedure public.handle_updated_at();

-- Performance indexes for common queries
create index profiles_user_id_idx on public.profiles(user_id);
create index profiles_tenant_id_idx on public.profiles(tenant_id);
create index files_user_id_idx on public.files(user_id);
create index files_tenant_id_idx on public.files(tenant_id);
create index files_user_id_created_at_idx on public.files(user_id, created_at desc);
create index files_tenant_id_type_idx on public.files(tenant_id, type);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_user_id_read_idx on public.notifications(user_id, read);
create index notifications_user_id_read_created_at_idx on public.notifications(user_id, read, created_at desc);

-- Full-text search index for files
create index files_name_search_idx on public.files using gin(to_tsvector('english', name));

-- Analyze tables for better query planning
analyze public.profiles;
analyze public.tenants;
analyze public.files;
analyze public.notifications;