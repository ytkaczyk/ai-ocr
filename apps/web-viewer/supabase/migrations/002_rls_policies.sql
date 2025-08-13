-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.files enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Super admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  );

create policy "Super admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  );

-- Tenants policies
create policy "Users can view their tenant"
  on public.tenants for select
  to authenticated
  using (
    id in (
      select tenant_id from public.profiles
      where user_id = (select auth.uid())
    )
  );

create policy "Super admins can manage all tenants"
  on public.tenants for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  );

-- Files policies
create policy "Users can view their own files"
  on public.files for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can upload files"
  on public.files for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own files"
  on public.files for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own files"
  on public.files for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Tenant-based file access for admins
create policy "Tenant admins can view tenant files"
  on public.files for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.profiles
      where user_id = (select auth.uid()) and role in ('admin', 'super_admin')
    )
  );

-- Notifications policies
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using ((select auth.uid()) = user_id);