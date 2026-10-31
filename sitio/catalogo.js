"use strict";
// =====================================================================
// Catálogo de RESPALDO, guía de tallas y recomendación de talla.
//
// El catálogo real vive en Supabase (tabla "products") y se edita en el
// panel → Productos. Esta lista solo se usa si Supabase no responde,
// para que la tienda nunca se quede vacía.
// =====================================================================

const WHATSAPP_NUMBER = "524491251554";

// Paletas tomadas del catálogo oficial MSA (PDF "MSA Catálogo").
const PALETTES = {
  "Contempo y Clasia": ["Blanco", "Azul cielo", "Azul rey", "Azul marino", "Rubi", "Rojo", "Lavanda", "Bugambilia", "Vino", "Militar", "Ebano", "Menta"],
  "Aura, Dalia y Siena": ["Olivo", "Bandera", "Cemento", "Capuchino", "Ladrillo", "Chocolate", "Palo de rosa", "Rosita", "Amarillo", "Aqua"],
  "Overol": ["Ebano", "Chocolate", "Ladrillo"],
  "Cubrepolvo liso": ["Blanco", "Azul cielo", "Azul rey", "Azul marino", "Rubi", "Rojo", "Lavanda", "Bugambilia", "Vino", "Militar", "Ebano", "Salvia"],
  "Cubrepolvo estampado": ["Estampado lila", "Estampado rosas"],
};
const SCRUB_COLORS = PALETTES["Contempo y Clasia"];
const CATEGORIES = ["Conjunto", "Overol", "Gorro quirúrgico", "Cubrepolvo"];
const CATEGORY_LABELS = { "Conjunto": "Conjuntos", "Overol": "Overoles", "Gorro quirúrgico": "Gorros quirúrgicos", "Cubrepolvo": "Cubrepolvos" };
const PANTS_OPTIONS = ["Jogger", "Recto"];
const ALL_SIZES = ["XCH", "CH", "M", "G", "XG", "Unitalla"];
const GARMENT_SIZES = ["XCH", "CH", "M", "G", "XG"];

