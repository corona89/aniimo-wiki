import { NextResponse } from "next/server";
import { SESSION_COOKIE, STATE_COOKIE, isAuthConfigured, requestOrigin, signSession } from "@/lib/auth";

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const secure = origin.startsWith("https");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const fail = (reason: string) => NextResponse.redirect(`${origin}/admin?error=${reason}`);

  if (!isAuthConfigured()) return fail("config");

  const { cookies } = await import("next/headers");
  const store = await cookies();
  const savedState = store.get(STATE_COOKIE)?.value;
  if (!code || !state || !savedState || state !== savedState) return fail("state");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return fail("token");

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const user = (await userRes.json()) as { email?: string; email_verified?: boolean; name?: string };
  if (!user.email || user.email_verified === false) return fail("email");

  const token = signSession(
    { email: user.email, name: user.name, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 },
    process.env.AUTH_SECRET!,
  );

  const res = NextResponse.redirect(`${origin}/admin`);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure,
  });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
