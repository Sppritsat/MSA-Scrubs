"use strict";
// =====================================================================
// Panel de administración: inventario, productos, portadas y pedidos.
// La seguridad real está en Supabase (reglas de la base de datos):
// aunque alguien abra esta página, sin permisos no puede cambiar nada.
// =====================================================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $("#admin-app");
const sessionBox = $("#admin-session");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = (value) => value === null || value === undefined ? "Precio a consultar" : `$${Number(value).toLocaleString("es-MX")} MXN`;
const PALETTE_COLORS = [...new Set(Object.values(PALETTES).flat())];
const slugify = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const LOW_STOCK = 2;

const admin = {
  ready: false,
  user: null,
  isAdmin: false,
  tab: "inventario",
  products: [],
  banners: [],
  productId: null,
  variant: "Jogger",
  inventory: new Map(),
  orderGroup: "pendientes",
  confirmCancel: null,
  orders: [],
  draft: null,        // producto en edición
  bannerDraft: null,  // portada en edición
  confirmDelete: false,
  uploading: false,
  message: "",
  messageType: "",
  busy: false,
};

function setMessage(message, type = "") {
  admin.message = message;
  admin.messageType = type;
  render();
}

const messageMarkup = () => admin.message ? `<p class="admin-message ${admin.messageType}" role="status">${escapeHtml(admin.message)}</p>` : "";
const productStatus = (product) => !product.active ? "Borrador" : !product.colors.length ? "Sin colores" : "Publicado";

// ---------------------------------------------------------------------
// Pantallas de acceso
// ---------------------------------------------------------------------
function loginMarkup() {
  return `<section class="admin-card admin-narrow">
    <p class="modal-eyebrow">Acceso</p>
    <h1>Panel de administración</h1>
    <p class="admin-muted">Entra con la cuenta registrada como administradora.</p>
    ${messageMarkup()}
    <form class="checkout-form" id="admin-login">
      <label>Correo<input name="email" type="email" required autocomplete="email"></label>
      <label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label>
      <button class="checkout-button inline" type="submit" ${admin.busy ? "disabled" : ""}>${admin.busy ? "Entrando…" : "Entrar"}</button>
    </form>
  </section>`;
}

function notAdminMarkup() {
  return `<section class="admin-card admin-narrow">
    <p class="modal-eyebrow">Sin permisos</p>
    <h1>Esta cuenta no es administradora</h1>
    <p class="admin-muted">${escapeHtml(admin.user.email)} inició sesión, pero no está en la lista de administradores.</p>
    <p class="admin-muted">Para darle permisos: en Supabase abre <strong>SQL Editor</strong>, pega <code>supabase/2-administrador.sql</code> con este correo y presiona <strong>Run</strong>. Después recarga esta página.</p>
  </section>`;
}

function tabsMarkup() {
  const tab = (id, label) => `<button type="button" class="${admin.tab === id ? "selected" : ""}" data-action="tab" data-value="${id}">${label}</button>`;
  return `<div class="toggle-pair admin-tabs">${tab("inventario", "Inventario")}${tab("productos", "Productos")}${tab("portadas", "Portadas")}${tab("pedidos", "Pedidos")}</div>`;
}

// ---------------------------------------------------------------------
// Inventario
// ---------------------------------------------------------------------
function currentProduct() {
  return admin.products.find((product) => product.id === admin.productId) || admin.products[0];
}

function currentVariant(product) {
  if (!hasPantsChoice(product)) return "";
  return product.pants_options.includes(admin.variant) ? admin.variant : product.pants_options[0];
}

function lowStockMarkup() {
  const low = [];
  for (const [key, stock] of admin.inventory) {
    if (stock > LOW_STOCK) continue;
    const [productId, , color, size, variant] = key.split("|");
    const product = admin.products.find((item) => item.id === productId);
    low.push({ name: product ? product.name : productId, variant, color, size, stock });
  }
  if (!low.length) return `<p class="admin-muted">Nada con ${LOW_STOCK} piezas o menos.</p>`;
  low.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, "es"));
  return `<ul class="admin-low">${low.slice(0, 40).map((item) => `<li class="${item.stock === 0 ? "out" : ""}">
    <span>${escapeHtml(item.name)}${item.variant ? ` · ${escapeHtml(item.variant)}` : ""} · ${escapeHtml(item.color)} · ${escapeHtml(item.size)}</span>
    <strong>${item.stock === 0 ? "Agotado" : item.stock}</strong></li>`).join("")}</ul>
    ${low.length > 40 ? `<p class="admin-muted">…y ${low.length - 40} más.</p>` : ""}`;
}

function productOptions(selectedId) {
  return CATEGORIES.map((category) => {
    const items = admin.products.filter((item) => item.category === category);
    if (!items.length) return "";
    return `<optgroup label="${CATEGORY_LABELS[category]}">${items.map((item) =>
      `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)}${item.active ? "" : " (borrador)"}</option>`).join("")}</optgroup>`;
  }).join("");
}

