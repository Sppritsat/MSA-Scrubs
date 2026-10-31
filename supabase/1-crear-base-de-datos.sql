-- =====================================================================
-- MSA Scrubs · Base de datos en Supabase
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO este
-- archivo → Run. Se puede volver a ejecutar sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Administradores (quién puede cambiar inventario y ver pedidos)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- Sin políticas: nadie puede leer ni editar esta tabla desde la página.
-- Solo se edita desde el SQL Editor (archivo 2-administrador.sql).

-- Devuelve true si la persona que inició sesión es administradora.
-- Exige que su correo ya esté confirmado.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Perfiles: medidas de cada cliente
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sexo text check (sexo in ('Dama', 'Caballero')),
  pecho numeric(5, 1) check (pecho between 40 and 200),
  cintura numeric(5, 1) check (cintura between 40 and 200),
  cadera numeric(5, 1) check (cadera between 40 and 220),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Cada quien ve su perfil" on public.profiles;
create policy "Cada quien ve su perfil" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "Cada quien crea su perfil" on public.profiles;
create policy "Cada quien crea su perfil" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "Cada quien edita su perfil" on public.profiles;
create policy "Cada quien edita su perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Cada quien borra su perfil" on public.profiles;
create policy "Cada quien borra su perfil" on public.profiles
  for delete to authenticated using (id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Inventario: existencias por modelo, sexo, color y talla
-- ---------------------------------------------------------------------
create table if not exists public.inventory (
  product_id text not null,
  gender text not null,
  color text not null,
  size text not null,
  stock integer not null default 0 check (stock >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, gender, color, size)
);
alter table public.inventory enable row level security;

drop policy if exists "Todos ven existencias" on public.inventory;
create policy "Todos ven existencias" on public.inventory
  for select to anon, authenticated using (true);

drop policy if exists "Admin agrega existencias" on public.inventory;
create policy "Admin agrega existencias" on public.inventory
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin cambia existencias" on public.inventory;
create policy "Admin cambia existencias" on public.inventory
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin borra existencias" on public.inventory;
create policy "Admin borra existencias" on public.inventory
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Pedidos: se guardan como "pendiente" al enviar a WhatsApp
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  city text check (char_length(city) <= 120),
  note text check (char_length(note) <= 1000),
  items jsonb not null check (
    jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
  ),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'cancelado'))
);
alter table public.orders enable row level security;

drop policy if exists "Cualquiera registra un pedido pendiente" on public.orders;
create policy "Cualquiera registra un pedido pendiente" on public.orders
  for insert to anon, authenticated
  with check (status = 'pendiente' and (user_id is null or user_id = auth.uid()));

drop policy if exists "Cliente ve sus pedidos y admin ve todos" on public.orders;
create policy "Cliente ve sus pedidos y admin ve todos" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admin actualiza pedidos" on public.orders;
create policy "Admin actualiza pedidos" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin borra pedidos" on public.orders;
create policy "Admin borra pedidos" on public.orders
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Confirmar pedido: lo marca "confirmado" y descuenta existencias.
--    Si algo no alcanza, no descuenta nada y avisa qué falta.
-- ---------------------------------------------------------------------
create or replace function public.confirm_order(order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  item jsonb;
  qty integer;
  available integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede confirmar pedidos';
  end if;

  select * into o from public.orders where id = order_id for update;
  if not found then
    raise exception 'El pedido % no existe', order_id;
  end if;
  if o.status <> 'pendiente' then
    raise exception 'El pedido % ya está %', order_id, o.status;
  end if;

  for item in select * from jsonb_array_elements(o.items) loop
    qty := (item ->> 'quantity')::integer;
    select stock into available
      from public.inventory
      where product_id = item ->> 'product_id'
        and gender = item ->> 'gender'
        and color = item ->> 'color'
        and size = item ->> 'size'
      for update;
    -- Si esa combinación no está en el inventario, no se controla y se omite.
    if found then
      if available < qty then
        raise exception 'No alcanza: % % % talla % (hay %, se piden %)',
          item ->> 'product_name', item ->> 'gender', item ->> 'color', item ->> 'size', available, qty;
      end if;
      update public.inventory
        set stock = stock - qty, updated_at = now()
        where product_id = item ->> 'product_id'
          and gender = item ->> 'gender'
          and color = item ->> 'color'
          and size = item ->> 'size';
    end if;
  end loop;

  update public.orders set status = 'confirmado' where id = order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Permisos
-- ---------------------------------------------------------------------
revoke all on public.admins from anon, authenticated;
grant select on public.inventory to anon, authenticated;
grant insert, update, delete on public.inventory to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.confirm_order(bigint) from public, anon;
grant execute on function public.confirm_order(bigint) to authenticated;
