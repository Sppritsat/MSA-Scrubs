# MSA Scrubs — Tienda online

Sitio estático (HTML, CSS y JavaScript) publicado en **Cloudflare**, con base de datos en **Supabase**:

- **Catálogo editable** desde el panel: productos, precios, colores, tallas y fotos.
- **Portadas** (carrusel principal) editables desde el panel.
- **Conjuntos:** Contempo y Clasia permiten elegir pantalón **Jogger o Recto**. Los demás modelos se venden como conjunto completo.
- **Cuentas de clientes** con sus medidas y **talla recomendada** en cada conjunto.
- **Inventario** por modelo, pantalón, color y talla. Las tallas en 0 aparecen agotadas.
- **Pedidos** por WhatsApp con número de pedido. El **precio lo calcula la base de datos**, no el navegador.
- **Panel de administración** en `/admin.html`.

## Qué hay en cada carpeta

| Archivo | Para qué sirve |
|---|---|
| `sitio/index.html` | La tienda. |
| `sitio/admin.html` | Panel: inventario, productos, portadas y pedidos. |
| `sitio/aviso-de-privacidad.html`, `sitio/terminos.html` | **Plantillas** legales para completar (ver abajo). |
| `sitio/config.js` | Dirección y llave **publicable** de Supabase. |
| `sitio/catalogo.js` | Catálogo de **respaldo** (solo si Supabase no responde) y guía de tallas. |
| `sitio/datos.js` | Conexión con Supabase. |
| `sitio/script.js`, `sitio/styles.css` | Funcionamiento y diseño de la tienda. |
| `sitio/admin.js`, `sitio/admin.css` | Funcionamiento y diseño del panel. |
| `supabase/1-crear-base-de-datos.sql` | Tablas de cuentas, inventario y pedidos (ya ejecutado). |
| `supabase/2-administrador.sql` | Da permisos de administrador a un correo (ya ejecutado). |
| `supabase/3-catalogo-portadas-y-pedidos.sql` | Catálogo, portadas, fotos y pedidos seguros. |
| `supabase/4-catalogo-oficial-msa.sql` | Carga el catálogo oficial (modelos, paletas, tallas y fotos del PDF). |
| `supabase/5-seguimiento-de-pedidos.sql` | **Nuevo:** estados del pedido, guía de envío y rastreo para clientes. |
| `wrangler.jsonc` | Le dice a Cloudflare que publique la carpeta `sitio`. |
| `recursos/` | Fotos originales y referencias. No se publican. |

---

## Actualizar a esta versión (en este orden)

### Paso 1 · Ejecutar los scripts en Supabase (antes de subir los archivos)

1. Entra a https://supabase.com/dashboard y abre el proyecto de MSA.
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Si **todavía no** ejecutaste el 3: abre `supabase/3-catalogo-portadas-y-pedidos.sql` con el Bloc de notas, copia **todo**, pégalo y da clic en **Run**. Debe decir **Success. No rows returned**.
4. Da clic en **New query** otra vez, pega **todo** `supabase/4-catalogo-oficial-msa.sql` y da clic en **Run** (si no lo habías ejecutado).
5. Da clic en **New query** otra vez, pega **todo** `supabase/5-seguimiento-de-pedidos.sql` y da clic en **Run**.

El script 4 no borra los precios que ya hayas escrito ni las fotos que subiste desde el panel. Se puede ejecutar más de una vez.

> Si subes los archivos antes de este paso, los pedidos fallarán hasta que lo ejecutes.

### Paso 2 · Subir los archivos a GitHub

1. Descomprime el zip.
2. En GitHub abre el repositorio, rama `main`, y da clic en **Add file → Upload files**.
3. Arrastra `sitio`, `supabase`, `README.md`, `CAMBIOS.md`, `wrangler.jsonc` y `netlify.toml`. Los archivos con el mismo nombre se reemplazan. (GitHub acepta hasta 100 archivos por subida; `recursos` no cambió y no hace falta volver a subirla.)
4. Da clic en **Commit changes**. Cloudflare publica solo en uno o dos minutos.

### Paso 3 · Revisar el catálogo en el panel

1. Abre `https://msa-scrubs.<tu-subdominio>.workers.dev/admin.html` y entra.
2. Pestaña **Productos**:
   - El catálogo en PDF no trae precios, así que los productos aparecen con **"Precio a consultar"**. Escribe el precio de cada uno y presiona **Guardar producto**. Si lo dejas vacío, se sigue vendiendo y el precio se confirma por WhatsApp.
   - Revisa los **gorros quirúrgicos** (Pulso, Aurora, Guardia): no vienen en el catálogo; sus nombres y colores son del prototipo. Corrígelos o desmarca **Visible**.
3. Pestaña **Portadas**: cambia textos y fotos del carrusel principal.

### Paso 4 · Completar las páginas legales

