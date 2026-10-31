"use strict";
// =====================================================================
// Todo lo que habla con Supabase. Si Supabase no carga (sin internet,
// llave vacía), la tienda sigue funcionando y las medidas se guardan
// solo en este navegador.
// =====================================================================

const MSA_DB = (() => {
  const config = window.MSA_CONFIG || {};
  let client = null;
  try {
    if (window.supabase?.createClient && config.supabaseUrl && config.supabaseKey) {
      client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    }
  } catch (error) {
    console.warn("No se pudo iniciar Supabase", error);
  }

  const ERROR_MESSAGES = [
    ["Invalid login credentials", "Correo o contraseña incorrectos."],
    ["Email not confirmed", "Primero confirma tu correo: revisa tu bandeja de entrada (y spam)."],
    ["User already registered", "Ese correo ya tiene una cuenta. Inicia sesión."],
    ["Password should be at least", "La contraseña debe tener al menos 6 caracteres."],
    ["Unable to validate email address", "Revisa que el correo esté bien escrito."],
    ["rate limit", "Demasiados intentos. Espera unos minutos y vuelve a probar."],
    ["Failed to fetch", "No hay conexión con el servidor. Revisa tu internet."],
  ];

  function friendlyError(error) {
    const text = String(error?.message || error || "");
    const match = ERROR_MESSAGES.find(([needle]) => text.toLowerCase().includes(needle.toLowerCase()));
    return match ? match[1] : text || "Ocurrió un error. Intenta de nuevo.";
  }

  function must(result) {
    if (result.error) throw new Error(friendlyError(result.error));
    return result.data;
  }

  // Llave de existencias: producto | sexo | color | talla | pantalón (Jogger/Recto o vacío).
  const inventoryKey = (productId, gender, color, size, variant = "") => `${productId}|${gender}|${color}|${size}|${variant || ""}`;

  return {
    available: Boolean(client),
    friendlyError,
    inventoryKey,

    // ---------- Sesión ----------
    async getUser() {
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data.session?.user || null;
    },
    onAuthChange(callback) {
      if (!client) return;
      // Supabase recomienda no llamar a otras funciones dentro del aviso; por eso setTimeout.
      client.auth.onAuthStateChange((event, session) => {
        window.setTimeout(() => callback(event, session?.user || null), 0);
      });
    },
    async signIn(email, password) {
      return must(await client.auth.signInWithPassword({ email, password })).user;
    },
    async signUp(email, password) {
      const redirect = window.location.origin + window.location.pathname;
      const data = must(await client.auth.signUp({ email, password, options: { emailRedirectTo: redirect } }));
      return { user: data.user, needsConfirmation: !data.session };
    },
    async signOut() {
      must(await client.auth.signOut());
    },
    async sendPasswordReset(email) {
      const redirect = window.location.origin + window.location.pathname;
      must(await client.auth.resetPasswordForEmail(email, { redirectTo: redirect }));
    },
    async updatePassword(password) {
      must(await client.auth.updateUser({ password }));
    },

    // ---------- Medidas ----------
    async loadProfile(userId) {
      return must(await client.from("profiles").select("sexo, pecho, cintura, cadera").eq("id", userId).maybeSingle());
    },
    async saveProfile(userId, measures) {
      must(await client.from("profiles").upsert({
        id: userId,
        sexo: measures.sexo || null,
        pecho: measures.pecho || null,
        cintura: measures.cintura || null,
        cadera: measures.cadera || null,
        updated_at: new Date().toISOString(),
      }));
    },
    async deleteProfile(userId) {
      must(await client.from("profiles").delete().eq("id", userId));
    },

    // ---------- Inventario ----------
    // Devuelve un Map "producto|sexo|color|talla|pantalón" → existencias.
    async loadInventory() {
      if (!client) return new Map();
      const rows = must(await client.from("inventory").select("product_id, gender, color, size, variant, stock"));
      return new Map(rows.map((row) => [inventoryKey(row.product_id, row.gender, row.color, row.size, row.variant), row.stock]));
    },
    async saveInventory(rows) {
      if (!rows.length) return;
      must(await client.from("inventory").upsert(rows.map((row) => ({ ...row, updated_at: new Date().toISOString() }))));
    },
    async deleteInventory(rows) {
      for (const row of rows) {
        must(await client.from("inventory").delete()
          .eq("product_id", row.product_id).eq("gender", row.gender).eq("color", row.color).eq("size", row.size)
          .eq("variant", row.variant || ""));
      }
    },

    // ---------- Pedidos ----------
    // El pedido se registra con la función create_order de la base de datos:
    // ella toma los precios del catálogo (no del navegador) y valida todo.
    // Devuelve { id, total } o null si Supabase no está disponible.
    async createOrder(customer, items, honeypot = "") {
      if (!client) return null;
      return must(await client.rpc("create_order", { customer, items, honeypot }));
    },
    // statuses: lista de estados a mostrar en el panel.
    async listOrders(statuses) {
      return must(await client.from("orders").select("*").in("status", statuses).order("created_at", { ascending: false }).limit(200));
    },
    // Cambia el estado (solo admin). Descuenta o regresa existencias según el caso.
    async setOrderStatus(orderId, status, shipping = {}) {
      must(await client.rpc("set_order_status", {
        order_id: orderId, new_status: status,
        p_carrier: shipping.carrier || null, p_tracking_number: shipping.tracking_number || null, p_tracking_url: shipping.tracking_url || null,
      }));
    },
    // Pedidos del cliente con sesión iniciada (las reglas solo dejan ver los propios).
    async listMyOrders(userId) {
      return must(await client.from("orders").select("id, created_at, status, status_history, items, total, carrier, tracking_number, tracking_url")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(30));
    },
    // Rastreo sin cuenta: número de pedido + últimos 4 dígitos del teléfono. null si no coincide.
    async trackOrder(orderId, last4) {
      if (!client) throw new Error("No hay conexión con el servidor. Intenta más tarde.");
      return must(await client.rpc("track_order", { order_id: orderId, phone_last4: last4 }));
    },

    // ---------- Catálogo y portadas ----------
    // includeHidden: el panel ve también borradores (las reglas lo permiten solo a admin).
    async loadProducts() {
      if (!client) return null;
      return must(await client.from("products").select("*").order("sort_order").order("name"));
    },
    async saveProduct(product) {
      must(await client.from("products").upsert({ ...product, updated_at: new Date().toISOString() }));
    },
    async deleteProduct(id) {
      must(await client.from("products").delete().eq("id", id));
    },
    async loadBanners() {
      if (!client) return null;
      return must(await client.from("banners").select("*").order("sort_order").order("id"));
    },
    async saveBanner(banner) {
      const { id, ...fields } = banner;
      if (id) must(await client.from("banners").update(fields).eq("id", id));
      else must(await client.from("banners").insert(fields));
    },
    async deleteBanner(id) {
      must(await client.from("banners").delete().eq("id", id));
    },
    // Sube una foto a la carpeta pública "productos" y devuelve su dirección.
    async uploadImage(blob, fileName) {
      const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
      const path = `${Date.now()}-${safeName}`;
      must(await client.storage.from("productos").upload(path, blob, { contentType: blob.type, upsert: false }));
      return client.storage.from("productos").getPublicUrl(path).data.publicUrl;
    },

    // ---------- Administración ----------
    async isAdmin() {
      if (!client) return false;
      return Boolean(must(await client.rpc("is_admin")));
    },
  };
})();
