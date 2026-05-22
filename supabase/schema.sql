create extension if not exists pgcrypto;

create table if not exists public.fiestas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre_evento text,
  nombre_responsable text,
  telefono_responsable text,
  fecha_evento date,
  usa_mesas boolean not null default false,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  fiesta_id uuid not null references public.fiestas(id) on delete cascade,
  nombre text not null,
  capacidad int,
  created_at timestamptz not null default now(),
  unique (fiesta_id, nombre)
);

create table if not exists public.invitados (
  id uuid primary key default gen_random_uuid(),
  fiesta_id uuid not null references public.fiestas(id) on delete cascade,
  mesa_id uuid references public.mesas(id) on delete set null,
  nombre text not null,
  telefono text,
  cantidad_invitados int not null default 1,
  asistio boolean not null default false,
  created_at timestamptz not null default now(),
  constraint invitados_cantidad_check check (cantidad_invitados >= 1)
);

alter table public.fiestas alter column nombre_evento drop not null;
alter table public.fiestas alter column nombre_responsable drop not null;

create index if not exists idx_fiestas_codigo on public.fiestas(codigo);
create index if not exists idx_mesas_fiesta_id on public.mesas(fiesta_id);
create index if not exists idx_invitados_fiesta_id on public.invitados(fiesta_id);
create index if not exists idx_invitados_mesa_id on public.invitados(mesa_id);

alter table public.fiestas enable row level security;
alter table public.mesas enable row level security;
alter table public.invitados enable row level security;
