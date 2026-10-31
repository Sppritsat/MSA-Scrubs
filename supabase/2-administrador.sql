-- =====================================================================
-- MSA Scrubs · Dar permisos de administrador
-- 1. Cambia el correo de abajo por el de Emilio (deja las comillas).
-- 2. Supabase → SQL Editor → New query → pega esto → Run.
-- Puedes repetirlo con otro correo para agregar más administradores.
-- =====================================================================

insert into public.admins (email)
values ('CAMBIA-ESTE-CORREO@ejemplo.com')
on conflict (email) do nothing;

-- Para quitar a un administrador:
-- delete from public.admins where email = 'correo@ejemplo.com';
