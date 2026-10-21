# DISTRIBUIDORA CLARITA — Guía de publicación y administración

## Qué incluye
- Sitio adaptable para computadora, tablet y móvil.
- Catálogo con categorías, fotografía, descripción, presentación, filtros, búsqueda y ordenamiento.
- Carrito que acumula varios productos, cantidades y subtotal de productos con precio definido.
- Pedido de todos los productos juntos al WhatsApp **+502 5830-4062**, con nombre, destino y tipo de entrega.
- Sala de ventas: **Llanos de Urbina, Cantel, Quetzaltenango** (el enlace de Google Maps es una búsqueda de referencia, no una ubicación exacta confirmada).
- 9 fichas iniciales basadas en los recursos proporcionados por el cliente; el panel admite productos adicionales.
- Panel `/admin.html` que permite editar fotografías, precios, stock, descripción, promociones y visibilidad.
- Plantilla SQL con controles de acceso para la integración de Supabase.
- Archivos optimizados WEBP, etiquetas ALT, metadatos SEO, favicon y vista previa para redes sociales.

## ESTADO REAL Y LÍMITES (IMPORTANTE)
- **Lista para visualización y recibir pedidos por WhatsApp una vez publicada en un hosting con HTTPS.**
- **Sin Supabase:** el panel de administración funciona solo como DEMOSTRACIÓN en el navegador del administrador. Los cambios locales no se reflejan a los visitantes ni a otros dispositivos. En esa modalidad las fotos nuevas no se cargan en el hosting, y los cambios se guardan en `localStorage`. No se debe vender esa modalidad como un panel remoto completo.
- **Con Supabase:** puedes iniciar sesión con correo/contraseña y guardar fichas para que la web pública las lea. El administrador puede subir fotografías a un almacenamiento público (solo fotos), publicar promociones y modificar existencias desde el navegador. Se requiere configurar Supabase y asignar permiso al usuario. No hay contraseña preconfigurada.
- **El catálogo inicial NO tiene precios ni inventarios confirmados**: aparecen como pendientes y se consulta por WhatsApp. No se ha inventado ningún precio ni cantidad.
- **El pedido se transmite al pulsar el botón de WhatsApp**, y el cliente debe pulsar *Enviar* dentro de WhatsApp. No hay cobro electrónico ni confirmación automática. El envío y la existencia no se calculan ni reservan automáticamente.
- Dominio y servicios **no están comprados, registrados ni activados**. El despliegue final requiere acceso del propietario a sus cuentas y confirmación de datos.

## Publicar en GitHub Pages
1. Descomprime el ZIP.
2. Abre el repositorio GitHub de Distribuidora CLARITA (que sea propiedad de la empresa, no del proveedor) y sube el contenido **INTERIOR** de la carpeta `Distribuidora_Clarita_Premium`: `index.html`, `admin.html`, `privacidad.html`, carpetas `assets/`, `css/`, `js/`, `backend/`, `docs/` y el archivo `README.md`.
3. En **Settings > Pages**, selecciona *Deploy from a branch*, `main`, `/(root)` y guarda.
4. Comprueba que `https://USUARIO.github.io/REPO/` muestre los productos y que al agregar varios artículos el botón del carrito abra WhatsApp con toda la lista.
5. Para un dominio propio, configura el DNS en la empresa registradora según las instrucciones vigentes de GitHub Pages. Evita usar un dominio sin verificar la propiedad.
6. Revisa el candado SSL y usa HTTPS. En `index.html` ajusta la etiqueta `og:image` a la URL HTTPS absoluta, por ejemplo `https://DOMINIO.gt/assets/brand/og-clarita.jpg` para que las redes muestren la imagen correcta.

## Habilitar administración REMOTA real (Supabase)
1. Crea un proyecto Supabase **en la cuenta propiedad de Distribuidora CLARITA**: <https://supabase.com>.
2. En SQL Editor ejecuta **`backend/supabase.sql`** COMPLETO. Instala las tablas, las políticas RLS de lectura pública y escritura administrada, bucket de fotografías y productos iniciales.
3. En **Authentication > Users**, crea al usuario administrador con su correo personal empresarial y contraseña robusta. Verifica su correo si la plataforma lo requiere.
4. En **SQL Editor**, ejecuta sustituyendo el correo por el correo real (solo desde el SQL Editor de la cuenta propietaria):

   ```sql
   insert into public.clarita_admins(user_id)
   select id from auth.users where email='correo@empresa.com'
   on conflict (user_id) do nothing;
   ```

