-- =====================================================================
-- MSA Scrubs · Catálogo oficial (PDF "MSA Catálogo")
-- Requiere haber ejecutado antes los scripts 1, 2 y 3.
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO → Run.
--
-- Qué hace:
--   • Carga Contempo, Clasia, Aura, Dalia, Siena, Overol y 2 cubrepolvos
--     con sus paletas, tallas XCH–XG, descripciones y fotos.
--   • NO toca precios que ya hayas escrito; los precios de ejemplo
--     (899, 949, 249, 269) se cambian a "Precio a consultar".
--   • Conserva las fotos que hayas subido desde el panel.
--   • Permite pedidos de productos sin precio (se cotizan por WhatsApp).
-- Se puede volver a ejecutar sin problema.
-- =====================================================================

-- 1. Colores renombrados según el catálogo: el rojo es "Rojo" y el rosa es "Rubi".
--    Solo se hace una vez: mientras el catálogo todavía tenga "Rubi claro".
do $$
begin
  if exists (select 1 from public.products where id in ('contempo', 'clasia') and 'Rubi claro' = any (colors)) then
    update public.inventory set color = 'Rojo' where product_id in ('contempo', 'clasia') and color = 'Rubi';
    update public.inventory set color = 'Rubi' where product_id in ('contempo', 'clasia') and color = 'Rubi claro';
  end if;
end $$;

-- 2. Catálogo
with catalog (id, name, category, gender, collection, note, description, sizes, colors, pants_options, photos, gallery, featured, sort_order) as (
  values
  ('contempo', 'Contempo', 'Conjunto', 'Mujer', 'Contempo',
   'Letilla cuello Mao · Manga corta · Bolsillos laterales en filipina y pantalón', null,
   '{XCH,CH,M,G,XG}'::text[],
   '{Blanco,"Azul cielo","Azul rey","Azul marino",Rubi,Rojo,Lavanda,Bugambilia,Vino,Militar,Ebano,Menta}'::text[],
   '{Jogger,Recto}'::text[],
   '{"Rojo": "contempo-rojo.webp", "Blanco": "contempo-blanco.webp", "Rubi": "contempo-rubi.webp", "Militar": "contempo-militar.webp", "Ebano": "contempo-ebano.webp"}'::jsonb,
   '{contempo-rojo-hincada.webp,detail-cuello-rojo.webp,detail-bolsillos-rojo.webp,detail-pantalon-rojo.webp}'::text[], true, 10),
  ('clasia', 'Clasia', 'Conjunto', 'Mujer', 'Clasia',
   'Escote V · Bolsillos laterales en filipina y pantalón', null,
   '{XCH,CH,M,G,XG}', '{Blanco,"Azul cielo","Azul rey","Azul marino",Rubi,Rojo,Lavanda,Bugambilia,Vino,Militar,Ebano,Menta}',
   '{Jogger,Recto}',
   '{"Azul marino": "clasia-azul-marino.webp", "Vino": "clasia-vino.webp", "Bugambilia": "clasia-bugambilia.webp", "Azul cielo": "clasia-azul-cielo.webp", "Lavanda": "lavanda.webp"}',
   '{clasia-detalle-1.webp,clasia-detalle-2.webp,clasia-detalle-3.webp}', true, 20),
  ('aura', 'Aura', 'Conjunto', 'Mujer', 'Aura',
   'Manga tipo pétalo · Escote con letillas en V y cuello Mao · Corte semi holgado', 'Pantalón recto con ligera campana.',
   '{XCH,CH,M,G,XG}', '{Olivo,Bandera,Cemento,Capuchino,Ladrillo,Chocolate,"Palo de rosa",Rosita,Amarillo,Aqua}', '{}',
   '{"Bandera": "aura-bandera.webp", "Olivo": "aura-olivo.webp", "Ladrillo": "aura-ladrillo.webp", "Amarillo": "aura-amarillo.webp", "Rosita": "aura-rosita.webp", "Aqua": "aura-aqua.webp"}',
   '{aura-detalle-1.webp,aura-detalle-2.webp,aura-detalle-3.webp}', true, 30),
  ('dalia', 'Dalia', 'Conjunto', 'Mujer', 'Dalia',
   'Manga corta estilizada · Escote cruzado con ajuste lateral', 'Pantalón recto con bolsas funcionales.',
   '{XCH,CH,M,G,XG}', '{Olivo,Bandera,Cemento,Capuchino,Ladrillo,Chocolate,"Palo de rosa",Rosita,Amarillo,Aqua}', '{}',
   '{"Chocolate": "dalia-chocolate.webp", "Capuchino": "dalia-capuchino.webp", "Olivo": "dalia-olivo.webp"}',
   '{dalia-detalle-1.webp,dalia-detalle-2.webp,dalia-detalle-3.webp,dalia-durazno.webp}', true, 40),
  ('siena', 'Siena', 'Conjunto', 'Mujer', 'Siena',
   'Manga corta · Escote en V', 'Pantalón amplio con cintura ajustable.',
   '{XCH,CH,M,G,XG}', '{Olivo,Bandera,Cemento,Capuchino,Ladrillo,Chocolate,"Palo de rosa",Rosita,Amarillo,Aqua}', '{}',
   '{"Rosita": "siena-rosita.webp", "Chocolate": "siena-chocolate.webp", "Olivo": "siena-olivo.webp"}',
   '{siena-detalle-1.webp,siena-detalle-2.webp,siena-detalle-3.webp,siena-verde.webp}', false, 50),
  ('overol', 'Overol', 'Overol', 'Mujer', 'Overol',
   'Manga tipo pétalo · Cuello sport · Pantalón jogger', 'Bolsas en los laterales y una en la parte de atrás.',
   '{XCH,CH,M,G,XG}', '{Ebano,Chocolate,Ladrillo}', '{}',
   '{"Ladrillo": "overol-ladrillo.webp", "Ebano": "overol-ebano.webp"}',
   '{overol-detalle-1.webp,overol-detalle-2.webp,overol-detalle-3.webp}', true, 60),
  ('cubrepolvo-liso', 'Cubrepolvo liso', 'Cubrepolvo', 'Mujer', null,
   'Cuello con cierre · Mangas con puños · Bolsillos laterales', 'Se hace en el color liso que elijas.',
   '{XCH,CH,M,G,XG}', '{Blanco,"Azul cielo","Azul rey","Azul marino",Rubi,Rojo,Lavanda,Bugambilia,Vino,Militar,Ebano,Salvia}', '{}',
   '{"Lavanda": "cubrepolvo-lavanda.webp", "Salvia": "cubrepolvo-salvia.webp"}',
   '{cubrepolvo-detalle-1.webp,cubrepolvo-detalle-2.webp,cubrepolvo-detalle-3.webp}', false, 80),
  ('cubrepolvo-estampado', 'Cubrepolvo estampado', 'Cubrepolvo', 'Mujer', null,
   'Mangas y cuello en color con cierre · Bolsillos laterales', null,
   '{XCH,CH,M,G,XG}', '{"Estampado lila","Estampado rosas"}', '{}',
   '{"Estampado lila": "cubrepolvo-estampado-lila.webp", "Estampado rosas": "cubrepolvo-estampado-rosas.webp"}',
   '{}', false, 81)
)
insert into public.products as p
  (id, name, category, gender, collection, price, note, description, sizes, colors, pants_options, photos, gallery, featured, active, sort_order)