const FALLBACK_PRODUCTS = [
  { id: "contempo", name: "Contempo", category: "Conjunto", gender: "Mujer", collection: "Contempo", price: null,
    note: "Letilla cuello Mao · Manga corta · Bolsillos laterales en filipina y pantalón", sizes: GARMENT_SIZES, colors: PALETTES["Contempo y Clasia"],
    pants_options: PANTS_OPTIONS,
    photos: { "Rojo": "contempo-rojo.webp", "Blanco": "contempo-blanco.webp", "Rubi": "contempo-rubi.webp", "Militar": "contempo-militar.webp", "Ebano": "contempo-ebano.webp" },
    gallery: ["contempo-rojo-hincada.webp", "detail-cuello-rojo.webp", "detail-bolsillos-rojo.webp", "detail-pantalon-rojo.webp"], featured: true, active: true, sort_order: 10 },
  { id: "clasia", name: "Clasia", category: "Conjunto", gender: "Mujer", collection: "Clasia", price: null,
    note: "Escote V · Bolsillos laterales en filipina y pantalón", sizes: GARMENT_SIZES, colors: PALETTES["Contempo y Clasia"],
    pants_options: PANTS_OPTIONS,
    photos: { "Azul marino": "clasia-azul-marino.webp", "Vino": "clasia-vino.webp", "Bugambilia": "clasia-bugambilia.webp", "Azul cielo": "clasia-azul-cielo.webp", "Lavanda": "lavanda.webp" },
    gallery: ["clasia-detalle-1.webp", "clasia-detalle-2.webp", "clasia-detalle-3.webp"], featured: true, active: true, sort_order: 20 },
  { id: "aura", name: "Aura", category: "Conjunto", gender: "Mujer", collection: "Aura", price: null,
    note: "Manga tipo pétalo · Escote con letillas en V y cuello Mao · Corte semi holgado", description: "Pantalón recto con ligera campana.",
    sizes: GARMENT_SIZES, colors: PALETTES["Aura, Dalia y Siena"], pants_options: [],
    photos: { "Bandera": "aura-bandera.webp", "Olivo": "aura-olivo.webp", "Ladrillo": "aura-ladrillo.webp", "Amarillo": "aura-amarillo.webp", "Rosita": "aura-rosita.webp", "Aqua": "aura-aqua.webp" },
    gallery: ["aura-detalle-1.webp", "aura-detalle-2.webp", "aura-detalle-3.webp"], featured: true, active: true, sort_order: 30 },
  { id: "dalia", name: "Dalia", category: "Conjunto", gender: "Mujer", collection: "Dalia", price: null,
    note: "Manga corta estilizada · Escote cruzado con ajuste lateral", description: "Pantalón recto con bolsas funcionales.",
    sizes: GARMENT_SIZES, colors: PALETTES["Aura, Dalia y Siena"], pants_options: [],
    photos: { "Chocolate": "dalia-chocolate.webp", "Capuchino": "dalia-capuchino.webp", "Olivo": "dalia-olivo.webp" },
    gallery: ["dalia-detalle-1.webp", "dalia-detalle-2.webp", "dalia-detalle-3.webp", "dalia-durazno.webp"], featured: true, active: true, sort_order: 40 },
  { id: "siena", name: "Siena", category: "Conjunto", gender: "Mujer", collection: "Siena", price: null,
    note: "Manga corta · Escote en V", description: "Pantalón amplio con cintura ajustable.",
    sizes: GARMENT_SIZES, colors: PALETTES["Aura, Dalia y Siena"], pants_options: [],
    photos: { "Rosita": "siena-rosita.webp", "Chocolate": "siena-chocolate.webp", "Olivo": "siena-olivo.webp" },
    gallery: ["siena-detalle-1.webp", "siena-detalle-2.webp", "siena-detalle-3.webp", "siena-verde.webp"], featured: false, active: true, sort_order: 50 },
  { id: "overol", name: "Overol", category: "Overol", gender: "Mujer", collection: "Overol", price: null,
    note: "Manga tipo pétalo · Cuello sport · Pantalón jogger", description: "Bolsas en los laterales y una en la parte de atrás.",
    sizes: GARMENT_SIZES, colors: PALETTES.Overol, pants_options: [],
    photos: { "Ladrillo": "overol-ladrillo.webp", "Ebano": "overol-ebano.webp" },
    gallery: ["overol-detalle-1.webp", "overol-detalle-2.webp", "overol-detalle-3.webp"], featured: true, active: true, sort_order: 60 },
  { id: "pulso", name: "Pulso", category: "Gorro quirúrgico", gender: "Unisex", price: null, note: "Elástico suave · Estampado interior",
    sizes: ["Unitalla"], colors: ["Verde eucalipto", "Azul tinta", "Terracota"], pants_options: [], photos: {}, gallery: [], active: true, sort_order: 70 },
  { id: "aurora", name: "Aurora", category: "Gorro quirúrgico", gender: "Unisex", price: null, note: "Ajuste cómodo · Diseño ligero",
    sizes: ["Unitalla"], colors: ["Arena", "Lavanda", "Terracota"], pants_options: [], photos: {}, gallery: [], active: true, sort_order: 71 },
  { id: "guardia", name: "Guardia", category: "Gorro quirúrgico", gender: "Unisex", price: null, note: "Secado rápido · Banda suave",
    sizes: ["Unitalla"], colors: ["Azul quirófano", "Gris piedra", "Verde salvia"], pants_options: [], photos: {}, gallery: [], active: true, sort_order: 72 },
  { id: "cubrepolvo-liso", name: "Cubrepolvo liso", category: "Cubrepolvo", gender: "Mujer", price: null,
    note: "Cuello con cierre · Mangas con puños · Bolsillos laterales", description: "Se hace en el color liso que elijas.",
    sizes: GARMENT_SIZES, colors: PALETTES["Cubrepolvo liso"], pants_options: [],
    photos: { "Lavanda": "cubrepolvo-lavanda.webp", "Salvia": "cubrepolvo-salvia.webp" },
    gallery: ["cubrepolvo-detalle-1.webp", "cubrepolvo-detalle-2.webp", "cubrepolvo-detalle-3.webp"], active: true, sort_order: 80 },
  { id: "cubrepolvo-estampado", name: "Cubrepolvo estampado", category: "Cubrepolvo", gender: "Mujer", price: null,
    note: "Mangas y cuello en color con cierre · Bolsillos laterales", sizes: GARMENT_SIZES, colors: PALETTES["Cubrepolvo estampado"], pants_options: [],
    photos: { "Estampado lila": "cubrepolvo-estampado-lila.webp", "Estampado rosas": "cubrepolvo-estampado-rosas.webp" }, gallery: [], active: true, sort_order: 81 },
];

