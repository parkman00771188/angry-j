const { app, BrowserWindow, Menu } = require("electron");
const fs = require("fs");
const http = require("http");
const net = require("net");
const os = require("os");
const path = require("path");
const url = require("url");

const APP_NAME = "앵그리 J";
const DEFAULT_PORT = Number(process.env.ANGRYJ_PORT || 38473);
const BIND_HOST = "0.0.0.0";
const LOCAL_HOST = "127.0.0.1";
const DATA_FILE_NAME = "anger-j-shared-state.json";

const DEFAULT_CAUSES = [
  { id: "work", label: "업무", color: "#2563EB" },
  { id: "relationship", label: "대인관계", color: "#14B8A6" },
  { id: "family", label: "가족", color: "#F59E0B" },
  { id: "traffic", label: "교통", color: "#F97316" },
  { id: "health", label: "건강", color: "#8B5CF6" },
  { id: "etc", label: "기타", color: "#64748B" },
];

const DEFAULT_SETTINGS = {
  resetMemoAfterSave: true,
  confirmBeforeSave: false,
  dateTimeFormat: "24h",
};

let server = null;
let mainWindow = null;
let splashWindow = null;

function getLogPath() {
  try {
    return path.join(app.getPath("userData"), "angerj-main.log");
  } catch {
    return path.join(os.tmpdir(), "angerj-main.log");
  }
}

function log(message, error) {
  try {
    const detail = error ? ` ${error.stack || error.message || String(error)}` : "";
    const logPath = getLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}${detail}\n`, "utf8");
  } catch {
    // Logging must never be the reason the app fails to start.
  }
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getDistPath() {
  return path.join(app.getAppPath(), "dist");
}

function getLogoPath() {
  const candidates = [
    path.join(app.getAppPath(), "assets", "angryJ-logo.png"),
    path.join(app.getAppPath(), "src", "assets", "angryJ logo.png"),
    path.join(process.resourcesPath || "", "assets", "angryJ-logo.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function getWindowIconPath() {
  const iconPath = getLogoPath();
  return fs.existsSync(iconPath) ? iconPath : undefined;
}

function prepareSplashFile() {
  const splashDir = path.join(app.getPath("userData"), "splash");
  const logoPath = getLogoPath();
  const runtimeLogoName = "angryJ-logo.png";
  const runtimeLogoPath = path.join(splashDir, runtimeLogoName);
  const splashPath = path.join(splashDir, "splash.html");
  let logoSrc = "";

  fs.mkdirSync(splashDir, { recursive: true });

  if (fs.existsSync(logoPath)) {
    try {
      fs.writeFileSync(runtimeLogoPath, fs.readFileSync(logoPath));
      logoSrc = runtimeLogoName;
    } catch {
      logoSrc = "";
    }
  }

  fs.writeFileSync(splashPath, createSplashHtml(logoSrc), "utf8");

  return splashPath;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getDataFilePath() {
  return path.join(app.getPath("userData"), DATA_FILE_NAME);
}

function getDefaultStore() {
  return {
    records: [],
    causes: DEFAULT_CAUSES,
    settings: DEFAULT_SETTINGS,
    initialized: false,
    updatedAt: "",
  };
}

function normalizeStore(raw) {
  return {
    records: Array.isArray(raw?.records) ? raw.records : [],
    causes: Array.isArray(raw?.causes) && raw.causes.length ? raw.causes : DEFAULT_CAUSES,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw?.settings && typeof raw.settings === "object" ? raw.settings : {}),
    },
    initialized: Boolean(raw?.initialized),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : "",
  };
}

function readStore() {
  const filePath = getDataFilePath();

  if (!fs.existsSync(filePath)) {
    return getDefaultStore();
  }

  try {
    return normalizeStore(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    return getDefaultStore();
  }
}

function writeStore(nextStore) {
  const filePath = getDataFilePath();
  const store = normalizeStore({
    ...nextStore,
    initialized: true,
    updatedAt: new Date().toISOString(),
  });

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");

  return store;
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 5 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function getLanIp() {
  const interfaces = os.networkInterfaces();

  for (const items of Object.values(interfaces)) {
    for (const item of items || []) {
      if (item.family === "IPv4" && !item.internal) {
        return item.address;
      }
    }
  }

  return "127.0.0.1";
}

function canUsePort(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, BIND_HOST);
  });
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }

  throw new Error("사용 가능한 포트를 찾지 못했습니다.");
}

function sendJson(response, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": body.length,
  });
  response.end(body);
}

function sendError(response, statusCode, message) {
  const body = Buffer.from(JSON.stringify({ error: message }), "utf8");
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": body.length,
  });
  response.end(body);
}

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(data);
  });
}

function createStaticServer(distPath, port) {
  return new Promise((resolve, reject) => {
    const nextServer = http.createServer((request, response) => {
      const parsed = url.parse(request.url || "/");

      if (parsed.pathname === "/server-info.json") {
        const lanIp = getLanIp();
        sendJson(response, {
          appName: APP_NAME,
          hostIp: lanIp,
          port,
          localUrl: `http://${LOCAL_HOST}:${port}`,
          lanUrl: `http://${lanIp}:${port}`,
          bindHost: BIND_HOST,
          storage: "shared-json",
          shell: "electron",
        });
        return;
      }

      if (parsed.pathname === "/api/state") {
        if (request.method === "GET") {
          sendJson(response, readStore());
          return;
        }

        if (request.method === "PUT" || request.method === "POST") {
          readRequestJson(request)
            .then((body) => {
              sendJson(response, writeStore(body));
            })
            .catch(() => {
              sendError(response, 400, "Invalid JSON body");
            });
          return;
        }

        sendError(response, 405, "Method not allowed");
        return;
      }

      const rawPathname = decodeURIComponent(parsed.pathname || "/");
      const safePathname = rawPathname.replace(/^\/+/, "");
      let filePath = path.join(distPath, safePathname || "index.html");

      if (!filePath.startsWith(distPath)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        filePath = path.join(distPath, "index.html");
      }

      serveFile(response, filePath);
    });

    nextServer.once("error", reject);
    nextServer.listen(port, BIND_HOST, () => resolve(nextServer));
  });
}

async function createWindow() {
  log("createWindow:start");
  const splashStartedAt = Date.now();
  const iconPath = getWindowIconPath();

  splashWindow = new BrowserWindow({
    width: 440,
    height: 360,
    resizable: false,
    movable: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    transparent: false,
    backgroundColor: "#EAF3FF",
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  splashWindow.on("closed", () => {
    log("splashWindow:closed");
    splashWindow = null;
  });

  await splashWindow.loadFile(prepareSplashFile());
  log("splashWindow:loaded");

  const port = await findFreePort(DEFAULT_PORT);
  const distPath = getDistPath();
  log(`server:port:${port}`);

  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    throw new Error(`웹 빌드 결과를 찾지 못했습니다: ${distPath}`);
  }

  server = await createStaticServer(distPath, port);
  log("server:started");
  const localUrl = `http://${LOCAL_HOST}:${port}`;

  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: APP_NAME,
    backgroundColor: "#F6F8FC",
    show: false,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("closed", () => {
    log("mainWindow:closed");
    mainWindow = null;
  });

  const readyToShow = new Promise((resolve) => {
    mainWindow.once("ready-to-show", resolve);
  });

  await mainWindow.loadURL(localUrl);
  log("mainWindow:loaded");
  await readyToShow;
  log("mainWindow:ready-to-show");

  const remainingSplashTime = Math.max(0, 3000 - (Date.now() - splashStartedAt));
  await wait(remainingSplashTime);

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    log("mainWindow:shown");
  }
}

function createSplashHtml(logoUrl) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file: data:; style-src 'unsafe-inline';" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 100vw;
      height: 100vh;
      display: grid;
      place-items: center;
      overflow: hidden;
      background:
        radial-gradient(circle at 76% 8%, rgba(13, 102, 255, 0.22), transparent 190px),
        linear-gradient(135deg, #f7fbff 0%, #e4f0ff 100%);
      color: #071733;
      font-family: "Segoe UI", "Malgun Gothic", sans-serif;
      user-select: none;
    }
    .shell {
      width: 340px;
      padding: 34px 34px 30px;
      border: 1px solid rgba(119, 153, 203, 0.35);
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.74);
      box-shadow: 0 26px 70px rgba(30, 86, 180, 0.20);
      text-align: center;
    }
    .logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      filter: drop-shadow(0 16px 22px rgba(13, 102, 255, 0.22));
    }
    h1 {
      margin: 16px 0 6px;
      font-size: 30px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0 0 24px;
      color: #587098;
      font-size: 13px;
      font-weight: 800;
    }
    .bar {
      height: 10px;
      overflow: hidden;
      border-radius: 999px;
      background: #d8e7fb;
      box-shadow: inset 0 0 0 1px rgba(99, 137, 190, 0.18);
    }
    .bar span {
      display: block;
      height: 100%;
      width: 0;
      border-radius: inherit;
      background: linear-gradient(90deg, #0d66ff, #4aa3ff);
      animation: loading 3s ease-in-out forwards;
    }
    .caption {
      margin-top: 12px;
      color: #0d66ff;
      font-size: 12px;
      font-weight: 900;
    }
    @keyframes loading {
      0% { width: 8%; }
      45% { width: 62%; }
      100% { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="shell">
    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="" />` : ""}
    <h1>앵그리 J</h1>
    <p>기록 대시보드를 준비하고 있어요</p>
    <div class="bar"><span></span></div>
    <div class="caption">Loading...</div>
  </main>
</body>
</html>`;
}

app.whenReady().then(() => {
  createWindow().catch((error) => {
    log("createWindow:error", error);
    console.error(error);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  log("app:window-all-closed");
  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
  if (server) {
    server.close();
    server = null;
  }
  app.quit();
});

app.on("before-quit", () => {
  log("app:before-quit");
  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
  if (server) {
    server.close();
    server = null;
  }
});
