import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  adminUsername,
  isPasswordConfigured,
  requestOrigin,
  signSession,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const secure = origin.startsWith("https");
  const fail = (reason: string) => NextResponse.redirect(`${origin}/admin?error=${reason}`, { status: 303 });

  if (!isPasswordConfigured()) return fail("config");

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (username.toLowerCase() !== adminUsername() || !verifyPassword(password)) {
    return fail("cred");
  }

  const token = signSession(
    { email: adminUsername(), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 },
    process.env.AUTH_SECRET!,
  );

  const res = NextResponse.redirect(`${origin}/admin`, { status: 303 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure,
  });
  return res;
}
