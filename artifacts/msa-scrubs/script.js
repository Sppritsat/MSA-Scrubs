"use strict";

const WHATSAPP_NUMBER = "525500000000";
const SCRUB_COLORS = [
  "Blanco", "Azul cielo", "Azul rey", "Azul marino", "Rubi claro",
  "Rubi", "Lavanda", "Bugambilia", "Vino", "Militar", "Ebano",
];
const uniformColors = SCRUB_COLORS;
const products = [
  { id: "amalia", name: "Contempo · Jogger", category: "Conjunto", gender: "Mujer", cut: "Slim", price: 899, note: "Cuello Mao · Bolsillos laterales · Pantalón jogger", tone: "#d5ddd9", accent: "#718f88", badge: "Más elegido", sizes: ["CH", "M", "G", "XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Slim", "Recto", "Wide leg"], photos: { "Blanco": "blanco.png", "Rubi claro": "rubi-claro.png", "Rubi": "rubi.png" } },
  { id: "celeste", name: "Contempo · Recto", category: "Conjunto", gender: "Mujer", cut: "Recto", price: 879, note: "Cuello Mao · Bolsillos laterales · Pantalón recto", tone: "#ddd8cf", accent: "#a89782", sizes: ["CH", "M", "G"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Recto", "Slim"], photos: { "Blanco": "blanco.png", "Rubi claro": "rubi-claro.png", "Rubi": "rubi.png" } },
  { id: "mateo", name: "Clasia · Escote V", category: "Conjunto", gender: "Caballero", cut: "Recto", price: 949, note: "Escote V · Bolsillos laterales · Pantalón recto o jogger", tone: "#c8d3d6", accent: "#58737b", badge: "Nuevo", sizes: ["CH", "M", "G", "XG", "2XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Recto", "Slim"], photos: { "Azul marino": "azul-marino.png", "Vino": "vino.png", "Lavanda": "lavanda.png" } },
  { id: "andrea", name: "Clasia · Pétalo", category: "Filipina", gender: "Mujer", cut: "Slim", price: 499, note: "Manga tipo pétalo · Cuello Mao o V", tone: "#ded7de", accent: "#9c8295", sizes: ["CH", "M", "G", "XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Slim", "Recto"] },
  { id: "nicolas", name: "Clasia · Sport", category: "Filipina", gender: "Caballero", cut: "Recto", price: 529, note: "Manga tipo pétalo · Cuello sport · Pantalón jogger", tone: "#d9d1c5", accent: "#887b69", sizes: ["M", "G", "XG", "2XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Recto", "Slim"] },
  { id: "pantalon-msa", name: "Pantalón MSA", category: "Pantalón", gender: "Unisex", cut: "Recto", price: 449, note: "La parte inferior para completar tu conjunto", tone: "#d6dde0", accent: "#5f7780", sizes: ["CH", "M", "G", "XG", "2XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero", "Unisex"], cutOptions: ["Recto", "Slim", "Wide leg"] },
  { id: "pulso", name: "Pulso", category: "Gorro quirúrgico", gender: "Unisex", cut: "Ajustable", price: 249, note: "Elástico suave · Estampado interior", tone: "#cedbd7", accent: "#4f8279", badge: "Favorito", sizes: ["Unitalla"], colors: ["Verde eucalipto", "Azul tinta", "Terracota"] },
  { id: "aurora", name: "Aurora", category: "Gorro quirúrgico", gender: "Unisex", cut: "Ajustable", price: 249, note: "Ajuste cómodo · Diseño ligero", tone: "#e0d8d0", accent: "#a78978", sizes: ["Unitalla"], colors: ["Arena", "Lavanda", "Terracota"] },
  { id: "guardia", name: "Guardia", category: "Gorro quirúrgico", gender: "Unisex", cut: "Ajustable", price: 269, note: "Secado rápido · Banda suave", tone: "#d7dfe1", accent: "#617a83", badge: "Favorito", sizes: ["Unitalla"], colors: ["Azul quirófano", "Gris piedra", "Verde salvia"] },
  { id: "olivia", name: "Clasia · Campana", category: "Conjunto", gender: "Mujer", cut: "Wide leg", price: 929, note: "Manga tipo pétalo · Pantalón recto con ligera campana", tone: "#d8d5cb", accent: "#8e8a7c", sizes: ["CH", "M", "G"], colors: uniformColors, genderOptions: ["Mujer", "Caballero"], cutOptions: ["Wide leg", "Recto", "Slim"] },
  { id: "luca", name: "Clasia · Jogger", category: "Conjunto", gender: "Unisex", cut: "Recto", price: 919, note: "Manga tipo pétalo · Bolsillos laterales · Pantalón jogger", tone: "#d4d9de", accent: "#647687", sizes: ["CH", "M", "G", "XG"], colors: uniformColors, genderOptions: ["Mujer", "Caballero", "Unisex"], cutOptions: ["Recto", "Slim", "Wide leg"], photos: { "Ebano": "ebano.png" } },
  { id: "clasico", name: "Clásico", category: "Cubrepolvo", gender: "Unisex", cut: "Recto", price: 649, note: "Corte limpio · Bolsillos funcionales", tone: "#e1e2dc", accent: "#8c9990", sizes: ["CH", "M", "G", "XG"], colors: ["Blanco", "Azul cielo", "Verde salvia"] },
  { id: "esencial", name: "Esencial", category: "Cubrepolvo", gender: "Unisex", cut: "Recto", price: 699, note: "Tela ligera · Silueta amplia", tone: "#ddd8cf", accent: "#a89782", sizes: ["M", "G", "XG"], colors: ["Blanco", "Arena", "Gris piedra"] },
];

const colorStyles = {
  "Blanco": { tone: "#f7f4ed", accent: "#d7d4ca" },
  "Azul cielo": { tone: "#c7d9eb", accent: "#9ebbd7" },
  "Azul rey": { tone: "#d5e2ef", accent: "#155da2" },
  "Azul marino": { tone: "#d4dce7", accent: "#102c50" },
  "Rubi claro": { tone: "#f8d8e1", accent: "#ef5e82" },
  "Rubi": { tone: "#f6d5d8", accent: "#e31632" },
  "Lavanda": { tone: "#e5dcfb", accent: "#b79df4" },
  "Bugambilia": { tone: "#ecd6e9", accent: "#a81799" },
  "Vino": { tone: "#e4ced1", accent: "#6c202d" },
  "Militar": { tone: "#d7dfd2", accent: "#304d2b" },
  "Ebano": { tone: "#d7d7d5", accent: "#111111" },
};
const categories = ["Todos", "Conjunto", "Filipina", "Pantalón", "Cubrepolvo", "Gorro quirúrgico"];
const state = {
  search: "",
  gender: "Todos",
  category: "Todos",
  cart: [],
  modal: null,
  assistantOpen: false,
  assistantQuestion: "",
  assistantAnswer: "Hola. Puedo orientarte sobre tallas, envíos, cambios y materiales.",
  guideAudience: "Dama",
  guideGarment: "Filipina",
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const overlayRoot = $("#overlay-root");
const money = (value) => `$${value.toLocaleString("es-MX")} MXN`;
const isUniform = (product) => product.category === "Conjunto" || product.category === "Filipina";
const isGorro = (product) => product.category === "Gorro quirúrgico";
const isCubrepolvo = (product) => product.category === "Cubrepolvo";
const whatsappUrl = (message = "") => `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
let toastTimer;

function productById(id) {
  return products.find((product) => product.id === id);
}

function photoFor(product, color) {
  if (!product.photos) return null;
  if (color) return product.photos[color] || null;
  return Object.values(product.photos)[0] || null;
}

function visualMarkup(product, selectedColor, extraClass = "") {
  const styles = colorStyles[selectedColor || ""] || { tone: product.tone, accent: product.accent };
  const photo = photoFor(product, selectedColor);
  const image = photo
    ? `<img class="photo" src="./images/${photo}" alt="${product.name}${selectedColor ? ` en color ${selectedColor}` : ""}" loading="lazy">`
    : `<span class="visual-orb"></span><span class="garment-shape"></span>`;
  return `<div class="product-visual ${extraClass}" style="--visual-tone:${styles.tone};--visual-accent:${styles.accent}">
    ${image}
    <span class="visual-category">${product.category}</span>
    <span class="visual-initial" aria-hidden="true">${product.name.slice(0, 1)}</span>
    ${selectedColor ? `<span class="visual-color">${selectedColor}</span>` : ""}
  </div>`;
}

function renderGenderFilters() {
  const container = $("#gender-filters");
  container.innerHTML = ["Todos", "Mujer", "Caballero", "Unisex"].map((gender) =>
    `<button class="filter-pill ${state.gender === gender ? "active" : ""}" type="button" data-action="filter-gender" data-gender="${gender}" aria-pressed="${state.gender === gender}">${gender}</button>`,
  ).join("");
}

function renderCategoryOptions() {
  $("#category-filter").innerHTML = categories.map((category) =>
    `<option value="${category}" ${state.category === category ? "selected" : ""}>${category === "Todos" ? "Todas las categorías" : category}</option>`,
  ).join("");
}

function matchesFilters(product) {
  const matchesGender = state.gender === "Todos" || product.gender === state.gender;
  const matchesCategory = state.category === "Todos" || product.category === state.category;
  const searchable = `${product.name} ${product.category} ${product.note}`.toLocaleLowerCase("es");
  return matchesGender && matchesCategory && searchable.includes(state.search.trim().toLocaleLowerCase("es"));
}

function renderCatalog() {
  const grid = $("#product-grid");
  const matches = products.filter(matchesFilters);
  grid.innerHTML = matches.map((product) => `
    <article class="product-card">
      <button class="product-open" type="button" data-action="open-product" data-product-id="${product.id}" aria-label="Ver ${product.name}">
        ${visualMarkup(product)}
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <span class="product-arrow" aria-hidden="true">→</span>
      </button>
      <div class="product-info">
        <div><h3>${product.name}</h3><p>${product.note}</p></div>
        <p class="product-price">${money(product.price)}</p>
      </div>
    </article>
  `).join("");
  $("#empty-state").hidden = matches.length !== 0;
  grid.hidden = matches.length === 0;
  renderGenderFilters();
  renderCategoryOptions();
}

function setSearch(value) {
  state.search = value;
  $("#search-desktop").value = value;
  $("#search-mobile").value = value;
  renderCatalog();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove("visible"), 2600);
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCartCount() {
  const count = $("#cart-count");
  const total = cartCount();
  count.textContent = total;
  count.hidden = total === 0;
}

function cartSelectionLabel(item) {
  return [
    item.gender && isUniform(item.product) ? item.gender : null,
    item.cut && isUniform(item.product) ? item.cut : null,
    item.color,
    isGorro(item.product) ? "Unitalla" : `Talla ${item.size}`,
  ].filter(Boolean).join(" · ");
}

function addToCart(product, selection) {
  const found = state.cart.find((item) =>
    item.product.id === product.id &&
    item.gender === selection.gender &&
    item.cut === selection.cut &&
    item.size === selection.size &&
    item.color === selection.color,
  );
  if (found) found.quantity += selection.quantity;
  else state.cart.push({ product, ...selection });
  renderCartCount();
  toast(`${product.name} se agregó al carrito.`);
}

function selectedProductDefaults(product) {
  return {
    gender: (product.genderOptions || [product.gender]).includes(product.gender) ? product.gender : product.genderOptions?.[0],
    cut: product.cut,
    size: product.sizes[1] || product.sizes[0],
    color: Object.keys(product.photos || {})[0] || product.colors[0],
    quantity: 1,
  };
}

function optionButtons(options, selected, action, extraClass = "") {
  return options.map((value) => `
    <button class="option-button ${extraClass} ${value === selected ? "selected" : ""}" type="button"
      data-action="${action}" data-value="${value}" aria-pressed="${value === selected}">${value}</button>
  `).join("");
}

function productModalMarkup(modal) {
  const { product, selection } = modal;
  const uniform = isUniform(product);
  const gorro = isGorro(product);
  const cubrepolvo = isCubrepolvo(product);
  const genderOptions = product.genderOptions || [product.gender];
  const cutOptions = product.cutOptions || [product.cut];
  const step = uniform ? 1 : 0;
  return `<div class="product-modal-layout">
    <div class="modal-visual">${visualMarkup(product, selection.color)}</div>
    <section class="modal-copy">
      <p class="modal-eyebrow">${product.gender} · ${product.category}</p>
      <h2 id="product-modal-title">${product.name}</h2>
      <p class="modal-description">${product.note}. Diseñado para acompañar tus turnos con una tela fresca, flexible y fácil de cuidar.</p>
      <p class="modal-price">${money(product.price)}</p>
      <div class="modal-separator"></div>
      ${uniform ? `<div class="option-group">
        <div class="option-heading"><strong>1. Sexo</strong><span>Primero define para quién es</span></div>
        <div class="option-list">${optionButtons(genderOptions, selection.gender, "product-option-gender")}</div>
      </div>
      <div class="option-group">
        <div class="option-heading"><strong>2. Corte</strong><span>También aplica para filipinas</span></div>
        <div class="option-list">${optionButtons(cutOptions, selection.cut, "product-option-cut")}</div>
      </div>` : ""}
      <div class="option-group">
        <div class="option-heading"><strong>${uniform ? "3. " : "1. "}Color</strong><span>${selection.color}</span></div>
        <div class="option-list">${optionButtons(product.colors, selection.color, "product-option-color")}</div>
      </div>
      <div class="option-group">
        <div class="option-heading">
          <strong>${uniform ? "4. " : "2. "}Talla${gorro ? " · Unitalla" : ""}</strong>
          <button class="size-guide-link" type="button" data-action="open-guide">⌁ Ver guía</button>
        </div>
        <div class="option-list">${optionButtons(product.sizes, selection.size, "product-option-size", "size-option")}</div>
      </div>
      ${cubrepolvo ? `<p class="note-box">Para cubrepolvos el proceso es directo: elige color y talla. No necesitas seleccionar sexo ni corte.</p>` : ""}
      ${gorro ? `<p class="note-box sage">Los gorros quirúrgicos son unitalla: selecciona el color o estampado que prefieras.</p>` : ""}
      <div class="quantity-add">
        <div class="quantity-control" aria-label="Cantidad">
          <button type="button" data-action="product-quantity" data-delta="-1" aria-label="Reducir cantidad">−</button>
          <output>${selection.quantity}</output>
          <button type="button" data-action="product-quantity" data-delta="1" aria-label="Aumentar cantidad">+</button>
        </div>
        <button class="add-button" type="button" data-action="add-product">Agregar al carrito <span aria-hidden="true">→</span></button>
      </div>
      <div class="modal-promises"><span>↗ Envío nacional</span><span>◇ Cambios 30 días</span></div>
    </section>
  </div>`;
}

function modalShell(content, labelledBy, extraClass = "") {
  return `<div class="modal-scrim" data-action="scrim">
    <div class="modal-panel ${extraClass}" role="dialog" aria-modal="true" aria-labelledby="${labelledBy}" tabindex="-1">
      <button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
      ${content}
    </div>
  </div>`;
}

function renderProductModal(modal) {
  return modalShell(productModalMarkup(modal), "product-modal-title");
}

function companionFor(product) {
  const otherCategory = product.category === "Filipina" ? "Pantalón" : product.category === "Pantalón" ? "Filipina" : null;
  return otherCategory ? products.find((item) => item.category === otherCategory) || null : null;
}

function offerMarkup(modal) {
  const { product, companion, selection } = modal;
  const missingPart = companion.category === "Pantalón" ? "el pantalón" : "la filipina";
  const sourcePart = product.category === "Pantalón" ? "el pantalón" : "la filipina";
  const selected = [selection.gender, selection.cut, selection.color, `talla ${selection.size}`].filter(Boolean).join(" · ");
  return modalShell(`<div class="offer-layout">
    <div class="modal-visual">${visualMarkup(companion, selection.color)}</div>
    <section class="offer-copy">
      <p class="modal-eyebrow">Completa tu conjunto</p>
      <h2 id="offer-title">¿Quieres agregar ${missingPart}?</h2>
      <p>Elegiste solo ${sourcePart}. Puedes llevar también ${missingPart} y completar tu conjunto con la misma selección.</p>
      <div class="offer-selection"><small>Se agregará con</small><p>${selected}</p><p><span>${companion.name} · ${money(companion.price)}</span></p></div>
      <div class="offer-actions">
        <button class="offer-primary" type="button" data-action="add-companion">Sí, agregar ${missingPart} <span aria-hidden="true">→</span></button>
        <button class="offer-secondary" type="button" data-action="keep-single">No, llevaré solo ${sourcePart}</button>
      </div>
    </section>
  </div>`, "offer-title");
}

function cartMarkup() {
  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const items = state.cart.length
    ? state.cart.map((item, index) => `<article class="cart-item">
        ${visualMarkup(item.product, item.color)}
        <div class="cart-item-info">
          <div class="cart-item-top"><div><h3>${item.product.name}</h3><p class="cart-item-selection">${cartSelectionLabel(item)}</p></div><p class="cart-item-price">${money(item.product.price * item.quantity)}</p></div>
          <div class="cart-item-controls">
            <div class="cart-quantity">
              <button type="button" data-action="change-cart" data-index="${index}" data-delta="-1" aria-label="Reducir cantidad">−</button>
              <output>${item.quantity}</output>
              <button type="button" data-action="change-cart" data-index="${index}" data-delta="1" aria-label="Aumentar cantidad">+</button>
            </div>
            <button type="button" class="remove-item" data-action="remove-cart" data-index="${index}">Quitar</button>
          </div>
        </div>
      </article>`).join("")
    : `<div class="cart-empty"><div class="cart-empty-icon" aria-hidden="true">▱</div><h3>Tu carrito está en calma</h3><p>Explora piezas pensadas para moverse contigo durante todo el turno.</p><button class="button button-dark" type="button" data-action="continue-shopping">Ver colección</button></div>`;
  return modalShell(`<div class="cart-layout">
    <header class="cart-heading"><div><small>Tu selección</small><h2 id="cart-title">Carrito <span>(${state.cart.length})</span></h2></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar carrito">×</button></header>
    <div class="cart-items">${items}</div>
    ${state.cart.length ? `<footer class="cart-footer">
      <div class="cart-total"><span>Subtotal</span><strong>${money(total)}</strong></div>
      <p class="shipping-note">↗ Envío calculado al confirmar por WhatsApp</p>
      <button class="checkout-button" type="button" data-action="open-checkout">Continuar pedido <span aria-hidden="true">→</span></button>
    </footer>` : ""}
  </div>`, "cart-title", "cart-drawer");
}

function checkoutMarkup() {
  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const sent = state.modal.sent;
  const content = sent
    ? `<div class="checkout-content">
        <p class="modal-eyebrow">Último paso</p><h2 id="checkout-title">Prepara tu pedido</h2>
        <div class="checkout-success"><div class="success-mark">✓</div><h3>Pedido enviado a WhatsApp</h3>
          <p>Abrimos una conversación con tu selección. El equipo MSA confirmará disponibilidad, envío y forma de pago contigo.</p>
          <button class="button button-dark" type="button" data-action="close-modal">Volver a la tienda</button>
        </div>
      </div>`
    : `<div class="checkout-content">
        <p class="modal-eyebrow">Último paso</p><h2 id="checkout-title">Prepara tu pedido</h2>
        <p>Déjanos tus datos. No es un pago: es la forma más rápida de armar tu pedido con atención personalizada.</p>
        <form class="checkout-form" id="checkout-form">
          <div class="checkout-fields">
            <label>Nombre completo<input name="name" required autocomplete="name" placeholder="Tu nombre"></label>
            <label>Teléfono<input name="phone" required type="tel" autocomplete="tel" inputmode="tel" placeholder="10 dígitos"></label>
          </div>
          <label>Ciudad y estado<input name="city" required autocomplete="address-level2" placeholder="Ej. Puebla, Pue."></label>
          <label>Nota para tu pedido<textarea name="note" placeholder="¿Necesitas factura o tienes alguna indicación?"></textarea></label>
          <div class="checkout-submit-row">
            <span class="checkout-total">Total estimado<strong>${money(total)}</strong></span>
            <button class="checkout-button inline" type="submit">Continuar en WhatsApp <span aria-hidden="true">◉</span></button>
          </div>
          <p class="fine-print">Contacto provisional para demo: WhatsApp 52 55 0000 0000. Sustituir por el número oficial antes de publicar.</p>
        </form>
      </div>`;
  return modalShell(content, "checkout-title", "compact");
}

function sizeGuideData() {
  const { guideAudience: audience, guideGarment: garment } = state;
  if (audience === "Dama" && garment === "Filipina") {
    return { title: "Filipina Dama", sizes: ["XS", "S", "M", "L", "XL"], rows: [["Pecho", "92/95", "97/100", "102/105", "107/110", "112/115"], ["Cintura", "79/81", "84/86", "89/93", "96/100", "103/107"], ["Largo", "61", "63", "65", "67", "68"]] };
  }
  if (audience === "Dama") {
    return { title: "Pantalón Dama", sizes: ["XS", "S", "M", "L", "XL"], rows: [["Cintura", "63/65", "67/71", "73/77", "80/84", "87/91"], ["Cadera", "98/101", "103/106", "108/111", "113/116", "118/121"], ["Largo", "98", "98", "99", "100", "102"]] };
  }
  if (garment === "Filipina") {
    return { title: "Filipina Caballero", sizes: ["S", "M", "L", "XL"], rows: [["Cintura", "99/102", "104/107", "109/112", "114/117"], ["Largo", "70", "70", "72", "72"]] };
  }
  return { title: "Pantalón Caballero", sizes: ["S", "M", "L", "XL"], rows: [["Cintura", "73/75", "76/79", "80/83", "87/90"], ["Cadera", "105/110", "111/115", "116/120", "124/128"], ["Largo", "103", "105", "108", "111"]] };
}

function sizeGuideMarkup() {
  const guide = sizeGuideData();
  const columns = `1.15fr repeat(${guide.sizes.length}, minmax(0, 1fr))`;
  const rows = guide.rows.map((row) => `<div class="guide-row" style="grid-template-columns:${columns}">${row.map((cell) => `<span>${cell}</span>`).join("")}</div>`).join("");
  const headingSizes = guide.sizes.map((size) => `<span>${size}</span>`).join("");
  const toggle = (items, selected, action, garment = false) => items.map((item) =>
    `<button type="button" class="${item === selected ? "selected" : ""}" data-action="${action}" data-value="${item}">${item}</button>`,
  ).join("");
  return modalShell(`<div class="guide-content">
    <p class="modal-eyebrow">Encuentra tu ajuste</p>
    <h2 id="guide-title">Guía de tallas</h2>
    <p>Medidas oficiales de MSA Scrubs en centímetros. Mide sobre ropa ligera y mantén la cinta horizontal.</p>
    <div class="guide-toggles">
      <div><span class="guide-toggle-title">Colección</span><div class="toggle-pair">${toggle(["Dama", "Caballero"], state.guideAudience, "guide-audience")}</div></div>
      <div><span class="guide-toggle-title">Prenda</span><div class="toggle-pair garment">${toggle(["Filipina", "Pantalón"], state.guideGarment, "guide-garment", true)}</div></div>
    </div>
    <div class="guide-table-wrap"><div class="guide-table-title"><span>${guide.title}</span><span>cm</span></div>
      <div class="guide-table">
        <div class="guide-row header" style="grid-template-columns:${columns}"><span>Medida</span>${headingSizes}</div>
        ${rows}
      </div>
    </div>
    <p class="guide-note">Los rangos se muestran tal como fueron compartidos por MSA Scrubs. Si estás entre dos tallas, recomendamos elegir la mayor.</p>
    <div class="measure-method">
      <img src="./images/measurement-guide.png" alt="Referencia visual para tomar medidas de MSA Scrubs">
      <div class="measure-copy">
        <p class="modal-eyebrow">Cómo sacar tus medidas</p>
        <h3>Toma la cinta como referencia, no como límite.</h3>
        <div class="measure-cards">
          <div class="measure-card"><strong>Cintura</strong><p>Rodea con la cinta el contorno entre la última costilla y el hueso de la cadera.</p></div>
          <div class="measure-card"><strong>Cadera</strong><p>Mide el contorno de la parte más ancha, unos centímetros por debajo de la cintura.</p></div>
          <div class="measure-card"><strong>Largo de filipina</strong><p>Mide desde el hombro hasta la cadera o hasta el largo que prefieras.</p></div>
          <div class="measure-card"><strong>Largo de pantalón</strong><p>Mide desde la cintura hasta el tobillo o hasta el largo que prefieras.</p></div>
        </div>
      </div>
    </div>
    <p class="guide-note">Mide de pie, sin apretar la cinta y sobre ropa ligera. Para Caballero se utilizan las mismas referencias de medición.</p>
    <div class="guide-bottom-cards">
      <div class="guide-tip"><strong>¿Entre dos tallas?</strong><p>Elige la mayor para un fit más relajado, especialmente si buscas libertad en hombros y cadera.</p></div>
      <div class="guide-tip"><strong>¿Quieres ayuda?</strong><p>Escríbenos por WhatsApp y te orientamos con tus medidas.</p></div>
    </div>
  </div>`, "guide-title", "compact");
}

function renderModal() {
  if (!state.modal) {
    overlayRoot.innerHTML = "";
    document.body.classList.remove("dialog-open");
    return;
  }
  const previousScroll = $(".modal-panel")?.scrollTop || 0;
  const { type } = state.modal;
  const markup = type === "product" ? renderProductModal(state.modal)
    : type === "offer" ? offerMarkup(state.modal)
      : type === "cart" ? cartMarkup()
        : type === "checkout" ? checkoutMarkup()
          : sizeGuideMarkup();
  overlayRoot.innerHTML = markup;
  document.body.classList.add("dialog-open");
  const panel = $(".modal-panel");
  if (type !== "product" || previousScroll) panel.scrollTop = previousScroll;
  if (type === "checkout" && state.modal.sent) $("[data-action='close-modal']", panel)?.focus();
  else panel.focus({ preventScroll: true });
}

function openProduct(product) {
  state.modal = { type: "product", product, selection: selectedProductDefaults(product) };
  renderModal();
}

function openGuide() {
  state.modal = { type: "guide" };
  renderModal();
}

function openCart() {
  state.modal = { type: "cart" };
  renderModal();
}

function changeCart(index, amount) {
  const item = state.cart[index];
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) state.cart.splice(index, 1);
  renderCartCount();
  renderModal();
}

function assistantAnswer(question) {
  const lower = question.toLocaleLowerCase("es");
  if (lower.includes("talla") || lower.includes("medida")) return "Nuestra guía toma busto o pecho, cintura y cadera. Si estás entre dos tallas, elige la mayor. También puedes pedir orientación por WhatsApp.";
  if (lower.includes("envío") || lower.includes("envio")) return "Enviamos a todo México. El costo y tiempo dependen de tu ciudad; el equipo lo confirma al armar tu pedido.";
  if (lower.includes("cambio") || lower.includes("cambiar")) return "Aceptamos cambios durante 30 días, siempre que la prenda esté sin uso y con etiquetas.";
  if (lower.includes("tela") || lower.includes("material")) return "Trabajamos telas suaves, flexibles y de secado rápido, pensadas para turnos largos.";
  return "Puedo ayudarte mejor con tallas, envíos, cambios o materiales. Si prefieres, te atendemos directamente por WhatsApp.";
}

function renderAssistant() {
  const panel = $("#assistant-panel");
  panel.hidden = !state.assistantOpen;
  if (!state.assistantOpen) return;
  panel.innerHTML = `<div class="assistant-head"><div><small>Asistente MSA</small><h3>Estamos para orientarte</h3></div>
    <button type="button" data-action="close-assistant" aria-label="Cerrar asistente">×</button></div>
    <div class="assistant-content">
      <div class="assistant-answer" aria-live="polite">${state.assistantAnswer}</div>
      <div class="assistant-quick">
        <button type="button" data-action="assistant-question" data-question="¿Qué talla elijo?">¿Qué talla elijo?</button>
        <button type="button" data-action="assistant-question" data-question="¿Cuánto tarda el envío?">¿Cuánto tarda el envío?</button>
        <button type="button" data-action="assistant-question" data-question="¿Puedo cambiar?">¿Puedo cambiar?</button>
      </div>
      <form class="assistant-ask" id="assistant-form">
        <input name="question" value="${state.assistantQuestion.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")}" placeholder="Escribe una pregunta" aria-label="Escribe una pregunta">
        <button type="submit" aria-label="Enviar pregunta">→</button>
      </form>
      <a class="assistant-whatsapp" href="${whatsappUrl("Hola MSA Scrubs, necesito orientación con mi pedido.")}" target="_blank" rel="noreferrer">◉ Hablar con el equipo por WhatsApp</a>
    </div>`;
}

function setAssistantQuestion(question) {
  state.assistantQuestion = question;
  state.assistantAnswer = assistantAnswer(question);
  renderAssistant();
  $("#assistant-form input")?.focus();
}

function handleAction(action, target) {
  if (action === "toggle-menu") {
    $("#main-nav").classList.toggle("open");
    return;
  }
  if (action === "open-cart") return openCart();
  if (action === "open-guide") return openGuide();
  if (action === "open-product") {
    const product = productById(target.dataset.productId);
    if (product) openProduct(product);
    return;
  }
  if (action === "filter-gender") {
    state.gender = target.dataset.gender;
    renderCatalog();
    return;
  }
  if (action === "shortcut-category") {
    state.gender = "Todos";
    state.category = target.dataset.category;
    renderCatalog();
    $("#coleccion").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (action === "clear-filters") {
    state.gender = "Todos";
    state.category = "Todos";
    setSearch("");
    return;
  }
  if (action === "add-product" && state.modal?.type === "product") {
    const { product, selection } = state.modal;
    addToCart(product, selection);
    const companion = companionFor(product);
    if (companion) {
      state.modal = { type: "offer", product, companion, selection: { ...selection } };
      renderModal();
    } else openCart();
    return;
  }
  if (action.startsWith("product-option-") && state.modal?.type === "product") {
    const name = action.replace("product-option-", "");
    const key = name === "gender" ? "gender" : name === "cut" ? "cut" : name === "color" ? "color" : "size";
    state.modal.selection[key] = target.dataset.value;
    renderModal();
    return;
  }
  if (action === "product-quantity" && state.modal?.type === "product") {
    state.modal.selection.quantity = Math.max(1, state.modal.selection.quantity + Number(target.dataset.delta));
    renderModal();
    return;
  }
  if (action === "add-companion" && state.modal?.type === "offer") {
    const { companion, selection } = state.modal;
    addToCart(companion, selection);
    return openCart();
  }
  if (action === "keep-single" && state.modal?.type === "offer") return openCart();
  if (action === "change-cart") return changeCart(Number(target.dataset.index), Number(target.dataset.delta));
  if (action === "remove-cart") {
    const index = Number(target.dataset.index);
    const item = state.cart[index];
    if (item) changeCart(index, -item.quantity);
    return;
  }
  if (action === "open-checkout") {
    state.modal = { type: "checkout", sent: false };
    return renderModal();
  }
  if (action === "continue-shopping") {
    state.modal = null;
    renderModal();
    $("#coleccion").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (action === "guide-audience") {
    state.guideAudience = target.dataset.value;
    return renderModal();
  }
  if (action === "guide-garment") {
    state.guideGarment = target.dataset.value;
    return renderModal();
  }
  if (action === "toggle-assistant") {
    state.assistantOpen = !state.assistantOpen;
    return renderAssistant();
  }
  if (action === "close-assistant") {
    state.assistantOpen = false;
    return renderAssistant();
  }
  if (action === "assistant-question") return setAssistantQuestion(target.dataset.question);
  if (action === "close-modal") {
    state.modal = null;
    return renderModal();
  }
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    if (event.target.classList.contains("modal-scrim") && state.modal) {
      state.modal = null;
      renderModal();
    }
    return;
  }
  const action = actionTarget.dataset.action;
  if (action === "scrim") {
    if (event.target === actionTarget) {
      state.modal = null;
      renderModal();
    }
    return;
  }
  handleAction(action, actionTarget);
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#search-desktop, #search-mobile")) setSearch(event.target.value);
  if (event.target.matches("#assistant-form input")) state.assistantQuestion = event.target.value;
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#category-filter")) {
    state.category = event.target.value;
    renderCatalog();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "assistant-form") {
    event.preventDefault();
    setAssistantQuestion(new FormData(event.target).get("question")?.toString().trim() || "");
    return;
  }
  if (event.target.id === "checkout-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const city = String(form.get("city") || "").trim();
    const note = String(form.get("note") || "").trim();
    const lines = state.cart.map((item) => `${item.quantity} x ${item.product.name} (${cartSelectionLabel(item)})`).join(", ");
    const message = `Hola MSA Scrubs, soy ${name}.\nTeléfono: ${phone}\nCiudad y estado: ${city}\nMe gustaría confirmar este pedido: ${lines}.\nTotal estimado: ${money(state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}.${note ? `\nNota: ${note}` : ""}`;
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    state.modal = { type: "checkout", sent: true };
    renderModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.modal) {
      state.modal = null;
      renderModal();
    } else if (state.assistantOpen) {
      state.assistantOpen = false;
      renderAssistant();
    }
  }
});

for (const link of $$('a[href^="https://wa.me/"]')) {
  const originalMessage = new URL(link.href).searchParams.get("text") || "";
  link.href = whatsappUrl(originalMessage);
}

renderCatalog();
renderCartCount();