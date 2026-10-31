-- =====================================================================
-- MSA Scrubs · Seguimiento de pedidos
-- Requiere haber ejecutado antes los scripts 1 a 4.
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO → Run.
-- Se puede volver a ejecutar sin problema.
--
-- Qué agrega:
--   • Estados: pendiente → confirmado → pagado → preparacion → enviado → entregado
--     (y cancelado en cualquier momento), con fecha y hora de cada cambio.
--   • Datos del envío: paquetería, número de guía y enlace de rastreo (Skydropx).
--   • Las existencias se descuentan al confirmar y se regresan si se cancela.
--   • track_order: el cliente consulta su pedido con el número y los últimos
--     4 dígitos de su teléfono (con límite de intentos).
-- =====================================================================

-- 1. Nuevos estados y datos de envío
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pendiente', 'confirmado', 'pagado', 'preparacion', 'enviado', 'entregado', 'cancelado'));

alter table public.orders add column if not exists carrier text check (char_length(carrier) <= 60);
alter table public.orders add column if not exists tracking_number text check (char_length(tracking_number) <= 80);
alter table public.orders add column if not exists tracking_url text check (tracking_url is null or tracking_url ~ '^https://');
alter table public.orders add column if not exists status_history jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists stock_applied boolean not null default false;
alter table public.orders add column if not exists updated_at timestamptz not null default now();

-- Pedidos anteriores: historial inicial y si ya se descontaron existencias.
update public.orders
set status_history = jsonb_build_array(jsonb_build_object('status', 'pendiente', 'at', created_at))
  || case when status <> 'pendiente' then jsonb_build_array(jsonb_build_object('status', status, 'at', now())) else '[]'::jsonb end,
    stock_applied = (status = 'confirmado')
where status_history = '[]'::jsonb;

-- Los pedidos nuevos empiezan con su primer registro en el historial.
create or replace function public.orders_init_history()
returns trigger
language plpgsql
as $$
begin
  if new.status_history = '[]'::jsonb then
    new.status_history := jsonb_build_array(jsonb_build_object('status', new.status, 'at', new.created_at));
  end if;
  return new;
end;
$$;

drop trigger if exists orders_init_history on public.orders;
create trigger orders_init_history before insert on public.orders
  for each row execute function public.orders_init_history();

-- 2. Mover existencias de un pedido: direction = -1 descuenta, +1 regresa.
create or replace function public.apply_order_stock(o public.orders, direction integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  qty integer;
  available integer;
begin
  for item in select * from jsonb_array_elements(o.items) loop
    qty := (item ->> 'quantity')::integer;
    select stock into available from public.inventory
      where product_id = item ->> 'product_id' and gender = item ->> 'gender'
        and color = item ->> 'color' and size = item ->> 'size'
        and variant = coalesce(item ->> 'variant', '')
      for update;
    -- Si esa combinación no está en el inventario, no se controla.
    if found then
      if direction < 0 and available < qty then
        raise exception 'No alcanza: % % % talla % (hay %, se piden %)',
          item ->> 'product_name', coalesce(item ->> 'variant', ''), item ->> 'color', item ->> 'size', available, qty;
      end if;
      update public.inventory set stock = stock + direction * qty, updated_at = now()
        where product_id = item ->> 'product_id' and gender = item ->> 'gender'
          and color = item ->> 'color' and size = item ->> 'size'
          and variant = coalesce(item ->> 'variant', '');
    end if;
  end loop;
end;
$$;
revoke execute on function public.apply_order_stock(public.orders, integer) from public, anon, authenticated;

-- 3. Cambiar el estado de un pedido (solo administradores)
create or replace function public.set_order_status(
  order_id bigint,
  new_status text,
  p_carrier text default null,
  p_tracking_number text default null,
  p_tracking_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  needs_stock boolean;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar pedidos';
  end if;
  if new_status not in ('pendiente', 'confirmado', 'pagado', 'preparacion', 'enviado', 'entregado', 'cancelado') then
    raise exception 'Estado no válido: %', new_status;
  end if;
  if p_tracking_url is not null and p_tracking_url <> '' and p_tracking_url !~ '^https://' then
    raise exception 'El enlace de rastreo debe empezar con https://';
  end if;

  select * into o from public.orders where id = order_id for update;
  if not found then
    raise exception 'El pedido % no existe', order_id;
  end if;

  -- Existencias: se descuentan al salir de "pendiente" y se regresan al cancelar o volver a pendiente.
  needs_stock := new_status not in ('pendiente', 'cancelado');
  if needs_stock and not o.stock_applied then
    perform public.apply_order_stock(o, -1);
    o.stock_applied := true;
  elsif not needs_stock and o.stock_applied then
    perform public.apply_order_stock(o, 1);
    o.stock_applied := false;
  end if;

  update public.orders set
    status = new_status,
    stock_applied = o.stock_applied,
    carrier = coalesce(nullif(btrim(p_carrier), ''), carrier),
    tracking_number = coalesce(nullif(btrim(p_tracking_number), ''), tracking_number),
    tracking_url = coalesce(nullif(btrim(p_tracking_url), ''), tracking_url),
    status_history = case when o.status = new_status then status_history
      else status_history || jsonb_build_array(jsonb_build_object('status', new_status, 'at', now())) end,
    updated_at = now()
  where id = order_id;
end;
$$;
revoke execute on function public.set_order_status(bigint, text, text, text, text) from public, anon;
grant execute on function public.set_order_status(bigint, text, text, text, text) to authenticated;

-- "Confirmar y descontar" del panel anterior sigue funcionando.
create or replace function public.confirm_order(order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.set_order_status(order_id, 'confirmado');
end;
$$;

-- 4. Rastreo sin cuenta: número de pedido + últimos 4 dígitos del teléfono
create table if not exists public.track_attempts (
  id bigint generated always as identity primary key,
  order_id bigint not null,
  at timestamptz not null default now()
);
alter table public.track_attempts enable row level security;
-- Sin políticas: solo la función track_order escribe aquí.

create or replace function public.track_order(order_id bigint, phone_last4 text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  if (select count(*) from public.track_attempts a
      where a.order_id = track_order.order_id and a.at > now() - interval '1 hour') >= 8 then
    raise exception 'Demasiados intentos con este pedido. Espera una hora o escríbenos por WhatsApp.';
  end if;

  select * into o from public.orders where id = track_order.order_id;
  if not found or right(regexp_replace(o.phone, '\D', '', 'g'), 4) <> regexp_replace(coalesce(phone_last4, ''), '\D', '', 'g') then
    insert into public.track_attempts (order_id) values (track_order.order_id);
    return null;
  end if;

  -- Solo lo necesario para el seguimiento (sin teléfono, ciudad ni notas).
  return jsonb_build_object(
    'id', o.id,
    'created_at', o.created_at,
    'status', o.status,
    'history', o.status_history,
    'carrier', o.carrier,
    'tracking_number', o.tracking_number,
    'tracking_url', o.tracking_url,
    'total', o.total,
    'customer', split_part(o.customer_name, ' ', 1),
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'product_name', i ->> 'product_name', 'variant', i ->> 'variant', 'color', i ->> 'color',
        'size', i ->> 'size', 'quantity', (i ->> 'quantity')::integer, 'price', i -> 'price')), '[]'::jsonb)
      from jsonb_array_elements(o.items) i)
  );
end;
$$;
revoke execute on function public.track_order(bigint, text) from public;
grant execute on function public.track_order(bigint, text) to anon, authenticated;

-- Limpieza de intentos viejos cada vez que se ejecuta este script.
delete from public.track_attempts where at < now() - interval '7 days';
