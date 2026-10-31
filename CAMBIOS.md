# Cambios aplicados — MSA Scrubs

Proyecto convertido a sitio estático: la página está en `sitio/` y ya no depende de Replit, pnpm ni Vite.

## Ronda 1

1. **Fotos a WebP** (`public/images/`): de ~2.5 MB a ~200 KB. El logo sigue en PNG.
2. **`script.js`**:
   - La guía de tallas abierta desde un producto regresa al producto al cerrarla.
   - Si la pieza sugerida para completar el conjunto no existe en la talla elegida, el botón cambia a "Elegir talla".
   - "Carrito (N)" cuenta piezas, no renglones.
   - Al cerrar una ventana, el foco del teclado vuelve al botón que la abrió.
   - El menú móvil se cierra al tocar una opción (`aria-expanded`).
   - Ya no aparece la letra grande encima de las fotos reales.
   - El año del pie de página se actualiza solo.

## Ronda 2 (indicaciones de Emilio)

1. **WhatsApp oficial: 449 125 1554** (`524491251554`) en `script.js` línea 3, enlaces de `index.html`, pie de página y formulario de pedido.
2. **Tallas en español**: la guía ahora usa XCH / CH / M / G / XG con la equivalencia internacional debajo (XS / S / M / L / XL). Se quitó 2XG porque no existe en la guía oficial.
   - La guía se abre ya posicionada en Dama/Caballero y Filipina/Pantalón según el producto que estás viendo.
3. **Modelos separados por sexo**:
   - Cada modelo de dama solo se vende como dama y cada modelo de caballero solo como caballero. Ya no aparece el paso "Sexo" en esos modelos.
   - Las piezas unisex (Pantalón MSA, Clasia · Jogger, gorros, cubrepolvos) aparecen en ambos filtros y sí piden elegir sexo, porque su talla depende de la guía de dama o de caballero.
   - "Completa tu conjunto" sugiere la filipina del mismo sexo (Dama → Clasia · Pétalo, Caballero → Clasia · Sport).
4. **Fotos renombradas** según su color real (`src/assets/product-photos/`):
   - `azul-rey.png` → `militar.png` (ya se usa en Clasia · Campana, color Militar)
   - `militar.png` → `verde-salvia.png`
   - `bugambilia.png` → `terracota.png`
   - `rubi-claro-terra.png` → `ladrillo.png`
   - Nueva `bugambilia.png`, recortada de las fotos que adjuntaste; se usa en Clasia · Escote V.
5. **Texto actualizado**: "Colección 2024" → "Colección 2026".

## Pendiente de confirmar

- **Clasia · Escote V** y **Clasia · Sport** están dados de alta como modelos de **Caballero**, pero todas las fotos de Escote V muestran a una mujer. Confirmar a qué sexo pertenece cada modelo (lista de productos al inicio de `script.js`, campo `gender`).
- **Verde salvia, terracota y ladrillo** tienen foto, pero no están en la carta de colores. Si se venden, hay que agregarlos a `SCRUB_COLORS` y `colorStyles` en `script.js`.
- **XCH** está en la guía de dama, pero ningún producto la ofrece. Agregarla en `sizes` si se fabrica.

## Ronda 3: sin Replit

- Se quitó todo lo de Replit: `.replit-artifact`, `pnpm-workspace.yaml`, `api-server`, `mockup-sandbox`, `lib/`, la versión en React (`src/`) y las ~60 dependencias.
- La página quedó en `sitio/` (index.html, styles.css, script.js, images/) y no requiere compilación.
- `netlify.toml` publica `sitio` directamente, sin comando de build.
- El script se carga con `defer`, así que `index.html` también funciona con doble clic.
- Fotos originales y referencias guardadas en `recursos/` (no se publican).
- Ver `README.md` para los pasos para publicar en Netlify.

## Ronda 4: cuentas, medidas, talla recomendada e inventario (Supabase)

- **Base de datos** (`supabase/1-crear-base-de-datos.sql`): tablas de perfiles (medidas), inventario, pedidos y administradores, con reglas de seguridad. Probadas en PostgreSQL: un visitante no puede tocar el inventario, un cliente solo ve sus medidas y un correo sin confirmar no obtiene permisos de admin.
- **Tienda**:
  - Botón de cuenta (ícono de persona): iniciar sesión, crear cuenta, recuperar contraseña y guardar medidas. Sin cuenta, las medidas se guardan en el navegador.
  - Talla recomendada en cada producto (marcada con un punto y preseleccionada), en la guía de tallas y en "Mi cuenta".
  - Tallas sin existencias tachadas y no se pueden agregar al carrito.
  - Cada pedido enviado a WhatsApp se registra como "pendiente".
  - Si Supabase no responde, la tienda funciona igual que antes.
- **Panel** (`/admin.html`): inventario por modelo, sexo, color y talla; lista de pocas existencias; pedidos pendientes, confirmados y cancelados; confirmar descuenta existencias y avisa si no alcanzan.
- `catalogo.js` reúne productos y guía de tallas (antes estaban dentro de `script.js`).
- La guía de Filipina Caballero dice "Cintura", pero sus valores (99–117 cm) corresponden al pecho; para recomendar talla se compara con el pecho del cliente. Conviene confirmarlo con MSA.

## Ronda 5: estructura del repositorio

