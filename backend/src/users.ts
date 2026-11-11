import fs from "fs";
import path from "path";

export interface User {
  username: string;
  passwordHash: string;
  role: "admin" | "operator";
  addedAt: string;
}

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

function ensureFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, "[]", "utf-8");
  }
}

export function loadUsers(): User[] {
  ensureFile();
  const raw = fs.readFileSync(USERS_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUser(username: string): User | undefined {
  return loadUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function addUser(user: User) {
  const users = loadUsers();
  if (users.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
    throw new Error(`"${user.username}" zaten kayitli`);
  }
  users.push(user);
  saveUsers(users);
}

export function removeUser(username: string): boolean {
  const users = loadUsers();
  const next = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  const removed = next.length !== users.length;
  if (removed) saveUsers(next);
  return removed;
}
