-- Create tenants table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique check (subdomain ~ '^[a-z0-9-]+$'),
  theme jsonb default '{
    "colors": {
      "primary": "#2563eb",
      "background": "#ffffff",
      "text": "#111827"
    }
  }',
  logo_url text,
  created_at timestamptz default now()
);

-- Create tenant_members table
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique(tenant_id, user_id)
);

-- Create tenant_domains table
create table public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain text not null unique check (domain ~ '^[a-z0-9-]+\.[a-z0-9-]+(\.[a-z0-9-]+)*$'),
  verified boolean default false,
  created_at timestamptz default now()
);

-- Add tenant_id to interviews
alter table public.interviews
add column tenant_id uuid references public.tenants(id) on delete cascade;

-- Backfill existing interviews (if any) with a default tenant
do $$
declare
  default_tenant_id uuid;
begin
  -- Create default tenant if no interviews exist
  if not exists (select 1 from public.interviews) then
    insert into public.tenants (name, subdomain)
    values ('Default Organization', 'default')
    returning id into default_tenant_id;

    -- Make the first user (if exists) the owner
    insert into public.tenant_members (tenant_id, user_id, role)
    select default_tenant_id, id, 'owner'
    from auth.users
    order by created_at asc
    limit 1;
  end if;
end;
$$;

-- Make tenant_id required after backfill
alter table public.interviews
alter column tenant_id set not null;

-- Create indexes
create index idx_tenant_members_user_id on public.tenant_members(user_id);
create index idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index idx_tenant_domains_tenant_id on public.tenant_domains(tenant_id);
create index idx_interviews_tenant_id on public.interviews(tenant_id);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_domains enable row level security;

-- RLS Policies

-- Tenants: visible to all members of the tenant
create policy "tenants_visible_to_members" on public.tenants
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenants.id
      and user_id = auth.uid()
    )
  );

-- Tenant update: only owners and admins can update their tenant
create policy "tenants_update_by_admins" on public.tenants
  for update using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenants.id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Tenant members: visible to all members of the same tenant
create policy "tenant_members_visible_to_members" on public.tenant_members
  for select using (
    exists (
      select 1 from public.tenant_members as tm
      where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
    )
  );

-- Tenant members management: only owners and admins
create policy "tenant_members_managed_by_admins" on public.tenant_members
  for all using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenant_members.tenant_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Tenant domains: visible to all members
create policy "tenant_domains_visible_to_members" on public.tenant_domains
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenant_domains.tenant_id
      and user_id = auth.uid()
    )
  );

-- Tenant domains management: only owners and admins
create policy "tenant_domains_managed_by_admins" on public.tenant_domains
  for all using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = tenant_domains.tenant_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Update interviews policy to enforce tenant isolation
create policy "interviews_tenant_isolation" on public.interviews
  for all using (
    exists (
      select 1 from public.tenant_members
      where tenant_id = interviews.tenant_id
      and user_id = auth.uid()
    )
  );

-- Create storage bucket for tenant logos
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true);

-- Storage policy for tenant logos
create policy "tenant_logos_select_public"
  on storage.objects for select
  using ( bucket_id = 'tenant-assets' );

create policy "tenant_logos_insert_update_owners"
  on storage.objects for insert with check (
    bucket_id = 'tenant-assets'
    and exists (
      select 1 from public.tenant_members
      where tenant_id = (storage.foldername(name))[1]::uuid
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );
