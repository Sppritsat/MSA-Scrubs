"use strict";
// =====================================================================
// Tienda MSA Scrubs
// Catálogo, portadas y existencias vienen de Supabase (datos.js);
// si no responde, se usa el respaldo de catalogo.js.
// =====================================================================

const state = {
  products: FALLBACK_PRODUCTS.map(normalizeProduct),
  banners: FALLBACK_BANNERS,
  search: "",
  gender: "Todos",
  category: "Todos",
  collection: "",
  cart: [],
  modal: null,
  assistantOpen: false,
  assistantQuestion: "",
  assistantAnswer: "Hola. Puedo orientarte sobre tallas, envíos, cambios y materiales.",
  guideAudience: "Dama",
  guideGarment: "Filipina",
  user: null,
  measures: null,
  inventory: new Map(),
  heroIndex: 0,
  myOrders: null,     // pedidos del cliente con sesión (Mis pedidos)
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const overlayRoot = $("#overlay-root");
const money = (value) => `$${Number(value).toLocaleString("es-MX")} MXN`;
const priceLabel = (product) => hasPrice(product) ? money(product.price) : "Precio a consultar";
const whatsappUrl = (message = "") => `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const safeLink = (link) => /^(#|https?:\/\/)/.test(String(link || "")) ? link : "#coleccion";
let toastTimer;

const sellableProducts = () => state.products.filter(isSellable).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"));
const productById = (id) => sellableProducts().find((product) => product.id === id);

// ---------------------------------------------------------------------
// Almacenamiento local (medidas y carrito): solo en este navegador.
// ---------------------------------------------------------------------
const MEASURES_KEY = "msa-medidas";
const CART_KEY = "msa-carrito";

function readLocal(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Navegación privada o almacenamiento bloqueado: se queda solo en memoria.
  }
}

const loadLocalMeasures = () => {
  const saved = readLocal(MEASURES_KEY);
  return saved && typeof saved === "object" ? saved : null;
};
const saveLocalMeasures = (measures) => writeLocal(MEASURES_KEY, measures);
const hasMeasures = (measures) => Boolean(measures && (measures.pecho || measures.cintura || measures.cadera));

function saveCart() {
  writeLocal(CART_KEY, state.cart.map((item) => ({ id: item.product.id, variant: item.variant, color: item.color, size: item.size, quantity: item.quantity })));
}

// Recupera el carrito guardado, descartando piezas que ya no existen.
function restoreCart() {
  const saved = readLocal(CART_KEY);
  if (!Array.isArray(saved)) return;
  state.cart = saved.map((item) => {
    const product = productById(item.id);
    if (!product || !product.colors.includes(item.color) || !product.sizes.includes(item.size)) return null;
    const variant = hasPantsChoice(product) ? (product.pants_options.includes(item.variant) ? item.variant : product.pants_options[0]) : "";
    return { product, variant, color: item.color, size: item.size, quantity: Math.min(20, Math.max(1, Number(item.quantity) || 1)) };
  }).filter(Boolean);
}

// ---------------------------------------------------------------------
// Existencias: combinación no capturada = disponible; 0 = agotada.
// ---------------------------------------------------------------------
function stockFor(product, color, size, variant) {
  const key = MSA_DB.inventoryKey(product.id, product.gender, color, size, hasPantsChoice(product) ? variant : "");
  return state.inventory.has(key) ? state.inventory.get(key) : null;
}

const isSoldOut = (product, color, size, variant) => stockFor(product, color, size, variant) === 0;

// Agotado por completo: todas sus combinaciones están capturadas en 0.
function productSoldOut(product) {
  const variants = hasPantsChoice(product) ? product.pants_options : [""];
  return product.colors.every((color) => product.sizes.every((size) => variants.every((variant) => isSoldOut(product, color, size, variant))));
}

// ---------------------------------------------------------------------
// Visuales de producto
// ---------------------------------------------------------------------
function photoFor(product, color) {
  if (color) return product.photos[color] || null;
  return Object.values(product.photos)[0] || product.gallery[0] || null;
}

// Segunda foto para el efecto al pasar el cursor en la tarjeta.
function hoverPhotoFor(product) {
  const photos = [...Object.values(product.photos), ...product.gallery];
  return photos[1] || null;
}

function toneFor(product, color) {
  return colorStyles[color || ""] || CATEGORY_TONES[product.category] || CATEGORY_TONES.Conjunto;
}

function visualMarkup(product, color, { lazy = true, hover = false } = {}) {
  const styles = toneFor(product, color);
  const photo = photoFor(product, color);
  const second = hover ? hoverPhotoFor(product) : null;
  const alt = `${product.name}${color ? ` en color ${color}` : ""}`;
  const image = photo
    ? `<img class="photo" src="${escapeHtml(imageUrl(photo))}" alt="${escapeHtml(alt)}" ${lazy ? 'loading="lazy"' : ""} decoding="async">
       ${second ? `<img class="photo photo-hover" src="${escapeHtml(imageUrl(second))}" alt="" loading="lazy" decoding="async">` : ""}`
    : `<span class="visual-orb"></span><span class="garment-shape ${isGorro(product) ? "cap" : ""}"></span>`;
  return `<div class="product-visual" style="--visual-tone:${styles.tone};--visual-accent:${styles.accent}">
    ${image}
    <span class="visual-category">${escapeHtml(product.category)}</span>
    ${photo ? "" : `<span class="visual-initial" aria-hidden="true">${escapeHtml(product.name.slice(0, 1))}</span>`}
    ${color ? `<span class="visual-color">${escapeHtml(color)}</span>` : ""}
  </div>`;
}

function swatchesMarkup(product, limit = 6) {
  const shown = product.colors.slice(0, limit);
  const extra = product.colors.length - shown.length;
  return `<div class="swatches" aria-label="${product.colors.length} colores">
    ${shown.map((color) => `<span class="swatch" style="--swatch:${(colorStyles[color] || {}).accent || "#c8c2b6"}" title="${escapeHtml(color)}"></span>`).join("")}
    ${extra > 0 ? `<span class="swatch-more">+${extra}</span>` : ""}
  </div>`;
}

function productCardMarkup(product, index = 0) {
  const soldOut = productSoldOut(product);
  const badge = soldOut ? "Agotado" : product.badge;
  return `<article class="product-card reveal" style="--i:${index % 8}">
    <button class="product-open" type="button" data-action="open-product" data-product-id="${escapeHtml(product.id)}" aria-label="Ver ${escapeHtml(product.name)}">
      ${visualMarkup(product, null, { hover: true })}
      ${badge ? `<span class="product-badge ${soldOut ? "sold-out" : ""}">${escapeHtml(badge)}</span>` : ""}
      <span class="product-arrow" aria-hidden="true">→</span>
    </button>
    <div class="product-info">
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.note)}</p>
        ${product.colors.length > 1 ? swatchesMarkup(product) : ""}
      </div>
      <p class="product-price ${hasPrice(product) ? "" : "quote"}">${priceLabel(product)}</p>
    </div>
  </article>`;
}

// ---------------------------------------------------------------------
// Animación al aparecer en pantalla
// ---------------------------------------------------------------------
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
  : null;

function observeReveals(root = document) {
  for (const element of $$(".reveal:not(.is-visible)", root)) {
    if (!revealObserver || reduceMotion()) element.classList.add("is-visible");
    else revealObserver.observe(element);
  }
}

// ---------------------------------------------------------------------
// Portadas (carrusel principal)
// ---------------------------------------------------------------------
const HERO_TONES = ["#dfe9e5", "#f1e6dc", "#e7e1ef", "#e4e9e0"];
const HERO_INTERVAL = 6500;
let heroTimer = null;
let heroPaused = false;

function renderHero() {
  const track = $("#hero-track");
  const dots = $("#hero-dots");
  if (!track) return;
  const banners = state.banners.length ? state.banners : FALLBACK_BANNERS;
  state.heroIndex = Math.min(state.heroIndex, banners.length - 1);
  track.innerHTML = banners.map((banner, index) => {
    const heading = index === 0 ? "h1" : "h2";
    return `<article class="hero-slide ${index === state.heroIndex ? "is-active" : ""}" style="--slide-tone:${HERO_TONES[index % HERO_TONES.length]}"
        aria-roledescription="portada" aria-label="${index + 1} de ${banners.length}" ${index === state.heroIndex ? "" : 'aria-hidden="true" inert'}>
      <div class="hero-slide-copy">
        ${banner.eyebrow ? `<p class="eyebrow"><span></span> ${escapeHtml(banner.eyebrow)}</p>` : ""}
        <${heading} class="hero-title">${escapeHtml(banner.title)}</${heading}>
        ${banner.subtitle ? `<p class="hero-description">${escapeHtml(banner.subtitle)}</p>` : ""}
        <div class="hero-actions">
          ${banner.button_text ? `<a class="button button-accent" href="${escapeHtml(safeLink(banner.link))}">${escapeHtml(banner.button_text)} <span aria-hidden="true">→</span></a>` : ""}
          <a class="button button-outline" href="#coleccion">Ir a la tienda</a>
        </div>
      </div>
      <figure class="hero-slide-art">
        ${banner.image ? `<img src="${escapeHtml(imageUrl(banner.image))}" alt="" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ""}
      </figure>
    </article>`;
  }).join("");
  dots.innerHTML = banners.length > 1 ? banners.map((_, index) =>
    `<button type="button" class="${index === state.heroIndex ? "active" : ""}" data-action="hero-go" data-index="${index}" aria-label="Ir a la portada ${index + 1}" aria-current="${index === state.heroIndex}"><span></span></button>`).join("") : "";
  $(".hero-carousel")?.classList.toggle("single", banners.length < 2);
  restartHeroTimer();
}