select id, name, category, gender, collection, null, note, description, sizes, colors, pants_options, photos, gallery, featured, true, sort_order
from catalog
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  gender = excluded.gender,
  collection = excluded.collection,
  note = excluded.note,
  description = excluded.description,
  sizes = excluded.sizes,
  colors = excluded.colors,
  pants_options = excluded.pants_options,
  -- Las fotos subidas desde el panel (direcciones https) se conservan.
  photos = excluded.photos || coalesce((select jsonb_object_agg(key, value) from jsonb_each(p.photos) where value #>> '{}' like 'http%'), '{}'::jsonb),
  gallery = excluded.gallery || coalesce((select array_agg(g) from unnest(p.gallery) g where g like 'http%'), '{}'),
  -- Solo los precios de ejemplo pasan a "Precio a consultar".
  price = case when p.price in (899, 949) then null else p.price end,
  -- Los que eran borradores (Aura, Dalia, Siena, Overol) ahora ya están completos.
  featured = case when not p.active then excluded.featured else p.featured end,
  active = true,
  updated_at = now();

-- 3. Cubrepolvos de ejemplo del prototipo (no están en el catálogo)
delete from public.inventory where product_id in ('clasico', 'esencial');
delete from public.products where id in ('clasico', 'esencial');

-- 4. Gorros: precios de ejemplo → "Precio a consultar"
update public.products set price = null, updated_at = now()
where category = 'Gorro quirúrgico' and price in (249, 269);

-- 5. Portadas con fotos del catálogo (solo cambia las que no editaste)
update public.banners set image = 'contempo-rojo-hincada.webp', subtitle = 'Letilla cuello Mao y bolsillos laterales. Elige tu pantalón: jogger o recto.'
where title = 'Tu turno, a tu ritmo.' and image = 'blanco.webp';
update public.banners set image = 'clasia-bugambilia.webp'
where title = 'Color para cada guardia.' and image = 'bugambilia.webp';
update public.banners set image = 'siena-rosita.webp'
where title = 'Mide una vez, acierta siempre.' and image = 'militar.webp';

insert into public.banners (eyebrow, title, subtitle, image, button_text, link, sort_order)
select 'MSA Scrubs · Aguascalientes', 'Uniformes que acompañan tu forma de cuidar.',
       'Conjuntos Contempo, Clasia, Aura, Dalia, Siena y Overol en tallas XCH a XG.',
       'portada-equipo.webp', 'Ver colecciones', '#colecciones', 5
where not exists (select 1 from public.banners where image = 'portada-equipo.webp');

insert into public.banners (eyebrow, title, subtitle, image, button_text, link, sort_order)
select 'Colección Aura', 'Manga pétalo, caída ligera.', 'Corte semi holgado y pantalón recto con ligera campana.',
       'aura-bandera.webp', 'Ver Aura', '#producto=aura', 25
where not exists (select 1 from public.banners where image = 'aura-bandera.webp');

-- 6. Pedidos con productos sin precio: se registran y se cotizan por WhatsApp.
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
  v_quotes boolean := false;
  v_id bigint;
  item jsonb;
  p public.products;
  qty integer;
  v_variant text;
begin
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
    if not found then
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
    if p.price is null then v_quotes := true; end if;
    v_items := v_items || jsonb_build_object(
      'product_id', p.id, 'product_name', p.name, 'gender', p.gender,
      'variant', v_variant, 'color', item ->> 'color', 'size', item ->> 'size',
      'quantity', qty, 'price', p.price);
    v_total := v_total + coalesce(p.price, 0) * qty;
  end loop;

  insert into public.orders (user_id, customer_name, phone, city, note, items, total)
  values (auth.uid(), v_name, v_phone, v_city, v_note, v_items, v_total)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'total', v_total, 'quotes', v_quotes);
end;
$$;

revoke execute on function public.create_order(jsonb, jsonb, text) from public;
grant execute on function public.create_order(jsonb, jsonb, text) to anon, authenticated;