function inventoryMarkup() {
  const product = currentProduct();
  if (!product) return `<section class="admin-card"><p class="admin-muted">No hay productos. Créalos en la pestaña Productos.</p></section>`;
  const variant = currentVariant(product);
  const variantToggle = hasPantsChoice(product)
    ? `<div class="toggle-pair admin-gender">${product.pants_options.map((option) =>
      `<button type="button" class="${option === variant ? "selected" : ""}" data-action="variant" data-value="${escapeHtml(option)}">Pantalón ${escapeHtml(option.toLowerCase())}</button>`).join("")}</div>`
    : `<span class="admin-chip">Conjunto completo</span>`;
  const head = product.sizes.map((size) => `<th scope="col">${escapeHtml(size)}</th>`).join("");
  const rows = product.colors.map((color) => `<tr><th scope="row">${escapeHtml(color)}</th>${product.sizes.map((size) => {
    const key = MSA_DB.inventoryKey(product.id, product.gender, color, size, variant);
    const stock = admin.inventory.has(key) ? admin.inventory.get(key) : "";
    return `<td><input type="number" min="0" step="1" inputmode="numeric" class="${stock === 0 ? "zero" : ""}"
      aria-label="${escapeHtml(color)} talla ${escapeHtml(size)}" data-color="${escapeHtml(color)}" data-size="${escapeHtml(size)}" value="${stock}" placeholder="—"></td>`;
  }).join("")}</tr>`).join("");

  return `<div class="admin-grid">
    <section class="admin-card">
      <div class="admin-card-head"><div><p class="modal-eyebrow">Existencias</p><h2>Inventario por modelo</h2></div></div>
      <div class="admin-toolbar">
        <label class="admin-select"><span class="visually-hidden">Modelo</span><select id="product-select">${productOptions(product.id)}</select></label>
        ${variantToggle}
      </div>
      <p class="admin-muted">Escribe cuántas piezas hay. <strong>0</strong> = agotado (la tienda no deja pedirlo). Vacío (—) = no se controla y se muestra disponible.</p>
      ${product.colors.length ? `<form id="inventory-form">
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th scope="col">Color</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="admin-actions">
          <button class="checkout-button inline" type="submit" ${admin.busy ? "disabled" : ""}>${admin.busy ? "Guardando…" : "Guardar cambios"}</button>
          <span class="admin-fill">Llenar vacíos con <input type="number" min="0" step="1" id="fill-value" value="0" aria-label="Cantidad para llenar vacíos"> <button type="button" class="text-link" data-action="fill">Aplicar</button></span>
        </div>
      </form>` : `<p class="admin-message">Este producto aún no tiene colores. Agrégalos en la pestaña Productos.</p>`}
    </section>
    <aside class="admin-card">
      <p class="modal-eyebrow">Atención</p>
      <h2>Pocas existencias</h2>
      ${lowStockMarkup()}
    </aside>
  </div>`;
}

// ---------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------
function emptyProduct() {
  return normalizeProduct({ id: "", name: "", category: "Conjunto", gender: "Mujer", collection: "", price: null, sizes: ["CH", "M", "G", "XG"],
    colors: [], pants_options: [], photos: {}, gallery: [], active: false, featured: false, sort_order: 100 });
}

function productListMarkup() {
  return `<div class="admin-product-list">
    <button class="admin-product-row new ${admin.draft && admin.draft.isNew ? "selected" : ""}" type="button" data-action="new-product"><span class="admin-thumb">+</span><span><strong>Nuevo producto</strong><small>Agregar al catálogo</small></span></button>
    ${admin.products.map((product) => {
      const photo = Object.values(product.photos)[0];
      const status = productStatus(product);
      return `<button class="admin-product-row ${admin.draft?.original === product.id ? "selected" : ""}" type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}">
        <span class="admin-thumb">${photo ? `<img src="${escapeHtml(imageUrl(photo))}" alt="">` : escapeHtml(product.name.slice(0, 1))}</span>
        <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ${money(product.price)}</small></span>
        <span class="admin-chip ${status === "Publicado" ? "confirmado" : "pendiente"}">${status}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function photoSlot(src, label, removeAction, data) {
  return `<div class="admin-photo">
    <div class="admin-photo-img">${src ? `<img src="${escapeHtml(imageUrl(src))}" alt="">` : `<span>Sin foto</span>`}</div>
    <small>${escapeHtml(label)}</small>
    ${src ? `<button type="button" class="text-link danger" data-action="${removeAction}" ${data}>Quitar</button>` : ""}
  </div>`;
}

