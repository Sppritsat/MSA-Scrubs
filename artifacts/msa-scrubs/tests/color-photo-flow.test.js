import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteEntry = path.join(artifactRoot, "node_modules", "vite", "bin", "vite.js");
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function collectOutput(child) {
  let output = "";
  child.stdout?.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr?.on("data", (chunk) => { output += chunk.toString(); });
  return () => output;
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    pause(1500),
  ]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      pause(1500),
    ]);
  }
}

async function waitForResponse(url, child, getOutput, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Process exited before becoming ready:\n${getOutput()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The server may still be starting.
    }
    await pause(150);
  }
  throw new Error(`Timed out waiting for ${url}.\n${getOutput()}`);
}

class DevToolsClient {
  constructor(socket, appOrigin) {
    this.socket = socket;
    this.appOrigin = appOrigin;
    this.nextId = 0;
    this.pending = new Map();
    this.errors = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        clearTimeout(request.timer);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
        return;
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.errors.push(message.params.exceptionDetails.text);
      }
      if (
        message.method === "Network.responseReceived" &&
        message.params.response.status >= 400 &&
        message.params.response.url.startsWith(this.appOrigin)
      ) {
        this.errors.push(`${message.params.response.status} ${message.params.response.url}`);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`DevTools command timed out: ${method}`));
      }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    }
    return response.result?.value;
  }

  async close() {
    await this.send("Browser.close").catch(() => {});
    this.socket.close();
  }
}

async function connectToChromium(debugPort, appOrigin) {
  const debugUrl = `http://127.0.0.1:${debugPort}`;
  const targets = await (await fetch(`${debugUrl}/json`)).json();
  const page = targets.find((target) => target.type === "page");
  assert.ok(page, "Chromium should expose a page target");
  assert.equal(typeof WebSocket, "function", "Node.js must provide its built-in WebSocket client");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const client = new DevToolsClient(socket, appOrigin);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");
  return client;
}

async function waitForValue(client, expression, expected, label, timeout = 12000) {
  const deadline = Date.now() + timeout;
  let actual;
  while (Date.now() < deadline) {
    actual = await client.evaluate(expression);
    if (actual === expected) return actual;
    await pause(100);
  }
  assert.equal(actual, expected, `${label} did not reach its expected value`);
}