function goToSlide(index) {
  const slides = $$(".hero-slide");
  if (!slides.length) return;
  state.heroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    const active = i === state.heroIndex;
    slide.classList.toggle("is-active", active);
    slide.toggleAttribute("inert", !active);
    if (active) slide.removeAttribute("aria-hidden");
    else slide.setAttribute("aria-hidden", "true");
  });
  $$("#hero-dots button").forEach((dot, i) => {
    dot.classList.toggle("active", i === state.heroIndex);
    dot.setAttribute("aria-current", String(i === state.heroIndex));
  });
  restartHeroTimer();
}

function restartHeroTimer() {
  window.clearInterval(heroTimer);
  const count = $$(".hero-slide").length;
  if (count < 2 || heroPaused || reduceMotion()) return;
  heroTimer = window.setInterval(() => {
    if (!document.hidden) goToSlide(state.heroIndex + 1);
  }, HERO_INTERVAL);
}

function setupHeroInteractions() {
  const carousel = $(".hero-carousel");
  if (!carousel) return;
  const pause = () => { heroPaused = true; restartHeroTimer(); };
  const resume = () => { heroPaused = false; restartHeroTimer(); };
  carousel.addEventListener("mouseenter", pause);
  carousel.addEventListener("mouseleave", resume);
  carousel.addEventListener("focusin", pause);
  carousel.addEventListener("focusout", (event) => { if (!carousel.contains(event.relatedTarget)) resume(); });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") goToSlide(state.heroIndex + 1);
    if (event.key === "ArrowLeft") goToSlide(state.heroIndex - 1);
  });
  // Deslizar con el dedo
  let startX = null;
  carousel.addEventListener("pointerdown", (event) => { if (event.pointerType !== "mouse") startX = event.clientX; });
  carousel.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    if (Math.abs(delta) > 45) goToSlide(state.heroIndex + (delta < 0 ? 1 : -1));
  });
}

// ---------------------------------------------------------------------
// Carruseles de destacados y colecciones
// ---------------------------------------------------------------------
function renderFeatured() {
  const section = $("#destacados");
  const track = $("#featured-track");
  if (!section || !track) return;
  const featured = sellableProducts().filter((product) => product.featured);
  section.hidden = featured.length === 0;
  track.innerHTML = featured.map((product, index) => `<div class="rail-item">${productCardMarkup(product, index)}</div>`).join("");
  updateRailButtons(track);
  observeReveals(track);
}

function renderCollections() {
  const section = $("#colecciones");
  const track = $("#collections-track");
  if (!section || !track) return;
  const groups = new Map();
  for (const product of sellableProducts()) {
    if (!product.collection || !isSet(product)) continue;
    if (!groups.has(product.collection)) groups.set(product.collection, []);
    groups.get(product.collection).push(product);
  }
  section.hidden = groups.size === 0;
  track.innerHTML = [...groups.entries()].map(([name, items], index) => {
    const lead = items[0];
    const photo = photoFor(lead, null);
    const styles = toneFor(lead, Object.keys(lead.photos)[0]);
    return `<button type="button" class="collection-tile reveal" style="--i:${index};--tile-tone:${styles.tone}" data-action="filter-collection" data-collection="${escapeHtml(name)}">
      ${photo ? `<img src="${escapeHtml(imageUrl(photo))}" alt="" loading="lazy" decoding="async">` : ""}
      <span class="collection-tile-copy"><small>Colección</small><strong>${escapeHtml(name)}</strong><span>${escapeHtml(lead.note)}</span></span>
      <span class="round-arrow" aria-hidden="true">→</span>
    </button>`;
  }).join("");
  updateRailButtons(track);
  observeReveals(track);
}

function updateRailButtons(track) {
  const wrap = track.closest(".rail");
  if (!wrap) return;
  const maxScroll = track.scrollWidth - track.clientWidth - 2;
  const prev = $(".rail-prev", wrap);
  const next = $(".rail-next", wrap);
  if (prev) prev.disabled = track.scrollLeft <= 2;
  if (next) next.disabled = track.scrollLeft >= maxScroll;
  wrap.classList.toggle("no-scroll", maxScroll <= 0);
}

function scrollRail(button, direction) {
  const track = $(".rail-track", button.closest(".rail"));
  if (!track) return;
  const item = track.firstElementChild;
  const step = item ? item.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
  track.scrollBy({ left: direction * step * (window.innerWidth > 760 ? 2 : 1), behavior: reduceMotion() ? "auto" : "smooth" });
}

// ---------------------------------------------------------------------
// Catálogo con filtros
// ---------------------------------------------------------------------
function availableGenders() {
  const genders = new Set(sellableProducts().map((product) => product.gender));
  return ["Mujer", "Caballero", "Unisex"].filter((gender) => genders.has(gender));
}

function renderGenderFilters() {
  const container = $("#gender-filters");
  const genders = availableGenders();
  const options = genders.length > 1 ? ["Todos", ...genders] : [];
  container.hidden = options.length === 0;
  container.innerHTML = options.map((gender) =>
    `<button class="filter-pill ${state.gender === gender ? "active" : ""}" type="button" data-action="filter-gender" data-gender="${gender}" aria-pressed="${state.gender === gender}">${gender === "Todos" ? "Todos" : genderLabel(gender)}</button>`).join("");
}

function renderCategoryOptions() {
  const present = new Set(sellableProducts().map((product) => product.category));
  $("#category-filter").innerHTML = ["Todos", ...CATEGORIES.filter((category) => present.has(category))].map((category) =>
    `<option value="${category}" ${state.category === category ? "selected" : ""}>${category === "Todos" ? "Todas las categorías" : CATEGORY_LABELS[category]}</option>`).join("");
}

function matchesFilters(product) {
  const matchesGender = state.gender === "Todos" || product.gender === state.gender ||
    (product.gender === "Unisex" && state.gender !== "Unisex");
  const matchesCategory = state.category === "Todos" || product.category === state.category;
  const matchesCollection = !state.collection || product.collection === state.collection;
  const searchable = `${product.name} ${product.category} ${product.collection} ${product.note} ${product.colors.join(" ")}`.toLocaleLowerCase("es");
  return matchesGender && matchesCategory && matchesCollection && searchable.includes(state.search.trim().toLocaleLowerCase("es"));
}

function renderCatalog() {
  const grid = $("#product-grid");
  const matches = sellableProducts().filter(matchesFilters);
  grid.innerHTML = matches.map((product, index) => productCardMarkup(product, index)).join("");
  $("#empty-state").hidden = matches.length !== 0;
  grid.hidden = matches.length === 0;
  const chip = $("#collection-chip");
  chip.hidden = !state.collection;
  chip.innerHTML = state.collection ? `Colección ${escapeHtml(state.collection)} <button type="button" data-action="clear-collection" aria-label="Quitar filtro de colección">×</button>` : "";
  renderGenderFilters();
  renderCategoryOptions();
  observeReveals(grid);
}