function productEditorMarkup() {
  const draft = admin.draft;
  if (!draft) return `<section class="admin-card admin-editor-empty"><p class="admin-muted">Elige un producto de la lista para editarlo, o crea uno nuevo.</p></section>`;
  const p = draft.product;
  const extraColors = p.colors.filter((color) => !PALETTE_COLORS.includes(color));
  const check = (name, value, checked, label) => `<label class="admin-check"><input type="checkbox" name="${name}" value="${escapeHtml(value)}" ${checked ? "checked" : ""}><span>${escapeHtml(label)}</span></label>`;
  return `<section class="admin-card admin-editor">
    <div class="admin-card-head">
      <div><p class="modal-eyebrow">${draft.isNew ? "Nuevo" : "Editar"} producto</p><h2>${escapeHtml(p.name || "Sin nombre")}</h2></div>
      ${draft.isNew ? "" : `<a class="text-link" href="./index.html#producto=${escapeHtml(p.id)}" target="_blank" rel="noopener">Ver en la tienda ↗</a>`}
    </div>
    <form id="product-form" class="admin-form">
      <div class="admin-form-grid">
        <label>Nombre<input name="name" required maxlength="80" value="${escapeHtml(p.name)}"></label>
        <label>Identificador <span class="field-hint">para el enlace; no se puede cambiar después</span>
          <input name="product_id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="40" value="${escapeHtml(p.id)}" ${draft.isNew ? "" : "readonly"} placeholder="se llena solo"></label>
        <label>Categoría<select name="category">${CATEGORIES.map((category) => `<option ${category === p.category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
        <label>Para<select name="gender">${["Mujer", "Caballero", "Unisex"].map((gender) => `<option value="${gender}" ${gender === p.gender ? "selected" : ""}>${genderLabel(gender)}</option>`).join("")}</select></label>
        <label>Colección <span class="field-hint">agrupa en "Colecciones"</span><input name="collection" maxlength="40" value="${escapeHtml(p.collection)}"></label>
        <label>Precio (MXN) <span class="field-hint">vacío = "Precio a consultar"</span><input name="price" type="number" min="0" step="1" inputmode="numeric" value="${p.price ?? ""}" placeholder="Precio a consultar"></label>
        <label class="span-2">Descripción corta <span class="field-hint">aparece en la tarjeta</span><input name="note" maxlength="160" value="${escapeHtml(p.note)}"></label>
        <label class="span-2">Descripción larga <span class="field-hint">opcional, en la ventana del producto</span><textarea name="description" maxlength="1200">${escapeHtml(p.description)}</textarea></label>
      </div>

      <fieldset class="admin-fieldset"><legend>Tallas</legend>
        <div class="admin-checks">${ALL_SIZES.map((size) => check("sizes", size, p.sizes.includes(size), size)).join("")}</div>
      </fieldset>

      <fieldset class="admin-fieldset"><legend>Pantalón</legend>
        ${check("pants", "1", p.pants_options.length > 0, "El cliente elige pantalón Jogger o Recto (Contempo, Clasia)")}
        <p class="admin-muted">Si no está marcado, se vende como conjunto completo sin opciones.</p>
      </fieldset>

      <fieldset class="admin-fieldset"><legend>Colores</legend>
        ${Object.entries(PALETTES).map(([name, colors]) => `<div class="admin-palette">
          <div class="admin-palette-head"><strong>Paleta ${escapeHtml(name)}</strong><button type="button" class="text-link" data-action="use-palette" data-palette="${escapeHtml(name)}">Usar solo esta paleta</button></div>
          <div class="admin-checks colors">${colors.map((color) => check("colors", color, p.colors.includes(color), color)).join("")}</div>
        </div>`).join("")}
        <label>Otros colores <span class="field-hint">separados por coma</span><input name="extra_colors" value="${escapeHtml(extraColors.join(", "))}" placeholder="Ej. Verde salvia, Terracota"></label>
      </fieldset>

      <fieldset class="admin-fieldset"><legend>Fotos por color</legend>
        <p class="admin-muted">La foto del color se muestra al elegirlo. Las fotos se reducen y se suben a Supabase automáticamente.</p>
        <div class="admin-photos">
          ${p.colors.map((color) => `<div class="admin-photo-group">
            ${photoSlot(p.photos[color], color, "remove-photo", `data-color="${escapeHtml(color)}"`)}
            <label class="admin-upload">Subir<input type="file" accept="image/*" data-upload="photo" data-color="${escapeHtml(color)}"></label>
          </div>`).join("") || `<p class="admin-muted">Marca primero los colores.</p>`}
        </div>
      </fieldset>

      <fieldset class="admin-fieldset"><legend>Fotos de detalle (galería)</legend>
        <div class="admin-photos">
          ${p.gallery.map((src, index) => photoSlot(src, `Detalle ${index + 1}`, "remove-gallery", `data-index="${index}"`)).join("")}
          <label class="admin-upload big">+ Agregar fotos<input type="file" accept="image/*" multiple data-upload="gallery"></label>
        </div>
      </fieldset>

      <fieldset class="admin-fieldset"><legend>Publicación</legend>
        <div class="admin-form-grid">
          <label>Etiqueta <span class="field-hint">opcional, ej. Nuevo</span><input name="badge" maxlength="24" value="${escapeHtml(p.badge)}"></label>
          <label>Orden <span class="field-hint">menor = aparece primero</span><input name="sort_order" type="number" step="1" value="${p.sort_order}"></label>
        </div>
        <div class="admin-checks">
          ${check("featured", "1", p.featured, "Mostrar en Destacados")}
          ${check("active", "1", p.active, "Visible en la tienda")}
        </div>
      </fieldset>

      ${admin.uploading ? `<p class="admin-message">Subiendo foto…</p>` : ""}
      <div class="admin-actions">
        <button class="checkout-button inline" type="submit" ${admin.busy || admin.uploading ? "disabled" : ""}>${admin.busy ? "Guardando…" : "Guardar producto"}</button>
        ${draft.isNew ? "" : `<button type="button" class="text-link danger" data-action="delete-product">${admin.confirmDelete ? "¿Seguro? Presiona otra vez para borrar" : "Borrar producto"}</button>`}
      </div>
    </form>
  </section>`;
}

function productsMarkup() {
  return `<div class="admin-grid products">
    <aside class="admin-card"><p class="modal-eyebrow">Catálogo</p><h2>Productos</h2>${productListMarkup()}</aside>
    ${productEditorMarkup()}
  </div>`;
}

// Lee el formulario al borrador (para no perder lo escrito al volver a dibujar).
function readProductForm() {
  const form = $("#product-form");
  if (!form || !admin.draft) return admin.draft?.product;
  const data = new FormData(form);
  const p = admin.draft.product;
  const extra = String(data.get("extra_colors") || "").split(",").map((color) => color.trim()).filter(Boolean);
  // Conserva el orden en que estaban los colores y agrega los nuevos al final.
  const chosen = new Set([...data.getAll("colors").map(String), ...extra]);
  const colors = [...p.colors.filter((color) => chosen.has(color)), ...[...chosen].filter((color) => !p.colors.includes(color))];
  const priceRaw = String(data.get("price") || "").trim();
  Object.assign(p, {
    name: String(data.get("name") || "").trim(),
    id: admin.draft.isNew ? (String(data.get("product_id") || "").trim() || slugify(data.get("name"))) : p.id,
    category: String(data.get("category")),
    gender: String(data.get("gender")),
    collection: String(data.get("collection") || "").trim(),
    price: priceRaw === "" ? null : Math.round(Number(priceRaw)),
    note: String(data.get("note") || "").trim(),
    description: String(data.get("description") || "").trim(),
    sizes: ALL_SIZES.filter((size) => data.getAll("sizes").includes(size)),
    pants_options: data.get("pants") ? [...PANTS_OPTIONS] : [],
    colors,
    badge: String(data.get("badge") || "").trim(),
    sort_order: Number(data.get("sort_order") || 100),
    featured: Boolean(data.get("featured")),
    active: Boolean(data.get("active")),
  });
  // Fotos de colores que ya no están marcados se descartan.
  p.photos = Object.fromEntries(Object.entries(p.photos).filter(([color]) => colors.includes(color)));
  return p;
}

async function saveProduct() {
  const p = readProductForm();
  if (!p.name) return setMessage("Escribe el nombre del producto.", "error");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) return setMessage("El identificador solo puede tener minúsculas, números y guiones.", "error");
  if (admin.draft.isNew && admin.products.some((item) => item.id === p.id)) return setMessage(`Ya existe un producto con el identificador "${p.id}".`, "error");
  if (!p.sizes.length) return setMessage("Marca al menos una talla.", "error");
  if (p.active && !p.colors.length) {
    return setMessage("Para que sea visible en la tienda necesita al menos un color.", "error");
  }
  admin.busy = true;
  render();
  try {
    await MSA_DB.saveProduct({
      id: p.id, name: p.name, category: p.category, gender: p.gender, collection: p.collection || null, price: p.price,
      note: p.note || null, description: p.description || null, sizes: p.sizes, colors: p.colors, pants_options: p.pants_options,
      photos: p.photos, gallery: p.gallery, badge: p.badge || null, featured: p.featured, active: p.active, sort_order: p.sort_order,
    });
    await loadProducts();
    admin.draft = { product: structuredClone(admin.products.find((item) => item.id === p.id)), original: p.id, isNew: false };
    admin.busy = false;
    setMessage(`Guardado: ${p.name}${p.active ? " (visible en la tienda)" : " (borrador, no visible)"}${p.price === null ? " · precio a consultar" : ""}.`, "success");
  } catch (error) {
    admin.busy = false;
    setMessage(error.message, "error");
  }
}

async function deleteProduct() {
  if (!admin.confirmDelete) {
    admin.confirmDelete = true;
    return render();
  }
  const { id, name } = admin.draft.product;
  try {
    await MSA_DB.deleteProduct(id);
    await loadProducts();
    admin.draft = null;
    admin.confirmDelete = false;
    setMessage(`Se borró ${name}.`, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

// Reduce la foto (máx. 1200 px de ancho) y la convierte a WebP antes de subirla.
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  return blob && blob.type === "image/webp" ? blob : file;
}

async function uploadFiles(input) {
  const files = [...input.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  const target = input.dataset.upload;
  const color = input.dataset.color;
  if (target === "photo" || target === "gallery") readProductForm();
  else readBannerForm();
  admin.uploading = true;
  admin.message = "";
  render();
  try {
    for (const file of files) {
      const blob = await compressImage(file);
      const name = file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : "");
      const url = await MSA_DB.uploadImage(blob, name);
      if (target === "photo") admin.draft.product.photos[color] = url;
      else if (target === "gallery") admin.draft.product.gallery.push(url);
      else admin.bannerDraft.image = url;
    }
    admin.uploading = false;
    setMessage("Foto lista. Recuerda presionar Guardar.", "success");
  } catch (error) {
    admin.uploading = false;
    setMessage(`No se pudo subir la foto: ${error.message}`, "error");
  }
}

// ---------------------------------------------------------------------
// Portadas
// ---------------------------------------------------------------------
function bannerLinkOptions(draft) {
  const current = draft.link || "";
  const options = [
    ["#coleccion", "Ir a la tienda"],
    ["#colecciones", "Ir a colecciones"],
    ["#mi-talla", "Calcular mi talla"],
    ...admin.products.filter((product) => product.active).map((product) => [`#producto=${product.id}`, `Abrir producto: ${product.name}`]),
    ...[...new Set(admin.products.filter((product) => product.active && product.collection).map((product) => product.collection))]
      .map((name) => [`#coleccion=${name}`, `Filtrar colección: ${name}`]),
  ];
  const custom = draft.linkMode === "custom" || (current && !options.some(([value]) => value === current));
  return `${options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${!custom && value === current ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
    <option value="__custom" ${custom ? "selected" : ""}>Otra dirección…</option>`;
}

