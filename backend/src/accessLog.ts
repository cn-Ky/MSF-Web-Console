import fs from "fs";
import path from "path";

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "access.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function logEvent(event: {
  type: "login_ok" | "login_fail" | "session_create" | "session_kill" | "ws_connect" | "ws_disconnect";
  username?: string;
  ip?: string;
  sessionId?: string;
  detail?: string;
}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  fs.appendFile(LOG_FILE, line + "\n", () => {});
  // konsola da bas, is uzerinde takip icin
  console.log("[access]", line);
}