1. Abre `sitio/aviso-de-privacidad.html` y `sitio/terminos.html` con el Bloc de notas.
2. Busca (Ctrl+F) cada `<mark>` y reemplaza el texto entre corchetes con el dato real, por ejemplo `<mark>[CORREO DE CONTACTO]</mark>` → `contacto@msascrubs.mx`. Borra las etiquetas `<mark>` y `</mark>`.
3. Cuando un abogado lo revise, borra el renglón que empieza con `<p class="legal-draft"`.
4. Sube los dos archivos a GitHub (Add file → Upload files → Commit).

---

## Uso diario del panel (`/admin.html`)

**Productos**
- **Nuevo producto:** escribe el nombre; el identificador (para el enlace) se llena solo.
- **Pantalón:** marca "El cliente elige pantalón Jogger o Recto" solo en Contempo y Clasia.
- **Colores:** aparecen agrupados por las paletas del catálogo. "Usar solo esta paleta" marca de golpe los colores de esa paleta.
- **Precio vacío** = "Precio a consultar": el cliente puede pedirlo y se cotiza por WhatsApp.
- **Fotos por color:** botón **Subir** debajo de cada color. Se reducen solas a un tamaño ligero.
- **Fotos de detalle:** aparecen en la galería del producto (cuello, bolsillos, etc.).
- **Destacados:** marca "Mostrar en Destacados" para que salga en el carrusel de la portada.
- Un producto solo se ve en la tienda si está **Visible**, tiene **precio** y al menos **un color**.

**Portadas**
- Cada portada lleva texto pequeño, título, subtítulo, botón y foto.
- "El botón lleva a" permite abrir un producto, filtrar una colección, ir a la tienda o abrir "Calcular mi talla".
- Orden: el número menor sale primero. Desmarca "Visible" para ocultarla sin borrarla.

**Inventario**
- Elige el modelo y, en Contempo o Clasia, el pantalón (Jogger o Recto): cada uno lleva sus propias existencias.
- **0** = agotado. **Vacío (—)** = no se controla.

**Pedidos y seguimiento**
- Cada pedido enviado a WhatsApp llega a **Por atender** como **Pendiente**, con su número (el cliente lo menciona: "Pedido #12").
- Estados: **Pendiente → Confirmado → Pagado → En preparación → Enviado → Entregado** (o **Cancelado**). Cada cambio guarda fecha y hora.
- El botón naranja pasa el pedido al **siguiente estado**. Para corregir un error usa **Cambiar a… → Aplicar**.
- **Existencias:** se descuentan al confirmar y **se regresan si se cancela**. Si no alcanzan, avisa y no cambia nada.
- **Enviado:** antes de marcarlo, escribe la **paquetería**, el **número de guía** y pega el **enlace de rastreo** que Skydropx da con la guía. Se pueden corregir después en "Corregir datos de envío".
- **Avisar por WhatsApp:** abre el chat del cliente con el mensaje del estado actual ya escrito, incluido su enlace de seguimiento. Solo presiona enviar.
- Por seguridad, la base de datos rechaza más de 3 pedidos del mismo teléfono en 30 minutos.

## Seguimiento para el cliente

- **Sin cuenta:** en la tienda, **Rastrear pedido** (menú y pie de página). Escribe su número de pedido y los **últimos 4 dígitos de su teléfono**. Después de 8 intentos fallidos, ese pedido se bloquea una hora.
- **Con cuenta:** **Mi cuenta → Mis pedidos** muestra todos sus pedidos hechos con la sesión iniciada.
- Ve la línea de tiempo con fechas, sus piezas, y cuando se envía: paquetería, guía y botón **Rastrear con la paquetería**.
- El enlace directo es `https://…/#rastreo=12` (va en el mensaje de WhatsApp de cada pedido).

## Enlaces útiles para compartir

- Un producto: `https://…/#producto=contempo`
- Rastrear un pedido: `https://…/#rastreo=12`
- Calcular talla: `https://…/#mi-talla`
- Una colección: `https://…/#coleccion=Clasia`

## Seguridad

- `config.js` usa la llave **publicable**. **Nunca** pongas la llave **secret / service_role** en `sitio/`.
- Las reglas de la base de datos deciden quién puede hacer qué: solo administradores cambian productos, portadas, fotos e inventario. Cada cliente ve solo sus medidas.
- Los pedidos solo entran por la función `create_order`, que toma los precios del catálogo y valida colores, tallas y pantalón.

## Si algo no funciona

- **La tienda muestra el catálogo viejo o todo disponible:** el proyecto gratuito de Supabase se pausa tras una semana sin uso. En Supabase da clic en **Restore project**. Mientras tanto, la tienda usa el catálogo de respaldo.
- **"Uno de los productos ya no está disponible":** el cliente tenía en el carrito algo que se ocultó o borró. Al recargar la página se limpia.
- **No se sube una foto:** revisa que el paso 1 se haya ejecutado (crea la carpeta de fotos "productos" en Supabase → Storage).