function bannersMarkup() {
  const draft = admin.bannerDraft;
  const list = `<div class="admin-product-list">
    <button class="admin-product-row new ${draft && !draft.id ? "selected" : ""}" type="button" data-action="new-banner"><span class="admin-thumb">+</span><span><strong>Nueva portada</strong><small>Agregar al carrusel</small></span></button>
    ${admin.banners.map((banner) => `<button class="admin-product-row ${draft?.id === banner.id ? "selected" : ""}" type="button" data-action="edit-banner" data-id="${banner.id}">
      <span class="admin-thumb">${banner.image ? `<img src="${escapeHtml(imageUrl(banner.image))}" alt="">` : "▭"}</span>
      <span><strong>${escapeHtml(banner.title)}</strong><small>Orden ${banner.sort_order}</small></span>
      <span class="admin-chip ${banner.active ? "confirmado" : "pendiente"}">${banner.active ? "Visible" : "Oculta"}</span>
    </button>`).join("")}
  </div>`;
  const productPhotos = [...new Set(admin.products.flatMap((product) => [...Object.values(product.photos), ...product.gallery]))];
  const editor = !draft ? `<section class="admin-card admin-editor-empty"><p class="admin-muted">Elige una portada o crea una nueva. Se muestran en el carrusel principal de la tienda, en el orden indicado.</p></section>`
    : `<section class="admin-card admin-editor">
      <div class="admin-card-head"><div><p class="modal-eyebrow">${draft.id ? "Editar" : "Nueva"} portada</p><h2>${escapeHtml(draft.title || "Sin título")}</h2></div></div>
      <div class="admin-banner-preview" style="--slide-tone:#dfe9e5">
        <div><small>${escapeHtml(draft.eyebrow || "")}</small><strong>${escapeHtml(draft.title || "Título")}</strong><span>${escapeHtml(draft.subtitle || "")}</span></div>
        ${draft.image ? `<img src="${escapeHtml(imageUrl(draft.image))}" alt="">` : `<span class="admin-banner-noimg">Sin foto</span>`}
      </div>
      <form id="banner-form" class="admin-form">
        <div class="admin-form-grid">
          <label>Texto pequeño <span class="field-hint">ej. Colección Clasia</span><input name="eyebrow" maxlength="40" value="${escapeHtml(draft.eyebrow || "")}"></label>
          <label>Título<input name="title" required maxlength="80" value="${escapeHtml(draft.title || "")}"></label>
          <label class="span-2">Subtítulo<input name="subtitle" maxlength="200" value="${escapeHtml(draft.subtitle || "")}"></label>
          <label>Texto del botón<input name="button_text" maxlength="40" value="${escapeHtml(draft.button_text || "")}"></label>
          <label>El botón lleva a<select name="link_choice">${bannerLinkOptions(draft)}</select></label>
          <label class="span-2 custom-link" ${draft.linkMode === "custom" || (draft.link && !draft.link.startsWith("#")) ? "" : "hidden"}>Otra dirección <span class="field-hint">solo si elegiste "Otra dirección…" (https://…)</span><input name="link_custom" value="${escapeHtml(draft.link && !draft.link.startsWith("#") ? draft.link : "")}"></label>
          <label>Orden<input name="sort_order" type="number" step="1" value="${draft.sort_order ?? 100}"></label>
          <div class="admin-checks"><label class="admin-check"><input type="checkbox" name="active" ${draft.active !== false ? "checked" : ""}><span>Visible en la tienda</span></label></div>
        </div>
        <fieldset class="admin-fieldset"><legend>Foto</legend>
          <div class="admin-photos">
            <label class="admin-upload big">Subir foto<input type="file" accept="image/*" data-upload="banner"></label>
            ${productPhotos.map((src) => `<button type="button" class="admin-pick ${src === draft.image ? "selected" : ""}" data-action="pick-banner-image" data-src="${escapeHtml(src)}" aria-label="Usar esta foto"><img src="${escapeHtml(imageUrl(src))}" alt=""></button>`).join("")}
          </div>
        </fieldset>
        ${admin.uploading ? `<p class="admin-message">Subiendo foto…</p>` : ""}
        <div class="admin-actions">
          <button class="checkout-button inline" type="submit" ${admin.busy || admin.uploading ? "disabled" : ""}>${admin.busy ? "Guardando…" : "Guardar portada"}</button>
          ${draft.id ? `<button type="button" class="text-link danger" data-action="delete-banner">${admin.confirmDelete ? "¿Seguro? Presiona otra vez para borrar" : "Borrar portada"}</button>` : ""}
        </div>
      </form>
    </section>`;
  return `<div class="admin-grid products"><aside class="admin-card"><p class="modal-eyebrow">Carrusel</p><h2>Portadas</h2>${list}</aside>${editor}</div>`;
}

