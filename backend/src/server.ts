import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import bcrypt from "bcryptjs";
import { WebSocketServer, WebSocket } from "ws";
import { sessionManager } from "./sessionManager";
import { requireAuth, signToken, verifyToken } from "./auth";
import { findUser } from "./users";
import { logEvent } from "./accessLog";

const PORT = Number(process.env.PORT || 4000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // orn: https://msf-console.vercel.app

const app = express();
app.use(
  cors({
    origin: ALLOWED_ORIGIN || true, // .env'de set edilmemisse gelistirme icin serbest birak
    credentials: true,
  })
);
app.use(express.json());

function clientIp(req: express.Request) {
  return (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "bilinmiyor";
}

// --- Auth ---

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const ip = clientIp(req);
  const user = username ? findUser(username) : undefined;
  const ok = user ? await bcrypt.compare(password || "", user.passwordHash) : false;

  if (!ok || !user) {
    logEvent({ type: "login_fail", username, ip });
    res.status(401).json({ error: "Kullanici adi veya sifre hatali" });
    return;
  }

  logEvent({ type: "login_ok", username: user.username, ip });
  const token = signToken({ username: user.username, role: user.role });
  res.json({ token, username: user.username, role: user.role });
});

// --- REST: oturum yonetimi (giris gerektirir) ---

app.get("/api/sessions", requireAuth, (_req, res) => {
  res.json(sessionManager.list());
});

app.post("/api/sessions", requireAuth, (req, res) => {
  const user = (req as any).user;
  const session = sessionManager.create(req.body?.label, user.username);
  logEvent({
    type: "session_create",
    username: user.username,
    ip: clientIp(req),
    sessionId: session.id,
  });
  res.status(201).json({
    id: session.id,
    label: session.label,
    createdAt: session.createdAt,
    status: session.status,
    owner: session.owner,
  });
});

app.delete("/api/sessions/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const ok = sessionManager.kill(req.params.id);
  logEvent({
    type: "session_kill",
    username: user.username,
    ip: clientIp(req),
    sessionId: req.params.id,
  });
  res.status(ok ? 204 : 404).end();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- WebSocket: canli terminal akisi ---
// ws://host:4000/ws/<sessionId>?token=<jwt>

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const match = url.pathname.match(/^\/ws\/([a-f0-9-]+)$/i);
  const token = url.searchParams.get("token") || "";
  const payload = verifyToken(token);

  if (!match || !payload) {
    socket.destroy();
    return;
  }
  const sessionId = match[1];
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, { sessionId, username: payload.username });
  });
});

wss.on(
  "connection",
  (ws: WebSocket, req, ctx: { sessionId: string; username: string }) => {
    const { sessionId, username } = ctx;
    const session = sessionManager.attach(sessionId, ws);
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "bilinmiyor";

    if (!session) {
      ws.send(JSON.stringify({ type: "error", message: "Oturum bulunamadi" }));
      ws.close();
      return;
    }

    logEvent({ type: "ws_connect", username, ip, sessionId });
    ws.on("close", () => logEvent({ type: "ws_disconnect", username, ip, sessionId }));

    ws.on("message", (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === "input") {
        sessionManager.write(sessionId, msg.data);
      } else if (msg.type === "resize") {
        sessionManager.resize(sessionId, msg.cols, msg.rows);
      }
    });
  }
);

server.listen(PORT, () => {
  console.log(`msf-web-console backend http://localhost:${PORT}`);
  console.log(`MSFCONSOLE_BIN=${process.env.MSFCONSOLE_BIN || "msfconsole"}`);
});