function renderStore() {
  renderHero();
  renderFeatured();
  renderCollections();
  renderCatalog();
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

// ---------------------------------------------------------------------
// Carrito
// ---------------------------------------------------------------------
const cartCount = () => state.cart.reduce((sum, item) => sum + item.quantity, 0);
const cartTotal = () => state.cart.reduce((sum, item) => sum + (hasPrice(item.product) ? item.product.price * item.quantity : 0), 0);
const cartHasQuotes = () => state.cart.some((item) => !hasPrice(item.product));
const totalLabel = (total) => cartHasQuotes() ? `${total > 0 ? `${money(total)} + ` : ""}piezas por cotizar` : money(total);

function renderCartCount() {
  const count = $("#cart-count");
  const total = cartCount();
  const changed = count.textContent !== String(total);
  count.textContent = total;
  count.hidden = total === 0;
  if (changed && total > 0 && !reduceMotion()) {
    count.classList.remove("bump");
    void count.offsetWidth;
    count.classList.add("bump");
  }
}

function cartSelectionLabel(item) {
  return [
    item.variant ? `Pantalón ${item.variant.toLowerCase()}` : null,
    item.color,
    isGorro(item.product) ? "Unitalla" : `Talla ${item.size}`,
  ].filter(Boolean).join(" · ");
}

function addToCart(product, selection) {
  const found = state.cart.find((item) => item.product.id === product.id && item.variant === selection.variant &&
    item.size === selection.size && item.color === selection.color);
  if (found) found.quantity = Math.min(20, found.quantity + selection.quantity);
  else state.cart.push({ product, variant: selection.variant, color: selection.color, size: selection.size, quantity: selection.quantity });
  saveCart();
  renderCartCount();
  toast(`${product.name} se agregó al carrito.`);
}

function changeCart(index, amount) {
  const item = state.cart[index];
  if (!item) return;
  item.quantity = Math.min(20, item.quantity + amount);
  if (item.quantity <= 0) state.cart.splice(index, 1);
  saveCart();
  renderCartCount();
  renderModal();
}

// ---------------------------------------------------------------------
// Ventana de producto
// ---------------------------------------------------------------------
function selectedProductDefaults(product) {
  const selection = {
    variant: hasPantsChoice(product) ? product.pants_options[0] : "",
    size: product.sizes[1] || product.sizes[0],
    color: Object.keys(product.photos).find((color) => product.colors.includes(color)) || product.colors[0],
    quantity: 1,
    slide: 0,
  };
  return withBestSize(product, selection);
}

// Elige la talla recomendada si existe y no está agotada; si la talla
// actual está agotada, pasa a la primera disponible.
function withBestSize(product, selection) {
  const recommended = recommendProductSize(product, state.measures)?.size;
  const available = (size) => !isSoldOut(product, selection.color, size, selection.variant);
  if (recommended && available(recommended)) return { ...selection, size: recommended };
  if (!available(selection.size)) {
    const firstAvailable = product.sizes.find(available);
    if (firstAvailable) return { ...selection, size: firstAvailable };
  }
  return selection;
}

function optionButtons(options, selected, action, extraClass = "") {
  return options.map((value) => `
    <button class="option-button ${extraClass} ${value === selected ? "selected" : ""}" type="button"
      data-action="${action}" data-value="${escapeHtml(value)}" aria-pressed="${value === selected}">${escapeHtml(value)}</button>`).join("");
}

function colorButtons(product, selected) {
  return product.colors.map((color) => {
    const swatch = (colorStyles[color] || {}).accent || "#c8c2b6";
    return `<button class="option-button color-option ${color === selected ? "selected" : ""}" type="button" data-action="product-option-color"
      data-value="${escapeHtml(color)}" aria-pressed="${color === selected}"><span class="swatch" style="--swatch:${swatch}" aria-hidden="true"></span>${escapeHtml(color)}</button>`;
  }).join("");
}

function sizeButtons(product, selection, recommendation) {
  return product.sizes.map((size) => {
    const soldOut = isSoldOut(product, selection.color, size, selection.variant);
    const recommended = recommendation?.size === size;
    const selected = size === selection.size;
    const title = soldOut ? "Agotado en esta combinación" : recommended ? "Tu talla recomendada" : "";
    return `<button class="option-button size-option ${selected ? "selected" : ""} ${recommended ? "recommended" : ""} ${soldOut ? "sold-out" : ""}" type="button"
      data-action="product-option-size" data-value="${escapeHtml(size)}" aria-pressed="${selected}" ${soldOut ? "disabled" : ""} ${title ? `title="${title}"` : ""}>
      ${escapeHtml(size)}${soldOut ? `<span class="visually-hidden"> agotado</span>` : recommended ? `<span class="visually-hidden"> recomendada</span>` : ""}</button>`;
  }).join("");
}

function recommendationMarkup(product, recommendation) {
  if (!isSet(product)) return "";
  if (!hasMeasures(state.measures)) {
    return `<button class="recommend-cta" type="button" data-action="open-account"><span aria-hidden="true">◎</span> ¿No sabes tu talla? Calcúlala con tus medidas</button>`;
  }
  if (!recommendation) {
    return `<p class="recommend-box">Nos faltan algunas medidas para recomendarte talla. <button type="button" data-action="open-account">Completar medidas</button></p>`;
  }
  if (recommendation.tooBig || recommendation.notAvailable) {
    const reason = recommendation.ideal
      ? `tu talla sería <strong>${recommendation.ideal}</strong>, que este modelo no maneja`
      : "necesitas una talla mayor a las de nuestra guía";
    return `<p class="recommend-box warn">Por tus medidas, ${reason}. Escríbenos por WhatsApp y te orientamos. <button type="button" data-action="open-account">Ver mis medidas</button></p>`;
  }
  const detail = ` <small>(filipina ${recommendation.parts[0].result.size} · pantalón ${recommendation.parts[1].result.size})</small>`;
  const smallest = recommendation.smallestAvailable ? ` Tus medidas corresponden a ${recommendation.ideal}; esta es la talla más chica del modelo.` : "";
  return `<p class="recommend-box"><span aria-hidden="true">◎</span> Tu talla recomendada: <strong>${recommendation.size}</strong>${detail}.${smallest} <button type="button" data-action="open-account">Editar medidas</button></p>`;
}

// Fotos del producto: la del color elegido y las de detalle.
function gallerySlides(product, color) {
  const slides = [];
  const colorPhoto = photoFor(product, color);
  slides.push({ type: "color", src: colorPhoto });
  for (const src of product.gallery) slides.push({ type: "detail", src });
  return slides;
}

function galleryMarkup(product, selection) {
  const slides = gallerySlides(product, selection.color);
  const current = Math.min(selection.slide || 0, slides.length - 1);
  const slideMarkup = (slide, index) => slide.src && slide.type === "detail"
    ? `<div class="product-visual detail" style="--visual-tone:#efe9df"><img class="photo cover" src="${escapeHtml(imageUrl(slide.src))}" alt="Detalle de ${escapeHtml(product.name)} ${index}" loading="lazy" decoding="async"></div>`
    : visualMarkup(product, selection.color, { lazy: false });
  return `<div class="gallery" data-slides="${slides.length}">
    <div class="gallery-track" style="--slide:${current}">
      ${slides.map((slide, index) => `<div class="gallery-slide ${index === current ? "is-active" : ""}" aria-hidden="${index !== current}">${slideMarkup(slide, index)}</div>`).join("")}
    </div>
    ${slides.length > 1 ? `
      <button class="gallery-nav prev" type="button" data-action="gallery-step" data-delta="-1" aria-label="Foto anterior" ${current === 0 ? "disabled" : ""}>‹</button>
      <button class="gallery-nav next" type="button" data-action="gallery-step" data-delta="1" aria-label="Foto siguiente" ${current === slides.length - 1 ? "disabled" : ""}>›</button>
      <div class="gallery-thumbs">${slides.map((slide, index) => `<button type="button" class="${index === current ? "active" : ""}" data-action="gallery-go" data-index="${index}" aria-label="Ver foto ${index + 1}">
        ${slide.src ? `<img src="${escapeHtml(imageUrl(slide.src))}" alt="" loading="lazy">` : `<span style="--swatch:${toneFor(product, selection.color).accent}"></span>`}</button>`).join("")}</div>` : ""}
  </div>`;
}

function productModalMarkup(modal) {
  const { product, selection } = modal;
  const recommendation = recommendProductSize(product, state.measures);
  const soldOut = isSoldOut(product, selection.color, selection.size, selection.variant);
  let stepNumber = 0;
  const step = () => `${++stepNumber}. `;
  const eyebrow = [genderLabel(product.gender), product.category, product.collection ? `Colección ${product.collection}` : ""].filter(Boolean).join(" · ");
  return `<div class="product-modal-layout">
    <div class="modal-visual">${galleryMarkup(product, selection)}</div>
    <section class="modal-copy">
      <p class="modal-eyebrow">${escapeHtml(eyebrow)}</p>
      <h2 id="product-modal-title">${escapeHtml(product.name)}</h2>
      <p class="modal-description">${escapeHtml(product.note)}${product.note ? "." : ""} ${escapeHtml(product.description || (isSet(product) ? "Se vende como conjunto completo: filipina y pantalón." : ""))}</p>
      <p class="modal-price">${hasPrice(product) ? `${money(product.price)}${isSet(product) ? ` <small>conjunto completo</small>` : ""}` : `Precio a consultar <small>te lo confirmamos por WhatsApp</small>`}</p>
      <div class="modal-separator"></div>
      ${hasPantsChoice(product) ? `<div class="option-group">
        <div class="option-heading"><strong>${step()}Pantalón</strong><span>Mismo precio en ambos cortes</span></div>
        <div class="option-list">${optionButtons(product.pants_options, selection.variant, "product-option-variant")}</div>
      </div>` : ""}
      <div class="option-group">
        <div class="option-heading"><strong>${step()}Color</strong><span>${escapeHtml(selection.color)}</span></div>
        <div class="option-list">${colorButtons(product, selection.color)}</div>
      </div>
      <div class="option-group">
        <div class="option-heading">
          <strong>${step()}Talla${isGorro(product) ? " · Unitalla" : ""}</strong>
          ${isSet(product) ? `<button class="size-guide-link" type="button" data-action="open-guide">⌁ Ver guía</button>` : ""}
        </div>
        <div class="option-list">${sizeButtons(product, selection, recommendation)}</div>
        ${recommendationMarkup(product, recommendation)}
        ${isGorro(product) ? "" : `<p class="size-note">¿Necesitas otra talla? <a href="${whatsappUrl(`Hola MSA Scrubs, me interesa ${product.name} en una talla sobre pedido.`)}" target="_blank" rel="noreferrer">Se hace sobre pedido</a>.</p>`}
      </div>
      ${isGorro(product) ? `<p class="note-box sage">Los gorros quirúrgicos son unitalla: elige el color que prefieras.</p>` : ""}
      <div class="quantity-add">
        <div class="quantity-control" aria-label="Cantidad">
          <button type="button" data-action="product-quantity" data-delta="-1" aria-label="Reducir cantidad">−</button>
          <output>${selection.quantity}</output>
          <button type="button" data-action="product-quantity" data-delta="1" aria-label="Aumentar cantidad">+</button>
        </div>
        <button class="add-button" type="button" data-action="add-product" ${soldOut ? "disabled" : ""}>${soldOut ? "Agotado en esta combinación" : `Agregar al carrito <span aria-hidden="true">→</span>`}</button>
      </div>
      <div class="modal-promises"><span>↗ Envío nacional</span><span>◉ Pedido por WhatsApp</span></div>
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

// ---------------------------------------------------------------------
// Carrito y pedido
// ---------------------------------------------------------------------
function cartMarkup() {
  const items = state.cart.length
    ? state.cart.map((item, index) => `<article class="cart-item">
        ${visualMarkup(item.product, item.color)}
        <div class="cart-item-info">
          <div class="cart-item-top"><div><h3>${escapeHtml(item.product.name)}</h3><p class="cart-item-selection">${escapeHtml(cartSelectionLabel(item))}</p></div><p class="cart-item-price">${hasPrice(item.product) ? money(item.product.price * item.quantity) : "Por cotizar"}</p></div>
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
    <header class="cart-heading"><div><small>Tu selección</small><h2 id="cart-title">Carrito <span>(${cartCount()})</span></h2></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar carrito">×</button></header>
    <div class="cart-items">${items}</div>
    ${state.cart.length ? `<footer class="cart-footer">
      <div class="cart-total"><span>Subtotal</span><strong>${totalLabel(cartTotal())}</strong></div>
      <p class="shipping-note">↗ Envío calculado al confirmar por WhatsApp</p>
      <button class="checkout-button" type="button" data-action="open-checkout">Continuar pedido <span aria-hidden="true">→</span></button>
    </footer>` : ""}
  </div>`, "cart-title", "cart-drawer");
}

function checkoutMarkup() {
  const modal = state.modal;
  if (modal.sent) {
    return modalShell(`<div class="checkout-content">
      <p class="modal-eyebrow">Último paso</p><h2 id="checkout-title">${modal.orderId ? `Pedido #${modal.orderId} registrado` : "Pedido listo"}</h2>
      <div class="checkout-success"><div class="success-mark">✓</div><h3>Envíalo por WhatsApp</h3>
        <p>Abrimos una conversación con tu selección. Si no se abrió, usa el botón. El equipo MSA confirmará disponibilidad, envío y forma de pago contigo.</p>
        <a class="checkout-button inline whatsapp-link" href="${escapeHtml(modal.url)}" target="_blank" rel="noreferrer">Abrir WhatsApp <span aria-hidden="true">◉</span></a>
        ${modal.orderId ? `<p class="track-hint">Guarda tu número de pedido <strong>#${modal.orderId}</strong>: con él y los últimos 4 dígitos de tu teléfono puedes ver el estado en <a href="${escapeHtml(trackingUrlFor(modal.orderId))}">Rastrear mi pedido</a>.</p>` : ""}
        <button class="button button-outline" type="button" data-action="close-modal">Volver a la tienda</button>
      </div>
    </div>`, "checkout-title", "compact");
  }
  return modalShell(`<div class="checkout-content">
    <p class="modal-eyebrow">Último paso</p><h2 id="checkout-title">Prepara tu pedido</h2>
    <p>Déjanos tus datos. No es un pago: armamos tu pedido y lo confirmamos contigo por WhatsApp.</p>
    ${modal.error ? `<p class="account-message error" role="alert">${escapeHtml(modal.error)}</p>` : ""}
    <form class="checkout-form" id="checkout-form">
      <div class="checkout-fields">
        <label>Nombre completo<input name="name" required minlength="2" maxlength="120" autocomplete="name" placeholder="Tu nombre" value="${escapeHtml(modal.form?.name || "")}"></label>
        <label>Teléfono<input name="phone" required type="tel" autocomplete="tel" inputmode="tel" placeholder="10 dígitos" value="${escapeHtml(modal.form?.phone || "")}"></label>
      </div>
      <label>Ciudad y estado<input name="city" required maxlength="120" autocomplete="address-level2" placeholder="Ej. Aguascalientes, Ags." value="${escapeHtml(modal.form?.city || "")}"></label>
      <label>Nota para tu pedido<textarea name="note" maxlength="1000" placeholder="¿Necesitas factura o tienes alguna indicación?">${escapeHtml(modal.form?.note || "")}</textarea></label>
      <label class="honeypot" aria-hidden="true">Sitio web<input name="website" tabindex="-1" autocomplete="off"></label>
      <label class="consent"><input type="checkbox" name="consent" required ${modal.form?.consent ? "checked" : ""}>
        <span>Leí y acepto el <a href="./aviso-de-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a> y los <a href="./terminos.html" target="_blank" rel="noopener">términos de venta</a>.</span></label>
      <div class="checkout-submit-row">
        <span class="checkout-total">Total estimado<strong>${totalLabel(cartTotal())}</strong></span>
        <button class="checkout-button inline" type="submit" ${modal.busy ? "disabled" : ""}>${modal.busy ? "Registrando…" : `Continuar en WhatsApp <span aria-hidden="true">◉</span>`}</button>
      </div>
      <p class="fine-print">Te atendemos por WhatsApp al 449 125 1554.</p>
    </form>
  </div>`, "checkout-title", "compact");
}

async function submitCheckout(form) {
  const data = new FormData(form);
  const customer = {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    city: String(data.get("city") || "").trim(),
    note: String(data.get("note") || "").trim(),
  };
  state.modal.form = { ...customer, consent: data.get("consent") === "on" };
  if (String(customer.phone).replace(/\D/g, "").length < 10) {
    state.modal.error = "Escribe un teléfono de 10 dígitos.";
    return renderModal();
  }
  const items = state.cart.map((item) => ({ product_id: item.product.id, variant: item.variant, color: item.color, size: item.size, quantity: item.quantity }));
  // Se abre la pestaña ya, mientras se registra el pedido: así el navegador no la bloquea.
  const popup = window.open("", "_blank");
  state.modal.busy = true;
  state.modal.error = "";
  renderModal();
  let result = null;
  try {
    result = await MSA_DB.createOrder(customer, items, String(data.get("website") || ""));
  } catch (error) {
    popup?.close();
    state.modal.busy = false;
    state.modal.error = error.message;
    return renderModal();
  }
  const total = Number(result?.total ?? cartTotal());
  const quotes = cartHasQuotes();
  const lines = state.cart.map((item) => `• ${item.quantity} x ${item.product.name} (${cartSelectionLabel(item)})${hasPrice(item.product) ? "" : " · precio por confirmar"}`).join("\n");
  const message = `Hola MSA Scrubs, soy ${customer.name}.${result?.id ? `\nPedido #${result.id} (seguimiento: ${trackingUrlFor(result.id)})` : ""}\nTeléfono: ${customer.phone}\nCiudad y estado: ${customer.city}\nMe gustaría confirmar este pedido:\n${lines}\n${quotes ? `Total estimado: ${total > 0 ? `${money(total)} + ` : ""}piezas con precio por confirmar.` : `Total estimado: ${money(total)}.`}${customer.note ? `\nNota: ${customer.note}` : ""}`;
  const url = whatsappUrl(message);
  if (popup && !popup.closed) {
    popup.opener = null;
    popup.location.href = url;
  }
  state.cart = [];
  saveCart();
  renderCartCount();
  state.modal = { type: "checkout", sent: true, orderId: result?.id || null, url };
  state.myOrders = null;
  renderModal();
}

// ---------------------------------------------------------------------
// Guía de tallas
// ---------------------------------------------------------------------
function sizeGuideData() {
  return sizeGuideFor(state.guideAudience, state.guideGarment);
}

function guideRecommendationMarkup() {
  if (!hasMeasures(state.measures)) {
    return `<div class="recommend-box"><span aria-hidden="true">◎</span> ¿Quieres que calculemos tu talla? <button type="button" data-action="open-account">Captura tus medidas</button></div>`;
  }
  const result = recommendGuideSize(state.measures, state.guideAudience, state.guideGarment);
  if (!result) return `<div class="recommend-box">Nos faltan medidas para esta tabla. <button type="button" data-action="open-account">Completar medidas</button></div>`;
  if (result.tooBig) return `<div class="recommend-box warn">Tus medidas superan esta tabla. Escríbenos por WhatsApp y te orientamos.</div>`;
  return `<div class="recommend-box"><span aria-hidden="true">◎</span> Con tus medidas, tu talla en ${sizeGuideData().title.toLowerCase()} es <strong>${result.size}</strong>. <button type="button" data-action="open-account">Editar medidas</button></div>`;
}

function sizeGuideMarkup() {
  const guide = sizeGuideData();
  const columns = `1.15fr repeat(${guide.sizes.length}, minmax(0, 1fr))`;
  const rows = guide.rows.map((row) => `<div class="guide-row" style="grid-template-columns:${columns}">${[row.label, ...row.values].map((cell) => `<span>${cell}</span>`).join("")}</div>`).join("");
  const headingSizes = guide.sizes.map((size) => `<span>${size}<small>${SIZE_EQUIVALENCE[size]}</small></span>`).join("");
  const toggle = (items, selected, action) => items.map((item) =>
    `<button type="button" class="${item === selected ? "selected" : ""}" data-action="${action}" data-value="${item}">${item}</button>`).join("");
  return modalShell(`<div class="guide-content">
    <p class="modal-eyebrow">Encuentra tu ajuste</p>
    <h2 id="guide-title">Guía de tallas</h2>
    <p>Medidas oficiales de MSA Scrubs en centímetros. Debajo de cada talla verás su equivalencia internacional (XS, S, M, L, XL). Los conjuntos usan la talla de filipina y de pantalón.</p>
    <div class="guide-toggles">
      <div><span class="guide-toggle-title">Colección</span><div class="toggle-pair">${toggle(["Dama", "Caballero"], state.guideAudience, "guide-audience")}</div></div>
      <div><span class="guide-toggle-title">Prenda</span><div class="toggle-pair garment">${toggle(["Filipina", "Pantalón"], state.guideGarment, "guide-garment")}</div></div>
    </div>
    <div class="guide-table-wrap"><div class="guide-table-title"><span>${guide.title}</span><span>cm</span></div>
      <div class="guide-table">
        <div class="guide-row header" style="grid-template-columns:${columns}"><span>Medida</span>${headingSizes}</div>
        ${rows}
      </div>
    </div>
    <p class="guide-note">Los rangos se muestran tal como fueron compartidos por MSA Scrubs. Si estás entre dos tallas, recomendamos elegir la mayor.</p>
    ${guideRecommendationMarkup()}
    <div class="measure-method">
      <img src="./images/measurement-guide.webp" loading="lazy" alt="Referencia visual para tomar medidas de MSA Scrubs">
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
    <p class="guide-note">Mide de pie, sin apretar la cinta y sobre ropa ligera.</p>
    <div class="guide-bottom-cards">
      <div class="guide-tip"><strong>¿Entre dos tallas?</strong><p>Elige la mayor para un fit más relajado, especialmente si buscas libertad en hombros y cadera.</p></div>
      <div class="guide-tip"><strong>¿Quieres ayuda?</strong><p>Escríbenos por WhatsApp y te orientamos con tus medidas.</p></div>
    </div>
  </div>`, "guide-title", "compact");
}

// ---------------------------------------------------------------------
// Mi cuenta y mis medidas
// ---------------------------------------------------------------------
function measuresSummaryMarkup() {
  const measures = state.measures;
  if (!hasMeasures(measures) || !measures.sexo) return "";
  const cell = (garment) => {
    const result = recommendGuideSize(measures, measures.sexo, garment);
    if (!result) return "Faltan medidas";
    return result.tooBig ? "Fuera de guía" : result.size;
  };
  return `<div class="measures-summary" aria-live="polite">
    <small>Tus tallas recomendadas · ${measures.sexo}</small>
    <div><span>Filipina<strong>${cell("Filipina")}</strong></span><span>Pantalón<strong>${cell("Pantalón")}</strong></span></div>
  </div>`;
}

function authMarkup(modal) {
  if (!MSA_DB.available) return `<p class="note-box sage">Tus medidas se guardarán en este dispositivo.</p>`;
  if (modal.mode === "recovery") {
    return `<form class="checkout-form account-block" id="new-password-form">
      <strong class="account-block-title">Crea una nueva contraseña</strong>
      <label>Nueva contraseña<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
      <button class="checkout-button inline" type="submit" ${modal.busy ? "disabled" : ""}>Guardar contraseña</button>
    </form>`;
  }
  if (state.user) {
    return `<div class="account-user account-block">
      <div><small>Sesión iniciada</small><strong>${escapeHtml(state.user.email)}</strong></div>
      <button class="button button-outline" type="button" data-action="sign-out">Cerrar sesión</button>
    </div>`;
  }
  const signup = modal.mode === "signup";
  return `<div class="account-block">
    <div class="toggle-pair">
      <button type="button" class="${signup ? "" : "selected"}" data-action="account-mode" data-value="login">Iniciar sesión</button>
      <button type="button" class="${signup ? "selected" : ""}" data-action="account-mode" data-value="signup">Crear cuenta</button>
    </div>
    <form class="checkout-form" id="auth-form">
      <label>Correo<input name="email" type="email" required autocomplete="email" value="${escapeHtml(modal.email || "")}"></label>
      <label>Contraseña<input name="password" type="password" required minlength="${signup ? 8 : 6}" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="${signup ? "Mínimo 8 caracteres" : ""}"></label>
      ${signup ? `<label class="consent"><input type="checkbox" name="consent" required><span>Acepto el <a href="./aviso-de-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>.</span></label>` : ""}
      <button class="checkout-button inline" type="submit" ${modal.busy ? "disabled" : ""}>${modal.busy ? "Un momento…" : signup ? "Crear cuenta" : "Iniciar sesión"}</button>
      ${signup ? "" : `<button class="text-link" type="button" data-action="forgot-password">¿Olvidaste tu contraseña?</button>`}
    </form>
    <p class="fine-print">Con una cuenta, tus medidas te siguen en cualquier dispositivo. Si prefieres, guárdalas solo aquí sin crear cuenta.</p>
  </div>`;
}

function accountMarkup() {
  const modal = state.modal;
  const measures = state.measures || {};
  const field = (name, label, hint) => `<label>${label}<span class="field-hint">${hint}</span>
    <input name="${name}" type="number" inputmode="decimal" min="40" max="220" step="0.5" placeholder="cm" value="${measures[name] ?? ""}"></label>`;
  const message = modal.message ? `<p class="account-message ${modal.messageType || ""}" role="status">${escapeHtml(modal.message)}</p>` : "";
  return modalShell(`<div class="account-content">
    <p class="modal-eyebrow">Tu ajuste</p>
    <h2 id="account-title">${state.user ? "Mi cuenta" : "Encuentra tu talla"}</h2>
    <p>Captura tus medidas una vez y te recomendamos la talla en cada conjunto.</p>
    ${message}
    ${authMarkup(modal)}
    ${myOrdersMarkup()}
    <form class="checkout-form account-block" id="measures-form">
      <strong class="account-block-title">Mis medidas <span>(cm)</span></strong>
      <fieldset class="sexo-options">
        <legend>Colección</legend>
        <label><input type="radio" name="sexo" value="Dama" ${measures.sexo !== "Caballero" ? "checked" : ""} required>Dama</label>
        <label><input type="radio" name="sexo" value="Caballero" ${measures.sexo === "Caballero" ? "checked" : ""}>Caballero</label>
      </fieldset>
      <div class="measure-fields">
        ${field("pecho", "Pecho", "Parte más ancha")}
        ${field("cintura", "Cintura", "Entre costilla y cadera")}
        ${field("cadera", "Cadera", "Parte más ancha")}
      </div>
      <button class="text-link" type="button" data-action="open-guide">⌁ ¿Cómo tomar mis medidas?</button>
      ${measuresSummaryMarkup()}
      <div class="account-actions">
        <button class="checkout-button inline" type="submit">${state.user ? "Guardar en mi cuenta" : "Guardar medidas"}</button>
        ${hasMeasures(state.measures) ? `<button class="text-link danger" type="button" data-action="delete-measures">Borrar mis medidas</button>` : ""}
      </div>
    </form>
    <p class="fine-print">Usamos tus medidas solo para recomendarte talla. ${state.user ? "Se guardan en tu cuenta y" : "Se guardan en este navegador y"} puedes borrarlas cuando quieras. Más información en el <a href="./aviso-de-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>.</p>
  </div>`, "account-title", "compact");
}

function setAccountMessage(message, type = "") {
  if (state.modal?.type !== "account") return;
  state.modal.message = message;
  state.modal.messageType = type;
  renderModal();
}

function openAccount(mode = "login") {
  if (state.modal?.type === "guide" && state.modal.returnTo?.type === "account") {
    state.modal = state.modal.returnTo;
    return renderModal();
  }
  const returnTo = state.modal?.type === "product" || state.modal?.type === "guide" ? state.modal : null;
  state.modal = { type: "account", mode, returnTo };
  renderModal();
  if (state.user) loadMyOrders();
}

function readMeasures(form) {
  const data = new FormData(form);
  const number = (name) => {
    const value = Number(String(data.get(name) || "").replace(",", "."));
    return value ? Math.round(value * 2) / 2 : null;
  };
  return { sexo: data.get("sexo") || null, pecho: number("pecho"), cintura: number("cintura"), cadera: number("cadera") };
}

async function saveMeasures(form) {
  const measures = readMeasures(form);
  const outOfRange = ["pecho", "cintura", "cadera"].filter((key) => measures[key] && (measures[key] < 40 || measures[key] > 220));
  if (outOfRange.length) return setAccountMessage(`Revisa ${outOfRange.join(", ")}: escribe la medida en centímetros (entre 40 y 220).`, "error");
  if (!hasMeasures(measures)) return setAccountMessage("Escribe al menos una medida.", "error");
  state.measures = measures;
  saveLocalMeasures(measures);
  renderAccountIndicator();
  if (state.user) {
    try {
      await MSA_DB.saveProfile(state.user.id, measures);
    } catch (error) {
      return setAccountMessage(`Se guardaron en este navegador, pero no en tu cuenta: ${error.message}`, "error");
    }
  }
  const returnTo = state.modal?.returnTo;
  if (returnTo?.type === "product") {
    returnTo.selection = withBestSize(returnTo.product, returnTo.selection);
    state.modal = returnTo;
    renderModal();
    return toast("Medidas guardadas. Te marcamos tu talla.");
  }
  setAccountMessage(state.user ? "Medidas guardadas en tu cuenta." : "Medidas guardadas en este navegador.", "success");
}

async function deleteMeasures() {
  state.measures = null;
  saveLocalMeasures(null);
  renderAccountIndicator();
  if (state.user) {
    try {
      await MSA_DB.deleteProfile(state.user.id);
    } catch (error) {
      return setAccountMessage(error.message, "error");
    }
  }
  setAccountMessage("Borramos tus medidas.", "success");
}

async function submitAuth(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const signup = state.modal.mode === "signup";
  state.modal.email = email;
  state.modal.busy = true;
  setAccountMessage("");
  try {
    if (signup) {
      const result = await MSA_DB.signUp(email, password);
      state.modal.busy = false;
      if (result.needsConfirmation) {
        state.modal.mode = "login";
        return setAccountMessage(`Te enviamos un correo a ${email}. Abre el enlace para confirmar tu cuenta y después inicia sesión.`, "success");
      }
      return setAccountMessage("Cuenta creada. ¡Bienvenida, bienvenido!", "success");
    }
    await MSA_DB.signIn(email, password);
    state.modal.busy = false;
    setAccountMessage("Sesión iniciada.", "success");
  } catch (error) {
    state.modal.busy = false;
    setAccountMessage(error.message, "error");
  }
}

async function forgotPassword() {
  const email = String($("#auth-form input[name='email']")?.value || "").trim();
  if (!email) return setAccountMessage("Escribe tu correo arriba y vuelve a presionar «¿Olvidaste tu contraseña?».", "error");
  state.modal.email = email;
  try {
    await MSA_DB.sendPasswordReset(email);
    setAccountMessage(`Si ${email} tiene cuenta, te llegará un correo para crear una nueva contraseña.`, "success");
  } catch (error) {
    setAccountMessage(error.message, "error");
  }
}

async function submitNewPassword(form) {
  const password = String(new FormData(form).get("password") || "");
  state.modal.busy = true;
  try {
    await MSA_DB.updatePassword(password);
    state.modal = { type: "account", mode: "login" };
    setAccountMessage("Listo, tu contraseña se actualizó.", "success");
  } catch (error) {
    state.modal.busy = false;
    setAccountMessage(error.message, "error");
  }
}

// Al iniciar sesión: si la cuenta ya tiene medidas se usan; si no, se suben
// las que estaban guardadas en este navegador.
async function syncProfile() {
  if (!state.user) return;
  try {
    const profile = await MSA_DB.loadProfile(state.user.id);
    if (hasMeasures(profile)) {
      const number = (value) => value === null ? null : Number(value);
      state.measures = { sexo: profile.sexo, pecho: number(profile.pecho), cintura: number(profile.cintura), cadera: number(profile.cadera) };
      saveLocalMeasures(state.measures);
    } else if (hasMeasures(state.measures)) {
      await MSA_DB.saveProfile(state.user.id, state.measures);
    }
  } catch (error) {
    console.warn("No se pudieron sincronizar las medidas", error);
  }
}

function renderAccountIndicator() {
  const trigger = $(".account-trigger");
  if (!trigger) return;
  trigger.classList.toggle("has-account", Boolean(state.user));
  trigger.classList.toggle("has-measures", hasMeasures(state.measures));
  trigger.setAttribute("aria-label", state.user ? `Mi cuenta (${state.user.email})` : "Mi cuenta y mis medidas");
}

async function handleAuthChange(event, user) {
  const wasSignedIn = Boolean(state.user);
  state.user = user;
  if (event === "PASSWORD_RECOVERY") state.modal = { type: "account", mode: "recovery" };
  if (user && (!wasSignedIn || event === "SIGNED_IN")) {
    await syncProfile();
    state.myOrders = null;
    if (state.modal?.type === "account") loadMyOrders();
  }
  if (!user) state.myOrders = null;
  if (!user && wasSignedIn && state.modal?.type === "account") state.modal.message = "Cerraste sesión.";
  renderAccountIndicator();
  if (state.modal) renderModal();
}

// ---------------------------------------------------------------------
// Seguimiento de pedidos (Rastrear mi pedido y Mis pedidos)
// ---------------------------------------------------------------------
const trackingUrlFor = (orderId) => `${window.location.origin}${window.location.pathname}#rastreo=${orderId}`;

function orderItemsText(item) {
  return [item.variant ? `Pantalón ${String(item.variant).toLowerCase()}` : null, item.color, item.size === "Unitalla" ? "Unitalla" : `Talla ${item.size}`].filter(Boolean).join(" · ");
}

function orderDetailMarkup(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const quotes = items.some((item) => !item.price);
  const total = Number(order.total || 0);
  return `<div class="order-detail">
    <div class="order-detail-head">
      <div><small>Pedido</small><strong>#${order.id}</strong></div>
      <span class="order-status ${order.status}">${ORDER_STATUS_LABELS[order.status] || order.status}</span>
    </div>
    <p class="order-help">${escapeHtml(ORDER_STATUS_HELP[order.status] || "")}</p>
    ${order.status === "enviado" || order.tracking_number ? `<div class="order-shipping">
      <span>${order.carrier ? `Paquetería: <strong>${escapeHtml(order.carrier)}</strong>` : "Envío"}${order.tracking_number ? ` · Guía <strong>${escapeHtml(order.tracking_number)}</strong>` : ""}</span>
      ${order.tracking_url ? `<a class="checkout-button inline" href="${escapeHtml(order.tracking_url)}" target="_blank" rel="noreferrer">Rastrear con la paquetería ↗</a>` : ""}
    </div>` : ""}
    <ol class="order-steps">${orderTimeline(order).map((step) => `<li class="${step.done ? "done" : ""} ${step.current ? "current" : ""} ${step.status}">
      <span class="dot" aria-hidden="true"></span><span><strong>${ORDER_STATUS_LABELS[step.status]}</strong>${step.at ? `<small>${escapeHtml(formatDateTime(step.at))}</small>` : ""}</span></li>`).join("")}</ol>
    <ul class="order-items">${items.map((item) => `<li><span>${Number(item.quantity)} × ${escapeHtml(item.product_name)}<small>${escapeHtml(orderItemsText(item))}</small></span><strong>${item.price ? money(Number(item.price) * Number(item.quantity)) : "Por cotizar"}</strong></li>`).join("")}</ul>
    <p class="order-total">Total estimado <strong>${quotes ? `${total > 0 ? `${money(total)} + ` : ""}piezas por cotizar` : money(total)}</strong></p>
    <p class="fine-print">¿Dudas con tu pedido? <a href="${whatsappUrl(`Hola MSA Scrubs, tengo una duda sobre mi pedido #${order.id}.`)}" target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>.</p>
  </div>`;
}

function trackMarkup() {
  const modal = state.modal;
  if (modal.result) {
    return modalShell(`<div class="checkout-content">
      <p class="modal-eyebrow">Seguimiento</p><h2 id="track-title">Tu pedido</h2>
      ${orderDetailMarkup(modal.result)}
      ${modal.returnTo ? "" : `<button class="text-link" type="button" data-action="track-another">Consultar otro pedido</button>`}
    </div>`, "track-title", "compact");
  }
  return modalShell(`<div class="checkout-content">
    <p class="modal-eyebrow">Seguimiento</p><h2 id="track-title">Rastrear mi pedido</h2>
    <p>Escribe el número de pedido (viene en tu mensaje de WhatsApp, por ejemplo #12) y los últimos 4 dígitos del teléfono con el que lo hiciste.</p>
    ${modal.error ? `<p class="account-message error" role="alert">${escapeHtml(modal.error)}</p>` : ""}
    <form class="checkout-form" id="track-form">
      <div class="checkout-fields">
        <label>Número de pedido<input name="order" required inputmode="numeric" pattern="#?[0-9]+" placeholder="Ej. 12" value="${escapeHtml(modal.orderId || "")}"></label>
        <label>Últimos 4 dígitos del teléfono<input name="last4" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Ej. 1234" autocomplete="off"></label>
      </div>
      <button class="checkout-button inline" type="submit" ${modal.busy ? "disabled" : ""}>${modal.busy ? "Buscando…" : "Ver mi pedido"}</button>
    </form>
    ${state.user ? `<p class="fine-print">Con tu cuenta también puedes verlos en <button class="text-link" type="button" data-action="open-account">Mi cuenta → Mis pedidos</button>.</p>` : ""}
  </div>`, "track-title", "compact");
}

function openTrack(orderId = "") {
  state.modal = { type: "track", orderId };
  setHash(orderId ? `#rastreo=${orderId}` : "#rastreo");
  renderModal();
  window.setTimeout(() => $(orderId ? "#track-form input[name=last4]" : "#track-form input[name=order]")?.focus(), 50);
}

async function submitTrack(form) {
  const data = new FormData(form);
  const orderId = Number(String(data.get("order") || "").replace(/\D/g, ""));
  const last4 = String(data.get("last4") || "").replace(/\D/g, "");
  state.modal.orderId = orderId || "";
  if (!orderId || last4.length !== 4) {
    state.modal.error = "Escribe el número de pedido y los 4 dígitos.";
    return renderModal();
  }
  state.modal.busy = true;
  state.modal.error = "";
  renderModal();
  try {
    const result = await MSA_DB.trackOrder(orderId, last4);
    state.modal.busy = false;
    if (!result) state.modal.error = "No encontramos un pedido con esos datos. Revisa el número y los dígitos.";
    else state.modal.result = result;
  } catch (error) {
    state.modal.busy = false;
    state.modal.error = error.message;
  }
  renderModal();
}

function myOrdersMarkup() {
  if (!state.user) return "";
  if (state.myOrders === null) return `<div class="account-block"><strong class="account-block-title">Mis pedidos</strong><p class="fine-print">Cargando…</p></div>`;
  return `<div class="account-block">
    <strong class="account-block-title">Mis pedidos</strong>
    ${state.myOrders.length ? `<ul class="my-orders">${state.myOrders.map((order) => `<li>
      <button type="button" data-action="view-my-order" data-id="${order.id}">
        <span><strong>Pedido #${order.id}</strong><small>${escapeHtml(formatDateTime(order.created_at))}</small></span>
        <span class="order-status ${order.status}">${ORDER_STATUS_LABELS[order.status] || order.status}</span>
      </button></li>`).join("")}</ul>`
      : `<p class="fine-print">Aún no tienes pedidos con esta cuenta. Los pedidos que hagas con tu sesión iniciada aparecerán aquí.</p>`}
  </div>`;
}

async function loadMyOrders() {
  if (!state.user || !MSA_DB.available) return;
  try {
    state.myOrders = await MSA_DB.listMyOrders(state.user.id);
  } catch (error) {
    console.warn("No se pudieron cargar tus pedidos", error);
    state.myOrders = [];
  }
  if (state.modal?.type === "account") renderModal();
}

// ---------------------------------------------------------------------
// Ventanas (modales) y enlaces con # (#producto=clasia, #mi-talla)
// ---------------------------------------------------------------------
let lastTrigger = null;

function renderModal() {
  if (!state.modal) {
    overlayRoot.innerHTML = "";
    document.body.classList.remove("dialog-open");
    return;
  }
  const isNew = !overlayRoot.firstElementChild;
  const previousScroll = $(".modal-panel")?.scrollTop || 0;
  const { type } = state.modal;
  const markup = type === "product" ? modalShell(productModalMarkup(state.modal), "product-modal-title")
    : type === "cart" ? cartMarkup()
      : type === "checkout" ? checkoutMarkup()
        : type === "account" ? accountMarkup()
          : type === "track" ? trackMarkup()
            : sizeGuideMarkup();
  overlayRoot.innerHTML = markup;
  document.body.classList.add("dialog-open");
  const scrim = $(".modal-scrim");
  if (isNew && !reduceMotion()) scrim.classList.add("entering");
  const panel = $(".modal-panel");
  if (type !== "product" || previousScroll) panel.scrollTop = previousScroll;
  if (type === "checkout" && state.modal.sent) $(".whatsapp-link", panel)?.focus();
  else panel.focus({ preventScroll: true });
}

function setHash(hash) {
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", url);
}

function closeModal() {
  if ((state.modal?.type === "guide" || state.modal?.type === "account" || state.modal?.type === "track") && state.modal.returnTo) {
    state.modal = state.modal.returnTo;
    return renderModal();
  }
  state.modal = null;
  renderModal();
  if (/^#(producto=|mi-talla|rastreo)/.test(window.location.hash)) setHash("");
  if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  lastTrigger = null;
}

function openProduct(product) {
  state.modal = { type: "product", product, selection: selectedProductDefaults(product) };
  setHash(`#producto=${encodeURIComponent(product.id)}`);
  renderModal();
}

function openGuide() {
  const returnTo = state.modal?.type === "product" || state.modal?.type === "account" ? state.modal : null;
  if (returnTo?.type === "account" && state.measures?.sexo) state.guideAudience = state.measures.sexo;
  if (returnTo?.type === "product") {
    state.guideAudience = returnTo.product.gender === "Caballero" ? "Caballero" : "Dama";
    state.guideGarment = "Filipina";
  }
  state.modal = { type: "guide", returnTo };
  renderModal();
}

function openCart() {
  state.modal = { type: "cart" };
  renderModal();
}

function handleHash() {
  const hash = decodeURIComponent(window.location.hash || "");
  const productMatch = hash.match(/^#producto=([a-z0-9-]+)$/);
  if (productMatch) {
    const product = productById(productMatch[1]);
    if (product && !(state.modal?.type === "product" && state.modal.product.id === product.id)) openProduct(product);
    return;
  }
  const trackMatch = hash.match(/^#rastreo(?:=(\d+))?$/);
  if (trackMatch) {
    if (state.modal?.type !== "track") openTrack(trackMatch[1] || "");
    return;
  }
  if (hash === "#mi-talla" && state.modal?.type !== "account") {
    openAccount();
    return;
  }
  const collectionMatch = hash.match(/^#coleccion=(.+)$/);
  if (collectionMatch) filterCollection(collectionMatch[1]);
}

function filterCollection(name) {
  state.collection = name;
  state.category = "Todos";
  state.gender = "Todos";
  renderCatalog();
  $("#coleccion").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
}

// ---------------------------------------------------------------------
// Asistente
// ---------------------------------------------------------------------
function assistantAnswer(question) {
  const lower = question.toLocaleLowerCase("es");
  if (lower.includes("talla") || lower.includes("medida")) return "Captura tus medidas en «Calcular mi talla» y te marcamos la talla en cada conjunto. Si estás entre dos tallas, elige la mayor.";
  if (lower.includes("envío") || lower.includes("envio")) return "Enviamos a todo México. El costo y tiempo dependen de tu ciudad; el equipo lo confirma al armar tu pedido.";
  if (lower.includes("cambio") || lower.includes("cambiar")) return "Consulta las condiciones de cambio en los términos de venta o escríbenos por WhatsApp.";
  if (lower.includes("pantal") || lower.includes("jogger") || lower.includes("recto")) return "Contempo y Clasia te dejan elegir pantalón jogger o recto al mismo precio. Los demás modelos se venden como conjunto completo.";
  if (lower.includes("tela") || lower.includes("material")) return "Trabajamos telas suaves y flexibles, pensadas para turnos largos.";
  return "Puedo ayudarte con tallas, envíos, cambios o el tipo de pantalón. Si prefieres, te atendemos directamente por WhatsApp.";
}

function renderAssistant() {
  const panel = $("#assistant-panel");
  panel.hidden = !state.assistantOpen;
  if (!state.assistantOpen) return;
  panel.innerHTML = `<div class="assistant-head"><div><small>Asistente MSA</small><h3>Estamos para orientarte</h3></div>
    <button type="button" data-action="close-assistant" aria-label="Cerrar asistente">×</button></div>
    <div class="assistant-content">
      <div class="assistant-answer" aria-live="polite">${escapeHtml(state.assistantAnswer)}</div>
      <div class="assistant-quick">
        <button type="button" data-action="assistant-question" data-question="¿Qué talla elijo?">¿Qué talla elijo?</button>
        <button type="button" data-action="assistant-question" data-question="¿Puedo elegir el pantalón?">¿Puedo elegir el pantalón?</button>
        <button type="button" data-action="assistant-question" data-question="¿Cuánto tarda el envío?">¿Cuánto tarda el envío?</button>
      </div>
      <form class="assistant-ask" id="assistant-form">
        <input name="question" value="${escapeHtml(state.assistantQuestion)}" placeholder="Escribe una pregunta" aria-label="Escribe una pregunta">
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

// ---------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------
function handleAction(action, target) {
  const modal = state.modal;
  switch (action) {
    case "toggle-menu": {
      const open = $("#main-nav").classList.toggle("open");
      target.setAttribute("aria-expanded", String(open));
      return;
    }
    case "open-cart": return openCart();
    case "open-guide": return openGuide();
    case "open-account": return openAccount();
    case "open-product": {
      const product = productById(target.dataset.productId);
      if (product) openProduct(product);
      return;
    }
    case "hero-go": return goToSlide(Number(target.dataset.index));
    case "hero-prev": return goToSlide(state.heroIndex - 1);
    case "hero-next": return goToSlide(state.heroIndex + 1);
    case "rail-prev": return scrollRail(target, -1);
    case "rail-next": return scrollRail(target, 1);
    case "filter-collection": return filterCollection(target.dataset.collection);
    case "clear-collection":
      state.collection = "";
      return renderCatalog();
    case "filter-gender":
      state.gender = target.dataset.gender;
      return renderCatalog();
    case "shortcut-category":
      state.gender = "Todos";
      state.collection = "";
      state.category = target.dataset.category;
      renderCatalog();
      $("#coleccion").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
      return;
    case "clear-filters":
      state.gender = "Todos";
      state.category = "Todos";
      state.collection = "";
      return setSearch("");
    case "close-modal": return closeModal();
    case "continue-shopping":
      closeModal();
      $("#coleccion").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
      return;
    case "change-cart": return changeCart(Number(target.dataset.index), Number(target.dataset.delta));
    case "remove-cart": {
      const item = state.cart[Number(target.dataset.index)];
      if (item) changeCart(Number(target.dataset.index), -item.quantity);
      return;
    }
    case "open-checkout":
      state.modal = { type: "checkout", sent: false };
      return renderModal();
    case "guide-audience":
      state.guideAudience = target.dataset.value;
      return renderModal();
    case "guide-garment":
      state.guideGarment = target.dataset.value;
      return renderModal();
    case "toggle-assistant":
      state.assistantOpen = !state.assistantOpen;
      return renderAssistant();
    case "close-assistant":
      state.assistantOpen = false;
      return renderAssistant();
    case "assistant-question": return setAssistantQuestion(target.dataset.question);
    case "account-mode":
      if (modal?.type !== "account") return;
      modal.mode = target.dataset.value;
      modal.message = "";
      return renderModal();
    case "forgot-password": return forgotPassword();
    case "open-track": return openTrack();
    case "track-another":
      state.modal = { type: "track", orderId: "" };
      return renderModal();
    case "view-my-order": {
      const order = (state.myOrders || []).find((item) => item.id === Number(target.dataset.id));
      if (!order) return;
      state.modal = { type: "track", result: order, returnTo: state.modal };
      return renderModal();
    }
    case "delete-measures": return deleteMeasures();
    case "sign-out":
      MSA_DB.signOut().catch((error) => setAccountMessage(error.message, "error"));
      return;
    default: break;
  }

  if (modal?.type !== "product") return;
  const { product, selection } = modal;
  if (action === "product-option-variant" || action === "product-option-color" || action === "product-option-size") {
    const key = action.replace("product-option-", "");
    selection[key] = target.dataset.value;
    if (key === "color") selection.slide = 0;
    if (key !== "size") modal.selection = withBestSize(product, selection);
    return renderModal();
  }
  if (action === "product-quantity") {
    selection.quantity = Math.min(20, Math.max(1, selection.quantity + Number(target.dataset.delta)));
    return renderModal();
  }
  if (action === "gallery-step" || action === "gallery-go") {
    const count = gallerySlides(product, selection.color).length;
    const next = action === "gallery-go" ? Number(target.dataset.index) : (selection.slide || 0) + Number(target.dataset.delta);
    selection.slide = Math.max(0, Math.min(count - 1, next));
    return renderModal();
  }
  if (action === "add-product") {
    if (isSoldOut(product, selection.color, selection.size, selection.variant)) return toast("Esa combinación está agotada.");
    addToCart(product, selection);
    return openCart();
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#main-nav a, #main-nav button")) {
    $("#main-nav").classList.remove("open");
    $(".mobile-menu")?.setAttribute("aria-expanded", "false");
  }
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    if (event.target.classList.contains("modal-scrim") && state.modal) closeModal();
    return;
  }
  const action = actionTarget.dataset.action;
  if (!state.modal && actionTarget.closest("#overlay-root") === null) lastTrigger = actionTarget;
  if (action === "scrim") {
    if (event.target === actionTarget) closeModal();
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
  const forms = {
    "assistant-form": () => setAssistantQuestion(new FormData(event.target).get("question")?.toString().trim() || ""),
    "measures-form": () => saveMeasures(event.target),
    "auth-form": () => submitAuth(event.target),
    "new-password-form": () => submitNewPassword(event.target),
    "checkout-form": () => submitCheckout(event.target),
    "track-form": () => submitTrack(event.target),
  };
  const handler = forms[event.target.id];
  if (!handler) return;
  event.preventDefault();
  handler();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (state.modal) closeModal();
  else if (state.assistantOpen) {
    state.assistantOpen = false;
    renderAssistant();
  }
});

document.addEventListener("scroll", (event) => {
  if (event.target instanceof Element && event.target.matches(".rail-track")) updateRailButtons(event.target);
}, { capture: true, passive: true });

window.addEventListener("resize", () => $$(".rail-track").forEach(updateRailButtons));
window.addEventListener("hashchange", handleHash);
document.addEventListener("visibilitychange", restartHeroTimer);

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------
async function loadRemoteData() {
  if (!MSA_DB.available) return;
  MSA_DB.onAuthChange(handleAuthChange);
  const [products, banners, inventory] = await Promise.allSettled([MSA_DB.loadProducts(), MSA_DB.loadBanners(), MSA_DB.loadInventory()]);
  if (products.status === "fulfilled" && Array.isArray(products.value) && products.value.length) {
    state.products = products.value.map(normalizeProduct);
  } else if (products.status === "rejected") {
    console.warn("No se pudo cargar el catálogo; se usa el respaldo.", products.reason);
  }
  if (banners.status === "fulfilled" && Array.isArray(banners.value)) {
    state.banners = banners.value.filter((banner) => banner.active !== false);
  }
  if (inventory.status === "fulfilled") state.inventory = inventory.value;
  else console.warn("No se pudo cargar el inventario; todo se muestra disponible.", inventory.reason);
}

function renderSkeletons() {
  const card = `<div class="product-card skeleton" aria-hidden="true"><div class="product-visual"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>`;
  $("#product-grid").innerHTML = card.repeat(4);
  $("#featured-track").innerHTML = `<div class="rail-item">${card}</div>`.repeat(3);
  $("#hero-track").innerHTML = `<article class="hero-slide is-active skeleton" aria-hidden="true"><div class="hero-slide-copy"><div class="skeleton-line wide"></div><div class="skeleton-line wide"></div><div class="skeleton-line"></div></div><figure class="hero-slide-art"></figure></article>`;
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function init() {
  state.measures = loadLocalMeasures();
  renderAccountIndicator();
  setupHeroInteractions();
  const yearElement = $("#current-year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());

  let remoteDone = false;
  if (MSA_DB.available) {
    renderSkeletons();
    const remote = loadRemoteData().catch((error) => console.warn(error)).finally(() => { remoteDone = true; });
    await Promise.race([remote, wait(3500)]);
    // Si Supabase tardó más, se muestra el respaldo y se actualiza al llegar.
    if (!remoteDone) {
      remote.then(() => {
        renderStore();
        if (state.modal?.type === "product") renderModal();
      });
    }
  }
  restoreCart();
  renderStore();
  renderCartCount();
  observeReveals();
  handleHash();
}

init();