function readBannerForm() {
  const form = $("#banner-form");
  if (!form || !admin.bannerDraft) return admin.bannerDraft;
  const data = new FormData(form);
  const choice = String(data.get("link_choice") || "");
  Object.assign(admin.bannerDraft, {
    eyebrow: String(data.get("eyebrow") || "").trim(),
    title: String(data.get("title") || "").trim(),
    subtitle: String(data.get("subtitle") || "").trim(),
    button_text: String(data.get("button_text") || "").trim(),
    linkMode: choice === "__custom" ? "custom" : "preset",
    link: choice === "__custom" ? String(data.get("link_custom") || "").trim() : choice,
    sort_order: Number(data.get("sort_order") || 100),
    active: Boolean(data.get("active")),
  });
  return admin.bannerDraft;
}

async function saveBanner() {
  const draft = readBannerForm();
  if (!draft.title) return setMessage("Escribe el título de la portada.", "error");
  if (draft.link && !/^(#|https:\/\/)/.test(draft.link)) return setMessage("La otra dirección debe empezar con https://", "error");
  admin.busy = true;
  render();
  try {
    await MSA_DB.saveBanner({
      id: draft.id, eyebrow: draft.eyebrow || null, title: draft.title, subtitle: draft.subtitle || null, image: draft.image || null,
      button_text: draft.button_text || null, link: draft.link || null, sort_order: draft.sort_order, active: draft.active,
    });
    await loadBanners();
    admin.bannerDraft = null;
    admin.busy = false;
    setMessage("Portada guardada.", "success");
  } catch (error) {
    admin.busy = false;
    setMessage(error.message, "error");
  }
}

async function deleteBanner() {
  if (!admin.confirmDelete) {
    admin.confirmDelete = true;
    return render();
  }
  try {
    await MSA_DB.deleteBanner(admin.bannerDraft.id);
    await loadBanners();
    admin.bannerDraft = null;
    admin.confirmDelete = false;
    setMessage("Portada borrada.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

// ---------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------
function whatsappLink(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = `52${digits}`;
  return digits ? `https://wa.me/${digits}` : null;
}

function orderItemLine(item) {
  const parts = [item.variant ? `Pantalón ${String(item.variant).toLowerCase()}` : null, item.color, item.size === "Unitalla" ? "Unitalla" : `Talla ${item.size}`].filter(Boolean);
  return `${Number(item.quantity)} × ${escapeHtml(item.product_name || item.product_id)} — ${parts.map(escapeHtml).join(" · ")}${item.price ? ` · ${money(item.price)} c/u` : " · precio por confirmar"}`;
}

const ORDER_GROUPS = {
  pendientes: { label: "Por atender", statuses: ["pendiente"] },
  proceso: { label: "En proceso", statuses: ["confirmado", "pagado", "preparacion", "enviado"] },
  entregados: { label: "Entregados", statuses: ["entregado"] },
  cancelados: { label: "Cancelados", statuses: ["cancelado"] },
};

const storeUrl = () => new URL("./index.html", window.location.href).href;
const trackingLinkFor = (order) => `${storeUrl()}#rastreo=${order.id}`;
const nextStatus = (status) => ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1] || null;
const orderTotalLabel = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.some((item) => !item.price) ? `${Number(order.total) > 0 ? `${money(order.total)} + ` : ""}piezas por cotizar` : money(order.total);
};

// Mensaje de WhatsApp para avisar al cliente del estado actual.
function statusMessage(order) {
  const name = String(order.customer_name || "").split(" ")[0];
  const id = `#${order.id}`;
  const track = `Puedes ver el estado aquí: ${trackingLinkFor(order)} (te pedirá los últimos 4 dígitos de tu teléfono).`;
  const texts = {
    pendiente: `Hola ${name}, recibimos tu pedido ${id} de MSA Scrubs. En breve te confirmamos disponibilidad. ${track}`,
    confirmado: `Hola ${name}, confirmamos tu pedido ${id} de MSA Scrubs. Total: ${orderTotalLabel(order)}. Te compartimos las formas de pago. ${track}`,
    pagado: `Hola ${name}, recibimos el pago de tu pedido ${id}. ¡Gracias! Ya lo estamos preparando. ${track}`,
    preparacion: `Hola ${name}, tu pedido ${id} está en preparación. Te avisamos cuando salga. ${track}`,
    enviado: `Hola ${name}, tu pedido ${id} ya va en camino${order.carrier ? ` por ${order.carrier}` : ""}.${order.tracking_number ? ` Guía: ${order.tracking_number}.` : ""}${order.tracking_url ? ` Rastreo de la paquetería: ${order.tracking_url}` : ""} ${track}`,
    entregado: `Hola ${name}, tu pedido ${id} aparece como entregado. ¡Gracias por tu compra en MSA Scrubs!`,
    cancelado: `Hola ${name}, tu pedido ${id} fue cancelado. Si tienes dudas, aquí estamos.`,
  };
  return texts[order.status] || texts.pendiente;
}

function whatsappNotifyLink(order) {
  const base = whatsappLink(order.phone);
  return base ? `${base}?text=${encodeURIComponent(statusMessage(order))}` : null;
}

function timelineMarkup(order) {
  return `<ol class="order-timeline">${orderTimeline(order).map((step) => `<li class="${step.done ? "done" : ""} ${step.current ? "current" : ""} ${step.status}">
    <span class="dot" aria-hidden="true"></span><strong>${ORDER_STATUS_LABELS[step.status]}</strong><small>${step.at ? escapeHtml(formatDateTime(step.at)) : ""}</small></li>`).join("")}</ol>`;
}

function shippingFields(order, buttonLabel) {
  return `<form class="admin-shipping" data-shipping-form="${order.id}">
    <datalist id="carriers-${order.id}">${CARRIERS.map((carrier) => `<option value="${escapeHtml(carrier)}">`).join("")}</datalist>
    <label>Paquetería<input name="carrier" list="carriers-${order.id}" maxlength="60" value="${escapeHtml(order.carrier || "")}" placeholder="Ej. Estafeta"></label>
    <label>Número de guía<input name="tracking_number" maxlength="80" value="${escapeHtml(order.tracking_number || "")}"></label>
    <label class="wide">Enlace de rastreo <span class="field-hint">cópialo de la guía en Skydropx (https://…)</span><input name="tracking_url" type="url" value="${escapeHtml(order.tracking_url || "")}" placeholder="https://"></label>
    <button class="checkout-button inline" type="submit">${buttonLabel}</button>
  </form>`;
}

function ordersMarkup() {
  const group = ORDER_GROUPS[admin.orderGroup] || ORDER_GROUPS.pendientes;
  const tabs = Object.entries(ORDER_GROUPS).map(([key, value]) =>
    `<button type="button" class="${admin.orderGroup === key ? "selected" : ""}" data-action="order-group" data-value="${key}">${value.label}</button>`).join("");
  const list = admin.orders.length ? admin.orders.map((order) => {
    const link = whatsappLink(order.phone);
    const notify = whatsappNotifyLink(order);
    const items = Array.isArray(order.items) ? order.items : [];
    const next = order.status === "cancelado" ? null : nextStatus(order.status);
    const closed = order.status === "entregado" || order.status === "cancelado";
    const confirmCancel = admin.confirmCancel === order.id;
    return `<article class="admin-order" id="pedido-${order.id}">
      <header><div><strong>Pedido #${order.id}</strong><small>${escapeHtml(formatDateTime(order.created_at))}</small></div><span class="admin-chip ${order.status}">${ORDER_STATUS_LABELS[order.status] || order.status}</span></header>
      <p><strong>${escapeHtml(order.customer_name)}</strong> · ${link ? `<a href="${link}" target="_blank" rel="noreferrer">${escapeHtml(order.phone)}</a>` : escapeHtml(order.phone)}${order.city ? ` · ${escapeHtml(order.city)}` : ""}</p>
      <ul>${items.map((item) => `<li>${orderItemLine(item)}</li>`).join("")}</ul>
      ${order.note ? `<p class="admin-note">“${escapeHtml(order.note)}”</p>` : ""}
      ${timelineMarkup(order)}
      ${order.tracking_number || order.carrier ? `<p class="admin-tracking">Envío: <strong>${escapeHtml(order.carrier || "")}</strong>${order.tracking_number ? ` · Guía ${escapeHtml(order.tracking_number)}` : ""}${order.tracking_url ? ` · <a href="${escapeHtml(order.tracking_url)}" target="_blank" rel="noreferrer">Rastrear ↗</a>` : ""}</p>` : ""}
      ${next === "enviado" ? shippingFields(order, "Marcar como enviado") : ""}
      ${order.status === "enviado" ? `<details class="admin-edit-shipping"><summary>Corregir datos de envío</summary>${shippingFields(order, "Guardar datos de envío")}</details>` : ""}
      <footer>
        <strong>${orderTotalLabel(order)}</strong>
        <span class="admin-order-actions">
          ${notify ? `<a class="button button-outline" href="${notify}" target="_blank" rel="noreferrer">◉ Avisar por WhatsApp</a>` : ""}
          ${next && next !== "enviado" ? `<button class="checkout-button inline" type="button" data-action="advance-order" data-id="${order.id}" data-value="${next}">Marcar como ${ORDER_STATUS_LABELS[next].toLowerCase()}</button>` : ""}
        </span>
      </footer>
      <div class="admin-order-more">
        <label>Cambiar a <select data-status-select="${order.id}">${Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${value === order.status ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <button class="text-link" type="button" data-action="apply-status" data-id="${order.id}">Aplicar</button>
        ${closed ? "" : `<button class="text-link danger" type="button" data-action="cancel-order" data-id="${order.id}">${confirmCancel ? "¿Seguro? Presiona otra vez para cancelar" : "Cancelar pedido"}</button>`}
      </div>
    </article>`;
  }).join("") : `<p class="admin-muted">No hay pedidos en "${group.label}".</p>`;
  return `<section class="admin-card">
    <div class="admin-card-head">
      <div><p class="modal-eyebrow">Seguimiento</p><h2>Pedidos</h2></div>
      <button class="button button-outline" type="button" data-action="reload-orders">Actualizar</button>
    </div>
    <div class="toggle-pair admin-tabs small">${tabs}</div>
    <p class="admin-muted">Avanza cada pedido con el botón del estado siguiente y avisa al cliente con "Avisar por WhatsApp" (el mensaje ya va escrito con su enlace de seguimiento). Las existencias se descuentan al confirmar y se regresan si se cancela.</p>
    <div class="admin-orders">${list}</div>
  </section>`;
}

// ---------------------------------------------------------------------
// Dibujo general
// ---------------------------------------------------------------------
function render() {
  sessionBox.innerHTML = admin.user
    ? `<span class="admin-user">${escapeHtml(admin.user.email)}</span><button class="button button-outline" type="button" data-action="sign-out">Salir</button>`
    : "";
  if (!MSA_DB.available) {
    app.innerHTML = `<section class="admin-card admin-narrow"><h1>Sin conexión con Supabase</h1><p class="admin-muted">Revisa tu internet y que <code>config.js</code> tenga la dirección y la llave publicable del proyecto.</p></section>`;
    return;
  }
  if (!admin.ready) {
    app.innerHTML = `<p class="admin-loading">Cargando…</p>`;
    return;
  }
  if (!admin.user) {
    app.innerHTML = loginMarkup();
    return;
  }
  if (!admin.isAdmin) {
    app.innerHTML = notAdminMarkup();
    return;
  }
  const views = { inventario: inventoryMarkup, productos: productsMarkup, portadas: bannersMarkup, pedidos: ordersMarkup };
  app.innerHTML = `${tabsMarkup()}${messageMarkup()}${views[admin.tab]()}`;
}

// ---------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------
async function loadProducts() {
  admin.products = (await MSA_DB.loadProducts() || []).map(normalizeProduct);
  if (!admin.products.some((product) => product.id === admin.productId)) admin.productId = admin.products[0]?.id || null;
}
async function loadBanners() { admin.banners = await MSA_DB.loadBanners() || []; }
async function loadInventory() { admin.inventory = await MSA_DB.loadInventory(); }
async function loadOrders() { admin.orders = await MSA_DB.listOrders((ORDER_GROUPS[admin.orderGroup] || ORDER_GROUPS.pendientes).statuses); }

async function refreshSession(user) {
  admin.user = user;
  admin.isAdmin = false;
  admin.message = "";
  if (user) {
    try {
      admin.isAdmin = await MSA_DB.isAdmin();
      if (admin.isAdmin) await Promise.all([loadProducts(), loadBanners(), loadInventory(), loadOrders()]);
    } catch (error) {
      admin.message = error.message;
      admin.messageType = "error";
    }
  }
  admin.ready = true;
  render();
}

async function saveInventory(form) {
  const product = currentProduct();
  const variant = currentVariant(product);
  const upserts = [];
  const deletes = [];
  for (const input of $$("input[data-color]", form)) {
    const { color, size } = input.dataset;
    const key = MSA_DB.inventoryKey(product.id, product.gender, color, size, variant);
    const before = admin.inventory.has(key) ? admin.inventory.get(key) : null;
    const raw = input.value.trim();
    const row = { product_id: product.id, gender: product.gender, color, size, variant };
    if (raw === "") {
      if (before !== null) deletes.push(row);
      continue;
    }
    const stock = Math.floor(Number(raw));
    if (!Number.isFinite(stock) || stock < 0) return setMessage(`Revisa ${color} talla ${size}: debe ser un número entero de 0 en adelante.`, "error");
    if (stock !== before) upserts.push({ ...row, stock });
  }
  if (!upserts.length && !deletes.length) return setMessage("No hay cambios por guardar.");
  admin.busy = true;
  render();
  try {
    await MSA_DB.saveInventory(upserts);
    await MSA_DB.deleteInventory(deletes);
    await loadInventory();
    admin.busy = false;
    setMessage(`Guardado: ${upserts.length + deletes.length} cambio(s) en ${product.name}${variant ? ` (pantalón ${variant.toLowerCase()})` : ""}.`, "success");
  } catch (error) {
    admin.busy = false;
    setMessage(error.message, "error");
  }
}

async function changeOrder(orderId, status, shipping = {}) {
  try {
    await MSA_DB.setOrderStatus(orderId, status, shipping);
    admin.confirmCancel = null;
    // Al avanzar, el pedido puede cambiar de grupo: se abre el grupo donde quedó.
    const group = Object.entries(ORDER_GROUPS).find(([, value]) => value.statuses.includes(status));
    if (group) admin.orderGroup = group[0];
    await Promise.all([loadOrders(), loadInventory()]);
    const extra = status === "confirmado" ? "; existencias descontadas" : status === "cancelado" ? "; existencias regresadas" : "";
    setMessage(`Pedido #${orderId}: ${ORDER_STATUS_LABELS[status].toLowerCase()}${extra}. Recuerda avisar al cliente por WhatsApp.`, "success");
    document.getElementById(`pedido-${orderId}`)?.scrollIntoView({ block: "center" });
  } catch (error) {
    setMessage(error.message, "error");
  }
}

// ---------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------
document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action, value, id } = target.dataset;
  if (action !== "delete-product" && action !== "delete-banner") admin.confirmDelete = false;
  if (action !== "cancel-order") admin.confirmCancel = null;
  switch (action) {
    case "tab":
      admin.tab = value;
      admin.message = "";
      return render();
    case "variant":
      admin.variant = value;
      return render();
    case "fill": {
      const fill = $("#fill-value").value.trim() || "0";
      for (const input of $$("#inventory-form input[data-color]")) if (input.value.trim() === "") input.value = fill;
      return;
    }
    case "new-product":
      admin.draft = { product: emptyProduct(), original: null, isNew: true };
      admin.message = "";
      return render();
    case "edit-product":
      admin.draft = { product: structuredClone(admin.products.find((product) => product.id === id)), original: id, isNew: false };
      admin.message = "";
      return render();
    case "use-palette":
      readProductForm();
      admin.draft.product.colors = [...PALETTES[target.dataset.palette]];
      admin.draft.product.photos = Object.fromEntries(Object.entries(admin.draft.product.photos).filter(([color]) => admin.draft.product.colors.includes(color)));
      return render();
    case "remove-photo":
      readProductForm();
      delete admin.draft.product.photos[target.dataset.color];
      return render();
    case "remove-gallery":
      readProductForm();
      admin.draft.product.gallery.splice(Number(target.dataset.index), 1);
      return render();
    case "delete-product": return deleteProduct();
    case "new-banner":
      admin.bannerDraft = { id: null, title: "", eyebrow: "", subtitle: "", image: "", button_text: "Ver colección", link: "#coleccion", sort_order: (admin.banners.length + 1) * 10, active: true };
      admin.message = "";
      return render();
    case "edit-banner":
      admin.bannerDraft = { ...admin.banners.find((banner) => banner.id === Number(id)) };
      admin.message = "";
      return render();
    case "pick-banner-image":
      readBannerForm();
      admin.bannerDraft.image = target.dataset.src;
      return render();
    case "delete-banner": return deleteBanner();
    case "order-group":
    case "reload-orders":
      if (value) admin.orderGroup = value;
      admin.message = "";
      try {
        await loadOrders();
      } catch (error) {
        admin.message = error.message;
        admin.messageType = "error";
      }
      return render();
    case "advance-order": return changeOrder(Number(id), value);
    case "apply-status": {
      const select = $(`[data-status-select="${id}"]`);
      return changeOrder(Number(id), select.value);
    }
    case "cancel-order":
      if (admin.confirmCancel !== Number(id)) {
        admin.confirmCancel = Number(id);
        return render();
      }
      return changeOrder(Number(id), "cancelado");
    case "sign-out":
      try {
        await MSA_DB.signOut();
      } catch (error) {
        setMessage(error.message, "error");
      }
      return;
    default: return;
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.id === "product-select") {
    admin.productId = target.value;
    admin.message = "";
    return render();
  }
  if (target.matches("input[type=file][data-upload]")) return uploadFiles(target);
  // Al marcar/desmarcar colores se actualizan las casillas de fotos.
  if (target.closest("#product-form") && (target.name === "colors" || target.name === "extra_colors")) {
    // Un color puede estar en varias paletas: todas sus casillas siguen a la que se tocó.
    if (target.name === "colors") $$("#product-form input[name=colors]").filter((input) => input.value === target.value).forEach((input) => { input.checked = target.checked; });
    readProductForm();
    return render();
  }
  if (target.closest("#banner-form")) {
    readBannerForm();
    if (target.name === "link_choice" || target.name === "active") render();
  }
});

