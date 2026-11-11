import * as pty from "node-pty";
import { v4 as uuidv4 } from "uuid";
import type { WebSocket } from "ws";

export interface ConsoleSession {
  id: string;
  label: string;
  owner: string;
  createdAt: number;
  status: "running" | "exited";
  proc: pty.IPty;
  clients: Set<WebSocket>;
  // son N karakterlik cikti, yeni baglanan istemciye "gecmisi" gostermek icin
  scrollback: string;
}

const MAX_SCROLLBACK = 200_000; // karakter
const MSFCONSOLE_BIN = process.env.MSFCONSOLE_BIN || "msfconsole";

class SessionManager {
  private sessions = new Map<string, ConsoleSession>();

  list() {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      label: s.label,
      owner: s.owner,
      createdAt: s.createdAt,
      status: s.status,
    }));
  }

  get(id: string) {
    return this.sessions.get(id);
  }

  create(label: string | undefined, owner: string): ConsoleSession {
    const id = uuidv4();

    const proc = pty.spawn(MSFCONSOLE_BIN, ["-q"], {
      name: "xterm-256color",
      cols: 120,
      rows: 34,
      cwd: process.env.HOME,
      env: process.env as Record<string, string>,
    });

    const session: ConsoleSession = {
      id,
      label: label?.trim() || `msf-${id.slice(0, 8)}`,
      owner,
      createdAt: Date.now(),
      status: "running",
      proc,
      clients: new Set(),
      scrollback: "",
    };

    proc.onData((chunk) => {
      session.scrollback += chunk;
      if (session.scrollback.length > MAX_SCROLLBACK) {
        session.scrollback = session.scrollback.slice(-MAX_SCROLLBACK);
      }
      for (const ws of session.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "data", data: chunk }));
        }
      }
    });

    proc.onExit(({ exitCode }) => {
      session.status = "exited";
      for (const ws of session.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({ type: "exit", code: exitCode })
          );
        }
      }
    });

    this.sessions.set(id, session);
    return session;
  }

  write(id: string, data: string) {
    const session = this.sessions.get(id);
    if (!session || session.status !== "running") return;
    session.proc.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    const session = this.sessions.get(id);
    if (!session || session.status !== "running") return;
    try {
      session.proc.resize(cols, rows);
    } catch {
      /* pencere zaten kapanmis olabilir, yut */
    }
  }

  kill(id: string) {
    const session = this.sessions.get(id);
    if (!session) return false;
    try {
      session.proc.kill();
    } catch {
      /* zaten olu olabilir */
    }
    this.sessions.delete(id);
    return true;
  }

  attach(id: string, ws: WebSocket) {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.clients.add(ws);
    // yeni baglanan istemciye gecmis ciktiyi gonder
    if (session.scrollback) {
      ws.send(JSON.stringify({ type: "data", data: session.scrollback }));
    }
    ws.on("close", () => session.clients.delete(ws));
    return session;
  }
}

export const sessionManager = new SessionManager();
