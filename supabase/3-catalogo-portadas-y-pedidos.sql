-- =====================================================================
-- MSA Scrubs · Catálogo, portadas, fotos y pedidos seguros
-- Requiere haber ejecutado antes 1-crear-base-de-datos.sql.
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO → Run.
-- Se puede volver a ejecutar: no duplica ni borra productos existentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Productos (antes estaban fijos en catalogo.js)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'Conjunto'
    check (category in ('Conjunto', 'Overol', 'Gorro quirúrgico', 'Cubrepolvo')),
  gender text not null default 'Mujer' check (gender in ('Mujer', 'Caballero', 'Unisex')),
  collection text,
  price numeric(10, 2) check (price >= 0),
  note text check (char_length(note) <= 160),
  description text check (char_length(description) <= 1200),
  sizes text[] not null default '{CH,M,G,XG}',
  colors text[] not null default '{}',
  pants_options text[] not null default '{}',
  photos jsonb not null default '{}' check (jsonb_typeof(photos) = 'object'),
  gallery text[] not null default '{}',
  badge text check (char_length(badge) <= 24),
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "Todos ven productos activos" on public.products;
create policy "Todos ven productos activos" on public.products
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "Admin agrega productos" on public.products;
create policy "Admin agrega productos" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin cambia productos" on public.products;
create policy "Admin cambia productos" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin borra productos" on public.products;
create policy "Admin borra productos" on public.products
  for delete to authenticated using (public.is_admin());

-- Catálogo inicial. "on conflict do nothing": si ya existen, no se tocan.
-- ⚠️ Los PRECIOS son de ejemplo: corrígelos en el panel → Productos.
insert into public.products
  (id, name, category, gender, collection, price, note, sizes, colors, pants_options, photos, gallery, featured, active, sort_order)
values
  ('contempo', 'Contempo', 'Conjunto', 'Mujer', 'Contempo', 899,
   'Cuello Mao · Manga corta · Bolsillos laterales',
   '{CH,M,G,XG}',
   '{Blanco,"Azul cielo","Azul rey","Azul marino","Rubi claro",Rubi,Lavanda,Bugambilia,Vino,Militar,Ebano}',
   '{Jogger,Recto}',
   '{"Blanco": "blanco.webp", "Rubi claro": "rubi-claro.webp", "Rubi": "rubi.webp"}',
   '{detail-cuello-rojo.webp,detail-bolsillos-rojo.webp,detail-pantalon-rojo.webp}',
   true, true, 10),
  ('clasia', 'Clasia', 'Conjunto', 'Mujer', 'Clasia', 949,
   'Escote V o manga pétalo · Bolsillos laterales',
   '{CH,M,G,XG}',
   '{Blanco,"Azul cielo","Azul rey","Azul marino","Rubi claro",Rubi,Lavanda,Bugambilia,Vino,Militar,Ebano}',
   '{Jogger,Recto}',
   '{"Azul marino": "azul-marino.webp", "Vino": "vino.webp", "Lavanda": "lavanda.webp", "Bugambilia": "bugambilia.webp", "Militar": "militar.webp", "Ebano": "ebano.webp"}',
   '{}', true, true, 20),
  -- Borradores: ocultos hasta capturar precio, colores y fotos en el panel.
  ('aura', 'Aura', 'Conjunto', 'Mujer', 'Aura', null, null, '{CH,M,G,XG}', '{}', '{}', '{}', '{}', false, false, 30),
  ('dalia', 'Dalia', 'Conjunto', 'Mujer', 'Dalia', null, null, '{CH,M,G,XG}', '{}', '{}', '{}', '{}', false, false, 40),
  ('siena', 'Siena', 'Conjunto', 'Mujer', 'Siena', null, null, '{CH,M,G,XG}', '{}', '{}', '{}', '{}', false, false, 50),
  ('overol', 'Overol', 'Overol', 'Mujer', 'Overol', null, null, '{CH,M,G,XG}', '{}', '{}', '{}', '{}', false, false, 60),
  ('pulso', 'Pulso', 'Gorro quirúrgico', 'Unisex', null, 249, 'Elástico suave · Estampado interior',
   '{Unitalla}', '{"Verde eucalipto","Azul tinta",Terracota}', '{}', '{}', '{}', false, true, 70),
  ('aurora', 'Aurora', 'Gorro quirúrgico', 'Unisex', null, 249, 'Ajuste cómodo · Diseño ligero',
   '{Unitalla}', '{Arena,Lavanda,Terracota}', '{}', '{}', '{}', false, true, 71),
  ('guardia', 'Guardia', 'Gorro quirúrgico', 'Unisex', null, 269, 'Secado rápido · Banda suave',
   '{Unitalla}', '{"Azul quirófano","Gris piedra","Verde salvia"}', '{}', '{}', '{}', false, true, 72),
  ('clasico', 'Clásico', 'Cubrepolvo', 'Unisex', null, 649, 'Corte limpio · Bolsillos funcionales',
   '{CH,M,G,XG}', '{Blanco,"Azul cielo","Verde salvia"}', '{}', '{}', '{}', false, true, 80),
  ('esencial', 'Esencial', 'Cubrepolvo', 'Unisex', null, 699, 'Tela ligera · Silueta amplia',
   '{M,G,XG}', '{Blanco,Arena,"Gris piedra"}', '{}', '{}', '{}', false, true, 81)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Portadas (carrusel principal de la tienda)