test("color photos and fallbacks stay consistent from product to cart and companion offer", {
  timeout: 60000,
}, async () => {
  const appPort = await getFreePort();
  const debugPort = await getFreePort();
  const appUrl = `http://127.0.0.1:${appPort}/`;
  const appOrigin = new URL(appUrl).origin;
  const profileDir = await mkdtemp(path.join(tmpdir(), "msa-color-flow-"));
  let vite;
  let chromium;
  let client;
  let viteOutput = () => "";
  let chromiumOutput = () => "";

  try {
    vite = spawn(process.execPath, [viteEntry, "--config", "vite.config.ts", "--host", "127.0.0.1"], {
      cwd: artifactRoot,
      env: { ...process.env, PORT: String(appPort), BASE_PATH: "/" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    viteOutput = collectOutput(vite);
    await waitForResponse(appUrl, vite, viteOutput);

    chromium = spawn(process.env.CHROMIUM_PATH || "chromium", [
      "--headless",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      "--window-size=1440,1200",
      "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    chromiumOutput = collectOutput(chromium);
    await waitForResponse(`http://127.0.0.1:${debugPort}/json/version`, chromium, chromiumOutput);
    client = await connectToChromium(debugPort, appOrigin);
    await client.send("Page.navigate", { url: appUrl });
    await waitForValue(client, "document.querySelectorAll('.product-card').length", 13, "product catalog");

    await client.evaluate(`document.querySelector('[data-product-id="amalia"]').click()`);
    let productVisual = await client.evaluate(`(() => {
      const visual = document.querySelector('.modal-visual .product-visual');
      return {
        src: visual.querySelector('img')?.getAttribute('src') || null,
        color: visual.querySelector('.visual-color')?.textContent || null,
        naturalWidth: visual.querySelector('img')?.naturalWidth || 0
      };
    })()`);
    assert.equal(productVisual.src, "./images/blanco.png");
    assert.equal(productVisual.color, "Blanco");
    await waitForValue(client, "document.querySelector('.modal-visual img')?.naturalWidth > 0", true, "default product photo");

    await client.evaluate(`document.querySelector('[data-action="product-option-color"][data-value="Rubi"]').click()`);
    await waitForValue(client, "document.querySelector('.modal-visual img')?.naturalWidth > 0", true, "Rubi product photo");
    productVisual = await client.evaluate(`(() => {
      const visual = document.querySelector('.modal-visual .product-visual');
      return {
        src: visual.querySelector('img')?.getAttribute('src') || null,
        color: visual.querySelector('.visual-color')?.textContent || null,
        naturalWidth: visual.querySelector('img')?.naturalWidth || 0
      };
    })()`);
    assert.equal(productVisual.src, "./images/rubi.png");
    assert.equal(productVisual.color, "Rubi");
    assert.ok(productVisual.naturalWidth > 0, "the selected real photo should load");

    await client.evaluate(`document.querySelector('[data-action="add-product"]').click()`);
    const realPhotoInCart = await client.evaluate(`(() => {
      const item = [...document.querySelectorAll('.cart-item')].find((row) =>
        row.querySelector('h3')?.textContent === 'Contempo · Jogger'
      );
      return {
        src: item?.querySelector('.product-visual img')?.getAttribute('src') || null,
        color: item?.querySelector('.visual-color')?.textContent || null,
        selection: item?.querySelector('.cart-item-selection')?.textContent.trim() || null
      };
    })()`);
    assert.deepEqual(realPhotoInCart, {
      src: "./images/rubi.png",
      color: "Rubi",
      selection: "Mujer · Slim · Rubi · Talla M",
    });

    await client.evaluate(`document.querySelector('[data-action="close-modal"]').click()`);
    await client.evaluate(`document.querySelector('[data-product-id="amalia"]').click()`);
    await client.evaluate(`document.querySelector('[data-action="product-option-color"][data-value="Militar"]').click()`);
    const fallbackInProduct = await client.evaluate(`(() => {
      const visual = document.querySelector('.modal-visual .product-visual');
      return {
        hasPhoto: Boolean(visual.querySelector('img')),
        hasColorFallback: Boolean(visual.querySelector('.garment-shape')),
        color: visual.querySelector('.visual-color')?.textContent || null,
        accent: getComputedStyle(visual).getPropertyValue('--visual-accent').trim()
      };
    })()`);
    assert.deepEqual(fallbackInProduct, {
      hasPhoto: false,
      hasColorFallback: true,
      color: "Militar",
      accent: "#304d2b",
    });
    await client.evaluate(`document.querySelector('[data-action="add-product"]').click()`);
    const fallbackInCart = await client.evaluate(`(() => {
      const item = [...document.querySelectorAll('.cart-item')].find((row) =>
        row.querySelector('.visual-color')?.textContent === 'Militar'
      );
      const visual = item?.querySelector('.product-visual');
      return {
        hasPhoto: Boolean(visual?.querySelector('img')),
        hasColorFallback: Boolean(visual?.querySelector('.garment-shape')),
        color: visual?.querySelector('.visual-color')?.textContent || null,
        accent: visual ? getComputedStyle(visual).getPropertyValue('--visual-accent').trim() : null
      };
    })()`);
    assert.deepEqual(fallbackInCart, fallbackInProduct, "the cart should keep the no-photo color fallback");

    await client.evaluate(`document.querySelector('[data-action="close-modal"]').click()`);
    await client.evaluate(`document.querySelector('[data-product-id="pantalon-msa"]').click()`);
    await client.evaluate(`document.querySelector('[data-action="product-option-color"][data-value="Azul marino"]').click()`);
    await client.evaluate(`document.querySelector('[data-action="add-product"]').click()`);
    const companionOffer = await client.evaluate(`(() => {
      const visual = document.querySelector('.offer-layout .modal-visual .product-visual');
      return {
        title: document.querySelector('#offer-title')?.textContent.trim() || null,
        hasPhoto: Boolean(visual?.querySelector('img')),
        hasColorFallback: Boolean(visual?.querySelector('.garment-shape')),
        color: visual?.querySelector('.visual-color')?.textContent || null,
        accent: visual ? getComputedStyle(visual).getPropertyValue('--visual-accent').trim() : null
      };
    })()`);
    assert.deepEqual(companionOffer, {
      title: "¿Quieres agregar la filipina?",
      hasPhoto: false,
      hasColorFallback: true,
      color: "Azul marino",
      accent: "#102c50",
    });

    await client.evaluate(`document.querySelector('[data-action="add-companion"]').click()`);
    const companionInCart = await client.evaluate(`(() => {
      const item = [...document.querySelectorAll('.cart-item')].find((row) =>
        row.querySelector('h3')?.textContent === 'Clasia · Pétalo'
      );
      const visual = item?.querySelector('.product-visual');
      return {
        hasPhoto: Boolean(visual?.querySelector('img')),
        hasColorFallback: Boolean(visual?.querySelector('.garment-shape')),
        color: visual?.querySelector('.visual-color')?.textContent || null,
        accent: visual ? getComputedStyle(visual).getPropertyValue('--visual-accent').trim() : null,
        selection: item?.querySelector('.cart-item-selection')?.textContent.trim() || null
      };
    })()`);
    assert.deepEqual(companionInCart, {
      hasPhoto: false,
      hasColorFallback: true,
      color: companionOffer.color,
      accent: companionOffer.accent,
      selection: "Unisex · Recto · Azul marino · Talla M",
    }, "the companion cart item should retain the same color fallback as the offer");

    await pause(250);
    assert.deepEqual(client.errors, [], "the flow should not produce runtime errors or missing app resources");
  } finally {
    await client?.close();
    await stopProcess(chromium);
    await stopProcess(vite);
    await rm(profileDir, { recursive: true, force: true });
  }
});