const FALLBACK_BANNERS = [
  { id: 1, eyebrow: "MSA Scrubs · Aguascalientes", title: "Uniformes que acompañan tu forma de cuidar.", subtitle: "Conjuntos Contempo, Clasia, Aura, Dalia, Siena y Overol en tallas XCH a XG.", image: "portada-equipo.webp", button_text: "Ver colecciones", link: "#colecciones" },
  { id: 2, eyebrow: "Colección Contempo", title: "Tu turno, a tu ritmo.", subtitle: "Letilla cuello Mao y bolsillos laterales. Elige tu pantalón: jogger o recto.", image: "contempo-rojo-hincada.webp", button_text: "Ver Contempo", link: "#producto=contempo" },
  { id: 3, eyebrow: "Colección Aura", title: "Manga pétalo, caída ligera.", subtitle: "Corte semi holgado y pantalón recto con ligera campana.", image: "aura-bandera.webp", button_text: "Ver Aura", link: "#producto=aura" },
  { id: 4, eyebrow: "Tu talla ideal", title: "Mide una vez, acierta siempre.", subtitle: "Captura tus medidas y te marcamos la talla en cada conjunto.", image: "siena-rosita.webp", button_text: "Calcular mi talla", link: "#mi-talla" },
];

const colorStyles = {
  "Blanco": { tone: "#f7f4ed", accent: "#e4e1d8" },
  "Azul cielo": { tone: "#d9e6f2", accent: "#cddeef" },
  "Azul rey": { tone: "#d5e2ef", accent: "#0451a2" },
  "Azul marino": { tone: "#d4dce7", accent: "#0c2447" },
  "Rubi": { tone: "#f9dde5", accent: "#f26287" },
  "Rojo": { tone: "#f6d5d8", accent: "#de172f" },
  "Lavanda": { tone: "#e9e1fb", accent: "#bda5ff" },
  "Bugambilia": { tone: "#ecd6e9", accent: "#a41d97" },
  "Vino": { tone: "#e4ced1", accent: "#602028" },
  "Militar": { tone: "#d9dfd3", accent: "#314528" },
  "Ebano": { tone: "#d7d7d5", accent: "#090909" },
  "Menta": { tone: "#e6eae5", accent: "#b6beb6" },
  "Olivo": { tone: "#e3eade", accent: "#a0b697" },
  "Bandera": { tone: "#d3dfe0", accent: "#113942" },
  "Cemento": { tone: "#d8e3ec", accent: "#397295" },
  "Capuchino": { tone: "#efe4d6", accent: "#ba9061" },
  "Ladrillo": { tone: "#f2e0d3", accent: "#c67742" },
  "Chocolate": { tone: "#e6dbd9", accent: "#5d3b3b" },
  "Palo de rosa": { tone: "#f6ecee", accent: "#e3cbce" },
  "Rosita": { tone: "#fbe9ec", accent: "#f4b9c1" },
  "Amarillo": { tone: "#fdf6dc", accent: "#fdedb5" },
  "Aqua": { tone: "#e3f4f4", accent: "#b4e2e3" },
  "Salvia": { tone: "#e4e9e1", accent: "#a9b8a3" },
  "Estampado lila": { tone: "#ece5f6", accent: "conic-gradient(#bda5ff 0 25%, #f7f4ed 0 50%, #7f95c9 0 75%, #f7f4ed 0)" },
  "Estampado rosas": { tone: "#f8dfe6", accent: "conic-gradient(#e43f7c 0 25%, #f3c2a2 0 50%, #a63a54 0 75%, #f3c2a2 0)" },
  "Verde salvia": { tone: "#e0e8e0", accent: "#8fa58f" },
  "Terracota": { tone: "#f2dfd5", accent: "#b8603f" },
  "Arena": { tone: "#efe7da", accent: "#c8b79c" },
  "Gris piedra": { tone: "#e4e4e0", accent: "#8d8d86" },
};
const CATEGORY_TONES = {
  "Conjunto": { tone: "#d5ddd9", accent: "#718f88" },
  "Overol": { tone: "#ddd8cf", accent: "#a89782" },
  "Gorro quirúrgico": { tone: "#cedbd7", accent: "#4f8279" },
  "Cubrepolvo": { tone: "#e1e2dc", accent: "#8c9990" },
};

