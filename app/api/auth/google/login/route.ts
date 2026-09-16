import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { STATE_COOKIE, isAuthConfigured, requestOrigin } from "@/lib/auth";

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return new NextResponse("Google SSO is not configured (missing env vars).", { status: 503 });
  }

  const origin = requestOrigin(request);
  const secure = origin.startsWith("https");
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure,
  });
  return res;
}
