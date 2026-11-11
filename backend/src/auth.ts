import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = process.env.TOKEN_TTL || "12h";

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET tanimli degil. backend/.env dosyasina guclu, rastgele bir deger ekle " +
      "(orn: `openssl rand -hex 32` ciktisi)."
  );
}

export interface TokenPayload {
  username: string;
  role: "admin" | "operator";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

// REST endpoint'lerini korur: "Authorization: Bearer <token>" bekler
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Gecersiz veya eksik oturum" });
    return;
  }
  (req as any).user = payload;
  next();
}