document.addEventListener("input", (event) => {
  // Al escribir el nombre de un producto nuevo, se sugiere el identificador.
  if (event.target.name === "name" && event.target.closest("#product-form") && admin.draft?.isNew) {
    const idInput = $("#product-form input[name=product_id]");
    if (idInput && (!idInput.value || idInput.dataset.auto === "1")) {
      idInput.value = slugify(event.target.value);
      idInput.dataset.auto = "1";
    }
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  // getAttribute: form.id podría ser un campo llamado "id" dentro del formulario.
  const formId = form.getAttribute("id");
  if (formId === "admin-login") {
    event.preventDefault();
    const data = new FormData(form);
    admin.busy = true;
    admin.message = "";
    render();
    try {
      await MSA_DB.signIn(String(data.get("email") || "").trim(), String(data.get("password") || ""));
      admin.busy = false;
    } catch (error) {
      admin.busy = false;
      setMessage(error.message, "error");
    }
    return;
  }
  if (form.dataset.shippingForm) {
    event.preventDefault();
    const data = new FormData(form);
    const orderId = Number(form.dataset.shippingForm);
    const shipping = { carrier: String(data.get("carrier") || "").trim(), tracking_number: String(data.get("tracking_number") || "").trim(), tracking_url: String(data.get("tracking_url") || "").trim() };
    if (!shipping.carrier || !shipping.tracking_number) return setMessage("Escribe la paquetería y el número de guía.", "error");
    if (shipping.tracking_url && !shipping.tracking_url.startsWith("https://")) return setMessage("El enlace de rastreo debe empezar con https://", "error");
    return changeOrder(orderId, "enviado", shipping);
  }
  const handlers = { "inventory-form": () => saveInventory(form), "product-form": saveProduct, "banner-form": saveBanner };
  if (handlers[formId]) {
    event.preventDefault();
    handlers[formId]();
  }
});

render();
if (MSA_DB.available) {
  MSA_DB.onAuthChange((eventName, user) => {
    if (eventName === "TOKEN_REFRESHED" && admin.user?.id === user?.id) return;
    refreshSession(user);
  });
}