5. En Supabase, sección **Project Settings > API** o **Connect**, copia el `Project URL` y el `anon` / `publishable key` público.
6. Abre **`js/config.js`**, completa `supabaseUrl` y `supabaseAnonKey` (deja intacto el teléfono). **NUNCA** pongas `service_role`, `secret key`, credenciales de propietario ni contraseñas en `config.js` o GitHub.
7. Sube el `js/config.js` modificado y el resto del proyecto a GitHub. En producción la tienda usará el contenido del servidor automáticamente en lugar de los productos de demostración.
8. Entra a `https://TU_DOMINIO/admin.html`, ingresa con el usuario del paso 3 y confirma que puedes editar un precio, cambiar una imagen y visualizarlo desde otro navegador. No compartas la contraseña.
9. En **Authentication > URL configuration** y **Settings** revisa URLs autorizadas, política de registro y seguridad. Recomendación: mantener el registro público deshabilitado si solo administradores deben ingresar.

### Seguridad y propiedad
- Las políticas RLS restringen altas, bajas, modificaciones y subida de fotos a usuarios marcados en `clarita_admins`.
- La clave de publicación es **pública**, como corresponde a las aplicaciones frontend Supabase. **Nunca debe copiarse una clave `service_role`.**
- Aunque `admin.html` sea una URL pública, **las acciones reales requieren iniciar sesión y autorización**. La protección está en la base de datos, no en ocultar el archivo.
- Mantener como propietarios de dominio, GitHub, Supabase y WhatsApp Business a Distribuidora CLARITA; proveedor/developer solo con accesos delegados.
- Entregar al cliente los accesos en un gestor de contraseñas o canal seguro. **No poner contraseñas dentro del ZIP.**
- Configurar recuperación de contraseña y doble factor donde el proveedor lo permita; guardar respaldo del catálogo con el botón «Exportar catálogo».
- Los planes gratuitos de hosting/BD dependen de límites y condiciones de cada proveedor; verificar precios vigentes antes de contratar. Para operación continua pueden requerirse planes pagos.

## Gestión cotidiana
- Ir a `/admin.html`, ingresar y pulsar «Nuevo producto» para agregarlo.
- Asignar nombre, categoría, unidad, descripción, foto, precio, stock, promoción y visibilidad. Guardar.
- Para fichas antiguas usar «Editar»; con «Eliminar» se borra una ficha de forma permanente.
- Stock vacío = **pendiente por confirmar**. Stock 0 = **agotado** e inhabilita el botón de compra.
- Precio vacío = **pendiente por confirmar**; aun así puede formar parte del carrito para cotización.
- Realizar pruebas de pedido desde computadora y móvil. Al recibir el pedido, revisar WhatsApp y coordinar manualmente pago, envío y existencias.
- La tienda **no descuenta existencias automáticamente** porque no confirma pagos ni procesa órdenes; la administración debe registrar cada venta confirmada y actualizar el stock. Se puede conectar un backend transaccional en una fase futura.

## Personalización
- Colores: `css/styles.css` variables CSS al principio (azul, amarillo, rojo según logotipo).
- Logo e imágenes: `assets/brand/` y `assets/products/`.
- Contacto: `js/config.js` y enlaces fijos en `index.html`.
- Meta descripción, nombre y vista previa: encabezado de `index.html`.

## Archivos principales
- `index.html`: página de ventas.
- `admin.html`: interfaz de administración.
- `js/app.js`: catálogo, filtros, carrito y envío de WhatsApp.
- `js/products.js`: productos de ejemplo usados SOLO sin backend.
- `js/core.js`: funciones comunes de almacenamiento y API.
- `js/admin.js`: gestión del inventario.
- `backend/supabase.sql`: modelo de datos, RLS y datos iniciales.
- `privacidad.html`: página de privacidad inicial, **debe revisarse legalmente antes de publicar**.

## Comprobación rápida
- [ ] Se ve completo en teléfono y computadora.
- [ ] WhatsApp destino **+502 5830-4062**.
- [ ] Agregar varios productos, cambiar cantidades, eliminar artículos y formar pedido.
- [ ] El mensaje sale con nombre, municipio/departamento y entrega.
- [ ] Revisar imágenes, precios y existencias ANTES de anunciar la tienda.
- [ ] Configurar Supabase y autorización si el cliente necesita publicar cambios sin desarrollador.
- [ ] Verificar DNS, HTTPS, página en GitHub y og:image absoluto.
- [ ] Entregar claves **solo al propietario** por un canal seguro.