- Todo vive en la raíz del repositorio: `netlify.toml`, `sitio/`, `supabase/`, `recursos/`.
- Un solo `netlify.toml` (publica `sitio`). Se eliminaron las carpetas intermedias `MSA-Scrubs/` y `MSA-Scrubs-con-supabase/`.

## Ronda 6: catálogo editable, conjuntos, portadas y seguridad de pedidos

- **Regla del proveedor:** todos los uniformes se venden como conjunto. Contempo y Clasia permiten elegir pantalón **Jogger o Recto**; Aura, Dalia, Siena y Overol se venden como conjunto completo. Se quitaron las filipinas y el pantalón sueltos y la oferta de "completa tu conjunto". Gorros y cubrepolvos se quedan.
- **Catálogo y portadas en la base de datos** (`supabase/3-catalogo-portadas-y-pedidos.sql`), editables desde el panel (pestañas Productos y Portadas), con subida de fotos comprimidas a WebP.
- Aura, Dalia, Siena y Overol se crearon como **borradores** ocultos: falta capturar precio, colores y fotos.
- **Precios de ejemplo:** todos los precios venían del prototipo; hay que corregirlos en el panel.
- **Pedidos seguros:** se registran con `create_order`, que calcula el precio en el servidor, valida color, talla y pantalón, limita 3 pedidos por teléfono cada 30 minutos y tiene un campo trampa contra bots. El mensaje de WhatsApp lleva el número de pedido.
- **Inventario por pantalón:** las existencias de Contempo y Clasia se llevan por separado para Jogger y Recto.
- **Diseño inspirado en Jogs Scrubs y Dr. Mos:** carrusel de portadas con transición y zoom suave, carrusel de destacados, tarjetas de colección, galería con miniaturas en cada producto, muestras de color en las tarjetas, segunda foto al pasar el cursor, aparición suave al hacer scroll, carga con esqueletos y barra de avisos animada en celular. Todo respeta "reducir movimiento".
- **Enlaces compartibles:** `#producto=clasia`, `#mi-talla`, `#coleccion=Clasia`.
- **Carrito guardado** en el navegador al recargar.
- **Plantillas legales:** `aviso-de-privacidad.html` y `terminos.html`, con los datos por completar resaltados. Casillas de aceptación en el pedido y al crear cuenta.
- Se quitaron afirmaciones no comprobables ("Más elegido", "Favorito", "Elegidos por profesionales", avatares inventados, "30 días de cambios" sin política confirmada).
- Corregido: el campo de identificador del producto se llamaba `id` y rompía el formulario del panel.

## Ronda 7: catálogo oficial MSA (PDF)

- **Modelos completos:** Contempo, Clasia, Aura, Dalia, Siena y Overol, con las descripciones del catálogo y tallas **XCH a XG** (XS a XL). Aviso de "otras tallas sobre pedido" en cada producto.
- **Paletas oficiales por modelo:**
  - Contempo y Clasia: Blanco, Azul cielo, Azul rey, Azul marino, Rubi, Rojo, Lavanda, Bugambilia, Vino, Militar, Ebano, Menta.
  - Aura, Dalia y Siena: Olivo, Bandera, Cemento, Capuchino, Ladrillo, Chocolate, Palo de rosa, Rosita, Amarillo, Aqua.
  - Overol: Ebano, Chocolate, Ladrillo.
  - Cubrepolvo liso: colores lisos (incluye Salvia). Cubrepolvo estampado: lila y rosas.
- **Colores renombrados según el catálogo:** el rojo ahora es "Rojo" y el rosa es "Rubi" (antes "Rubi" y "Rubi claro"). El script 4 también corrige el inventario.
- **49 fotos nuevas** sacadas del PDF (foto por color + 3 detalles por modelo), en WebP ligero. Portada nueva con la foto del equipo.
- **Cubrepolvos del catálogo** en lugar de los del prototipo ("Clásico" y "Esencial" se eliminaron).
- **"Precio a consultar":** el catálogo no trae precios. Un producto sin precio se muestra y se puede pedir; el carrito y el WhatsApp indican "piezas por cotizar". Los precios de ejemplo del prototipo pasan a "a consultar"; los que escribiste en el panel se respetan.
- Panel: colores agrupados por paleta, botón "Usar solo esta paleta", y se puede publicar sin precio.

## Ronda 8: seguimiento de pedidos

- **Estados:** Pendiente → Confirmado → Pagado → En preparación → Enviado → Entregado, y Cancelado. Cada cambio queda con fecha y hora (`supabase/5-seguimiento-de-pedidos.sql`).
- **Panel → Pedidos:** pestañas Por atender / En proceso / Entregados / Cancelados; línea de tiempo; botón para pasar al siguiente estado; "Cambiar a…" para correcciones; cancelar con confirmación.
- **Envío con Skydropx:** paquetería, número de guía y enlace de rastreo (se pega el que da Skydropx con cada guía).
- **Avisar por WhatsApp:** mensaje listo por estado, con la guía y el enlace de seguimiento.
- **Existencias:** se descuentan al confirmar y se regresan al cancelar (antes cancelar no las regresaba).
- **Tienda:** "Rastrear pedido" (número + últimos 4 dígitos del teléfono, con límite de intentos) y "Mis pedidos" en Mi cuenta. El mensaje de WhatsApp del pedido incluye el enlace de seguimiento.
- El rastreo sin cuenta no muestra teléfono, ciudad ni notas del pedido; solo el primer nombre, piezas, estado y envío.