// ---------------------------------------------------------------------
// Ayudantes de producto
// ---------------------------------------------------------------------
const isSet = (product) => product.category === "Conjunto" || product.category === "Overol";
const isGorro = (product) => product.category === "Gorro quirúrgico";
const isCubrepolvo = (product) => product.category === "Cubrepolvo";
const hasPantsChoice = (product) => (product.pants_options || []).length > 0;
const genderLabel = (gender) => gender === "Mujer" ? "Dama" : gender;

// Las fotos pueden ser un archivo de sitio/images ("blanco.webp") o una
// dirección completa (fotos subidas desde el panel a Supabase).
function imageUrl(source) {
  if (!source) return "";
  return /^https?:\/\//.test(source) ? source : `./images/${source}`;
}

// Limpia y completa un producto venga de Supabase o del respaldo.
function normalizeProduct(raw) {
  return {
    id: raw.id,
    name: raw.name,
    category: CATEGORIES.includes(raw.category) ? raw.category : "Conjunto",
    gender: raw.gender || "Mujer",
    collection: raw.collection || "",
    price: raw.price === null || raw.price === undefined ? null : Number(raw.price),
    note: raw.note || "",
    description: raw.description || "",
    sizes: Array.isArray(raw.sizes) && raw.sizes.length ? raw.sizes : ["Unitalla"],
    colors: Array.isArray(raw.colors) ? raw.colors : [],
    pants_options: Array.isArray(raw.pants_options) ? raw.pants_options : [],
    photos: raw.photos && typeof raw.photos === "object" ? raw.photos : {},
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    badge: raw.badge || "",
    featured: Boolean(raw.featured),
    active: raw.active !== false,
    sort_order: Number(raw.sort_order ?? 100),
  };
}

// Se muestra si está activo y tiene al menos un color. Sin precio = "Precio a consultar".
const isSellable = (product) => product.active && product.colors.length > 0;
const hasPrice = (product) => product.price !== null && product.price !== undefined;

// ---------------------------------------------------------------------
// Guía de tallas oficial MSA (cm). Tallas en español + equivalencia.
// ---------------------------------------------------------------------
const SIZE_EQUIVALENCE = { XCH: "XS", CH: "S", M: "M", G: "L", XG: "XL" };
const DAMA_SIZES = ["XCH", "CH", "M", "G", "XG"];
const CABALLERO_SIZES = ["CH", "M", "G", "XG"];

// "measure" indica qué medida del cliente se compara con cada renglón.
const SIZE_GUIDES = {
  "Dama|Filipina": { title: "Filipina Dama", sizes: DAMA_SIZES, rows: [
    { label: "Pecho", measure: "pecho", values: ["92/95", "97/100", "102/105", "107/110", "112/115"] },
    { label: "Cintura", measure: "cintura", values: ["79/81", "84/86", "89/93", "96/100", "103/107"] },
    { label: "Largo", values: ["61", "63", "65", "67", "68"] },
  ] },
  "Dama|Pantalón": { title: "Pantalón Dama", sizes: DAMA_SIZES, rows: [
    { label: "Cintura", measure: "cintura", values: ["63/65", "67/71", "73/77", "80/84", "87/91"] },
    { label: "Cadera", measure: "cadera", values: ["98/101", "103/106", "108/111", "113/116", "118/121"] },
    { label: "Largo", values: ["98", "98", "99", "100", "102"] },
  ] },
  // La guía oficial dice "Cintura", pero los valores (99–117 cm) corresponden
  // al contorno de pecho de una filipina; por eso se compara con el pecho.
  "Caballero|Filipina": { title: "Filipina Caballero", sizes: CABALLERO_SIZES, rows: [
    { label: "Cintura", measure: "pecho", values: ["99/102", "104/107", "109/112", "114/117"] },
    { label: "Largo", values: ["70", "70", "72", "72"] },
  ] },
  "Caballero|Pantalón": { title: "Pantalón Caballero", sizes: CABALLERO_SIZES, rows: [
    { label: "Cintura", measure: "cintura", values: ["73/75", "76/79", "80/83", "87/90"] },
    { label: "Cadera", measure: "cadera", values: ["105/110", "111/115", "116/120", "124/128"] },
    { label: "Largo", values: ["103", "105", "108", "111"] },
  ] },
};

function sizeGuideFor(audience, garment) {
  return SIZE_GUIDES[`${audience}|${garment}`];
}

