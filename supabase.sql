-- DISTRIBUIDORA CLARITA — base de datos segura para catálogo público y administración
-- Ejecutar este script en Supabase > SQL Editor > New query.
-- Recomendado: crear proyecto propio de la empresa y un usuario en Authentication > Users.

create table if not exists public.clarita_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);

create table if not exists public.products (
 id text primary key,
 name text not null check (char_length(name) between 1 and 100),
 category text not null check (category in ('ceras','mechas','aromas','colorantes','moldes','accesorios')),
 description text not null default '',
 unit_label text not null default '',
 image text not null default 'assets/brand/logo-clarita.webp',
 alt text not null default '',
 price numeric(12,2) check (price is null or price >= 0),
 stock integer check (stock is null or stock >= 0),
 featured boolean not null default false,
 promo text not null default '',
 active boolean not null default true,
 sort_order integer not null default 100,
 updated_at timestamptz not null default now()
);

create index if not exists idx_clarita_products_active on public.products(active, sort_order);
alter table public.clarita_admins enable row level security;
alter table public.products enable row level security;

-- Un usuario autenticado solo puede ver su propio registro de autorización;
-- los clientes jamás pueden crear administradores.
drop policy if exists "clarita_admin_self_read" on public.clarita_admins;
create policy "clarita_admin_self_read" on public.clarita_admins for select to authenticated using (user_id = (select auth.uid()));

-- Público solo puede consultar productos activos.
drop policy if exists "clarita_read_public" on public.products;
create policy "clarita_read_public" on public.products for select to anon using (active = true);
-- Administradores ven todos los registros, incluso los ocultos.
drop policy if exists "clarita_read_admin" on public.products;
create policy "clarita_read_admin" on public.products for select to authenticated using (
 exists (select 1 from public.clarita_admins a where a.user_id = (select auth.uid()))
);
-- Escritura exclusiva para administradores autorizados.
drop policy if exists "clarita_insert_admin" on public.products;
create policy "clarita_insert_admin" on public.products for insert to authenticated with check (
 exists (select 1 from public.clarita_admins a where a.user_id = (select auth.uid()))
);
drop policy if exists "clarita_update_admin" on public.products;
create policy "clarita_update_admin" on public.products for update to authenticated using (
 exists (select 1 from public.clarita_admins a where a.user_id = (select auth.uid()))
) with check (
 exists (select 1 from public.clarita_admins a where a.user_id = (select auth.uid()))
);
drop policy if exists "clarita_delete_admin" on public.products;
create policy "clarita_delete_admin" on public.products for delete to authenticated using (
 exists (select 1 from public.clarita_admins a where a.user_id = (select auth.uid()))
);

grant usage on schema public to anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.clarita_admins to authenticated;

-- Bucket público: solo las fotografías son públicas, nunca contraseñas ni datos de clientes.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('catalogo','catalogo',true,4194304,array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set public=true,file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png','image/webp']::text[];

drop policy if exists "clarita_storage_upload_admin" on storage.objects;
create policy "clarita_storage_upload_admin" on storage.objects for insert to authenticated with check (
 bucket_id='catalogo' and exists (select 1 from public.clarita_admins a where a.user_id=(select auth.uid()))
);
drop policy if exists "clarita_storage_update_admin" on storage.objects;
create policy "clarita_storage_update_admin" on storage.objects for update to authenticated using (
 bucket_id='catalogo' and exists (select 1 from public.clarita_admins a where a.user_id=(select auth.uid()))
);
drop policy if exists "clarita_storage_delete_admin" on storage.objects;
create policy "clarita_storage_delete_admin" on storage.objects for delete to authenticated using (
 bucket_id='catalogo' and exists (select 1 from public.clarita_admins a where a.user_id=(select auth.uid()))
);

-- Productos iniciales: precios y stock NULL (sin inventar datos).
insert into public.products (id,name,category,description,unit_label,image,alt,price,stock,featured,promo,active,sort_order) values
('cera-soya-perlas','Cera de soya en perlas','ceras','Cera vegetal en perlas, punto de fusión 52–56 °C indicado en el empaque. Especial para velas de molde.','Bolsa de 1 libra (454 g)','assets/products/cera-soya-perlas.webp','Cera de soya en perlas CLARITA',null,null,true,'',true,10),
('cera-soya-escamas','Cera de soya en escamas','ceras','Cera vegetal en escamas, de bajo punto de fusión. Para velas aromáticas en recipientes.','Bolsa de 1 libra (454 g)','assets/products/cera-soya-escamas.webp','Cera de soya en escamas CLARITA',null,null,true,'',true,20),
('cera-coco','Cera vegetal de coco','ceras','Cera vegetal de coco en escamas, con punto de fusión indicado de 38–42 °C.','Bolsa de 1 libra (454 g)','assets/products/cera-coco.webp','Cera vegetal de coco CLARITA',null,null,true,'',true,30),
('mechas-madera','Mechas de madera','mechas','Mechas de madera con base metálica, para velas de cera vegetal.','Paquete de 12 unidades','assets/products/mechas-madera.webp','Mechas de madera CLARITA',null,null,false,'',true,40),
('kit-mechas','Kit de mechas y pabilos','mechas','Kit con 12 mechas de algodón y 12 bases metálicas, según presentación.','Kit de 12 mechas + 12 bases','assets/products/kit-mechas-pavilos.webp','Kit de mechas y pabilos CLARITA',null,null,false,'',true,50),
('kit-esencias','Kit de cinco esencias aromáticas','aromas','Kit de fragancias de rosa, melocotón, mango, cereza y lavanda para velas vegetales.','Kit de 5 frascos de 30 ml','assets/products/esencias-kit.webp','Kit de cinco esencias CLARITA',null,null,true,'',true,60),
('esencias-por-aroma','Esencias aromáticas por variedad','aromas','Fragancias para velas. Consulta aromas y presentaciones disponibles.','Aromas y presentaciones a consultar','assets/products/esencias-variedades.webp','Esencias CLARITA',null,null,false,'',true,70),
('colorantes-liquidos','Colorantes líquidos para velas','colorantes','Colorantes líquidos para ceras vegetales de soya y coco, en diferentes tonalidades.','Colores y presentaciones a consultar','assets/products/colorantes.webp','Colorantes CLARITA',null,null,false,'',true,80),
('moldes-silicona','Moldes de silicona para velas','moldes','Diseños de flores, corazones, burbujas, geométricos y otros modelos decorativos.','Modelo a elección y disponibilidad','assets/products/moldes-silicona.webp','Moldes CLARITA',null,null,true,'',true,90)
on conflict (id) do nothing;

-- ÚLTIMO PASO, MANUAL EN EL SQL EDITOR, DESPUÉS DE CREAR EL USUARIO:
-- insert into public.clarita_admins (user_id)
-- select id from auth.users where email = 'CORREO_DEL_ADMINISTRADOR@DOMINIO.COM'
-- on conflict (user_id) do nothing;
-- NO elimines el comentario ni dejes a cualquier usuario insertarse como administrador.
