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