-- ---------------------------------------------------------------------
create table if not exists public.banners (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 80),
  subtitle text check (char_length(subtitle) <= 200),
  eyebrow text check (char_length(eyebrow) <= 40),
  image text,
  button_text text check (char_length(button_text) <= 40),
  link text check (char_length(link) <= 300),
  sort_order integer not null default 100,
  active boolean not null default true
);
alter table public.banners enable row level security;

drop policy if exists "Todos ven portadas activas" on public.banners;
create policy "Todos ven portadas activas" on public.banners
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "Admin administra portadas" on public.banners;
create policy "Admin administra portadas" on public.banners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.banners (eyebrow, title, subtitle, image, button_text, link, sort_order)
select * from (values
  ('Colección Contempo', 'Tu turno, a tu ritmo.', 'Cuello Mao y bolsillos laterales. Elige tu pantalón: jogger o recto.', 'blanco.webp', 'Ver Contempo', '#producto=contempo', 10),
  ('Colección Clasia', 'Color para cada guardia.', 'Escote V o manga pétalo en once colores.', 'bugambilia.webp', 'Ver Clasia', '#producto=clasia', 20),
  ('Tu talla ideal', 'Mide una vez, acierta siempre.', 'Captura tus medidas y te marcamos la talla en cada conjunto.', 'militar.webp', 'Calcular mi talla', '#mi-talla', 30)
) as seed(eyebrow, title, subtitle, image, button_text, link, sort_order)
where not exists (select 1 from public.banners);

-- ---------------------------------------------------------------------
-- 3. Fotos: carpeta pública "productos" donde solo admin puede subir
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin sube fotos" on storage.objects;
create policy "Admin sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "Admin cambia fotos" on storage.objects;
create policy "Admin cambia fotos" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.is_admin());

drop policy if exists "Admin borra fotos" on storage.objects;
create policy "Admin borra fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Inventario por variante de pantalón (Jogger / Recto)
-- ---------------------------------------------------------------------
alter table public.inventory add column if not exists variant text not null default '';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.inventory'::regclass and contype = 'p'
      and array_length(conkey, 1) = 4
  ) then
    alter table public.inventory drop constraint inventory_pkey;
    alter table public.inventory add primary key (product_id, gender, color, size, variant);
  end if;
end $$;

-- Las existencias de modelos que ya no existen (p. ej. "amalia", "celeste") se eliminan.
delete from public.inventory i where not exists (select 1 from public.products p where p.id = i.product_id);

-- ---------------------------------------------------------------------
-- 5. Pedidos: el precio lo calcula la base de datos, no el navegador
-- ---------------------------------------------------------------------
create or replace function public.create_order(customer jsonb, items jsonb, honeypot text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(customer ->> 'name', ''));
  v_phone text := btrim(coalesce(customer ->> 'phone', ''));
  v_city text := nullif(btrim(coalesce(customer ->> 'city', '')), '');
  v_note text := nullif(btrim(coalesce(customer ->> 'note', '')), '');
  v_items jsonb := '[]'::jsonb;
  v_total numeric(10, 2) := 0;
  v_id bigint;
  item jsonb;
  p public.products;
  qty integer;
  v_variant text;
  v_gender text;