// Índice de talla para una medida: la primera talla cuyo máximo la cubre.
// Si cae entre dos tallas, toma la mayor. -1 si supera la talla más grande.
function sizeIndexForValue(value, values) {
  for (let index = 0; index < values.length; index += 1) {
    const max = Number(values[index].split("/").pop());
    if (value <= max) return index;
  }
  return -1;
}

// Talla de la guía para una prenda. { size, tooBig, used } o null si faltan medidas.
function recommendGuideSize(measures, audience, garment) {
  const guide = sizeGuideFor(audience, garment);
  if (!guide || !measures) return null;
  let index = -Infinity;
  const used = [];
  for (const row of guide.rows) {
    const value = Number(measures[row.measure]);
    if (!row.measure || !value) continue;
    used.push(row.measure);
    const rowIndex = sizeIndexForValue(value, row.values);
    if (rowIndex === -1) return { size: null, tooBig: true, used };
    index = Math.max(index, rowIndex);
  }
  if (!used.length) return null;
  return { size: guide.sizes[index], tooBig: false, used };
}

// Talla recomendada para un conjunto u overol, ajustada a las tallas del
// modelo. Calcula filipina y pantalón y toma la mayor. null si no aplica.
function recommendProductSize(product, measures) {
  if (!measures || !isSet(product)) return null;
  const audience = product.gender === "Caballero" ? "Caballero" : product.gender === "Mujer" ? "Dama" : measures.sexo;
  if (!audience) return null;
  const parts = ["Filipina", "Pantalón"].map((garment) => ({ garment, result: recommendGuideSize(measures, audience, garment) }));
  if (parts.some((part) => !part.result)) return null;
  if (parts.some((part) => part.result.tooBig)) return { size: null, tooBig: true, parts, audience };
  const guideSizes = sizeGuideFor(audience, "Filipina").sizes;
  const largest = parts.reduce((best, part) => Math.max(best, guideSizes.indexOf(part.result.size)), 0);
  const ideal = guideSizes[largest];
  if (product.sizes.includes(ideal)) return { size: ideal, ideal, parts, audience };
  const productIndexes = product.sizes.map((size) => guideSizes.indexOf(size)).filter((index) => index >= 0);
  if (productIndexes.length && largest < Math.min(...productIndexes)) {
    return { size: guideSizes[Math.min(...productIndexes)], ideal, smallestAvailable: true, parts, audience };
  }
  return { size: null, ideal, notAvailable: true, parts, audience };
}

// ---------------------------------------------------------------------
// Seguimiento de pedidos (lo usan la tienda y el panel)
// ---------------------------------------------------------------------
const ORDER_FLOW = ["pendiente", "confirmado", "pagado", "preparacion", "enviado", "entregado"];
const ORDER_STATUS_LABELS = {
  pendiente: "Pendiente", confirmado: "Confirmado", pagado: "Pagado", preparacion: "En preparación",
  enviado: "Enviado", entregado: "Entregado", cancelado: "Cancelado",
};
const ORDER_STATUS_HELP = {
  pendiente: "Recibimos tu pedido. Te escribiremos por WhatsApp para confirmarlo.",
  confirmado: "Confirmamos disponibilidad. Te compartimos las formas de pago por WhatsApp.",
  pagado: "Recibimos tu pago. ¡Gracias!",
  preparacion: "Estamos preparando tus piezas.",
  enviado: "Tu pedido va en camino.",
  entregado: "La paquetería reporta tu pedido como entregado.",
  cancelado: "Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.",
};
// Paqueterías comunes en México; en el panel se puede escribir cualquier otra.
const CARRIERS = ["Estafeta", "FedEx", "DHL", "Redpack", "Paquetexpress", "J&T Express", "99 Minutos", "UPS", "Sendex", "AmPm"];

const formatDateTime = (value) => value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";

// Línea de tiempo del pedido: pasos del flujo con su fecha si ya ocurrieron.
function orderTimeline(order) {
  const history = Array.isArray(order.status_history || order.history) ? (order.status_history || order.history) : [];
  const lastAt = (status) => [...history].reverse().find((entry) => entry.status === status)?.at || null;
  if (order.status === "cancelado") {
    return [{ status: "pendiente", at: lastAt("pendiente") || order.created_at, done: true }, { status: "cancelado", at: lastAt("cancelado"), done: true, current: true }];
  }
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  return ORDER_FLOW.map((status, index) => ({
    status,
    at: index <= currentIndex ? (lastAt(status) || (index === 0 ? order.created_at : null)) : null,
    done: index <= currentIndex,
    current: index === currentIndex,
  }));
}
