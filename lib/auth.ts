import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";
export const STATE_COOKIE = "oauth_state";

export type Session = { email: string; name?: string; exp: number };

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

export function signSession(session: Session, secret: string): string {
  const payload = b64urlJson(session);
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string, secret: string): Session | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.email || typeof session.exp !== "number" || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET);
}

/** Username/password (credentials) login is available when a hash + signing secret exist. */
export function isPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.AUTH_SECRET);
}

export function adminUsername(): string {
  return (process.env.ADMIN_USERNAME ?? "cpar2002@gmail.com").trim().toLowerCase();
}

/** scrypt hash format: "scrypt:<saltHex>:<hashHex>". */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const derived = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Bootstrap admin(s) that are always allowed, even without ADMIN_EMAILS set. */
const INITIAL_ADMINS = ["cpar2002@gmail.com"];

export function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(
    new Set([...INITIAL_ADMINS.map((e) => e.toLowerCase()), adminUsername(), ...fromEnv]),
  );
}

export async function getSession(): Promise<Session | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token, secret);
}

export async function getAdmin(): Promise<{ email: string | null; name?: string; isAdmin: boolean }> {
  const session = await getSession();
  const email = session?.email ?? null;
  const isAdmin = Boolean(email && adminEmails().includes(email.toLowerCase()));
  return { email, name: session?.name, isAdmin };
}

/** Build the external origin, honoring reverse proxies (tunnels, prod). */
export function requestOrigin(request: Request): string {
  const h = request.headers;
  const proto = h.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? new URL(request.url).host;
  return `${proto}://${host}`;
}