begin
  -- Campo trampa: los bots lo llenan, las personas no lo ven.
  if coalesce(honeypot, '') <> '' then
    return jsonb_build_object('id', null, 'total', 0);
  end if;
  if char_length(v_name) not between 2 and 120 then
    raise exception 'Escribe tu nombre completo.';
  end if;
  if char_length(regexp_replace(v_phone, '\D', '', 'g')) not between 10 and 13 then
    raise exception 'Escribe un teléfono de 10 dígitos.';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 30 then
    raise exception 'El carrito está vacío o tiene demasiadas piezas.';
  end if;

  -- Límites contra pedidos falsos en serie.
  if (select count(*) from public.orders
      where regexp_replace(phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g')
        and created_at > now() - interval '30 minutes') >= 3 then
    raise exception 'Ya recibimos varios pedidos con este teléfono. Te contactamos por WhatsApp en breve.';
  end if;
  if (select count(*) from public.orders where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Estamos recibiendo muchos pedidos. Intenta de nuevo en un minuto.';
  end if;

  for item in select * from jsonb_array_elements(items) loop
    select * into p from public.products where id = item ->> 'product_id' and active;
    if not found or p.price is null then
      raise exception 'Uno de los productos ya no está disponible. Actualiza la página.';
    end if;
    qty := (item ->> 'quantity')::integer;
    if qty is null or qty not between 1 and 20 then
      raise exception 'Cantidad no válida para %.', p.name;
    end if;
    if not (item ->> 'color' = any (p.colors)) then
      raise exception 'El color de % no es válido.', p.name;
    end if;
    if not (item ->> 'size' = any (p.sizes)) then
      raise exception 'La talla de % no es válida.', p.name;
    end if;
    v_variant := coalesce(item ->> 'variant', '');
    if cardinality(p.pants_options) > 0 then
      if not (v_variant = any (p.pants_options)) then
        raise exception 'Elige el pantalón de %.', p.name;
      end if;
    else
      v_variant := '';
    end if;
    v_gender := p.gender;
    v_items := v_items || jsonb_build_object(
      'product_id', p.id, 'product_name', p.name, 'gender', v_gender,
      'variant', v_variant, 'color', item ->> 'color', 'size', item ->> 'size',
      'quantity', qty, 'price', p.price);
    v_total := v_total + p.price * qty;
  end loop;

  insert into public.orders (user_id, customer_name, phone, city, note, items, total)
  values (auth.uid(), v_name, v_phone, v_city, v_note, v_items, v_total)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'total', v_total);
end;
$$;

-- Los pedidos ya solo entran por create_order (con precios del servidor).
drop policy if exists "Cualquiera registra un pedido pendiente" on public.orders;
revoke insert on public.orders from anon, authenticated;
revoke execute on function public.create_order(jsonb, jsonb, text) from public;
grant execute on function public.create_order(jsonb, jsonb, text) to anon, authenticated;

-- Confirmar pedido ahora considera la variante de pantalón.
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
    select stock into available from public.inventory
      where product_id = item ->> 'product_id' and gender = item ->> 'gender'
        and color = item ->> 'color' and size = item ->> 'size'
        and variant = coalesce(item ->> 'variant', '')
      for update;
    if found then
      if available < qty then
        raise exception 'No alcanza: % % % talla % (hay %, se piden %)',
          item ->> 'product_name', coalesce(nullif(item ->> 'variant', ''), ''), item ->> 'color', item ->> 'size', available, qty;
      end if;
      update public.inventory set stock = stock - qty, updated_at = now()
        where product_id = item ->> 'product_id' and gender = item ->> 'gender'
          and color = item ->> 'color' and size = item ->> 'size'
          and variant = coalesce(item ->> 'variant', '');
    end if;
  end loop;

  update public.orders set status = 'confirmado' where id = order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Permisos
-- ---------------------------------------------------------------------
-- Las reglas de productos y portadas preguntan "¿es admin?" también para
-- visitantes sin cuenta; para ellos la respuesta siempre es "no".
grant execute on function public.is_admin() to anon;
grant select on public.products, public.banners to anon, authenticated;
grant insert, update, delete on public.products, public.banners to authenticated;
