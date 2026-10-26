# MSA Scrubs — Tienda online

Sitio estático: solo HTML, CSS y JavaScript. **No necesita instalar nada ni compilar** (sin Replit, sin Node, sin pnpm).

## Qué hay en cada carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `sitio/` | **Lo único que se publica.** Es la página completa. |
| `sitio/index.html` | Estructura y textos de la página. |
| `sitio/styles.css` | Diseño (colores, tamaños, versión celular). |
| `sitio/script.js` | Catálogo de productos, carrito, guía de tallas, WhatsApp. |
| `sitio/images/` | Fotos que usa la página (en WebP, ligeras). |
| `recursos/` | Fotos originales y referencias. **No se publican.** |
| `netlify.toml` | Le dice a Netlify que publique la carpeta `sitio`. |

## Ver la página en tu computadora

1. Abre la carpeta `sitio`.
2. Da doble clic en `index.html`.
3. Se abre en tu navegador. Las fuentes necesitan internet; lo demás funciona sin conexión.

## Publicar en Netlify — Opción A: arrastrar la carpeta (la más fácil)

1. Entra a https://app.netlify.com e inicia sesión.
2. En el menú de la izquierda da clic en **Sites** (o **Projects**).
3. Da clic en **Add new site** → **Deploy manually**.
4. Arrastra la carpeta **`sitio`** (no la carpeta completa del proyecto) al recuadro que dice "Drag and drop your site output folder here".
5. Espera unos segundos. Netlify te da una dirección tipo `https://nombre-raro.netlify.app`.
6. Para cambiar el nombre: **Site configuration** → **Change site name**.

**Para actualizar después:** entra al sitio en Netlify → pestaña **Deploys** → arrastra otra vez la carpeta `sitio` al recuadro de abajo.

## Publicar en Netlify — Opción B: desde GitHub (se actualiza solo)

1. Sube **toda** la carpeta del proyecto (con `netlify.toml`) a un repositorio de GitHub.
2. En Netlify: **Add new site** → **Import an existing project** → **GitHub** → elige el repositorio.
3. En la pantalla de configuración deja todo como viene. Netlify lee `netlify.toml` y ya sabe que debe publicar `sitio` y que no hay comando de compilación.
4. Da clic en **Deploy**.
5. Cada vez que subas cambios a GitHub, Netlify publica la nueva versión solo.

## Cambios frecuentes

- **Número de WhatsApp:** `sitio/script.js`, línea 3 (`WHATSAPP_NUMBER`), y los dos enlaces `wa.me` en `sitio/index.html`.
- **Productos, precios, tallas y colores:** lista `products` al inicio de `sitio/script.js`.
- **Fotos de un color:** guarda la foto en `sitio/images/` y agrégala en el campo `photos` del producto, por ejemplo `photos: { "Vino": "vino.webp" }`.
