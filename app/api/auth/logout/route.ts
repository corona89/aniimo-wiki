import { NextResponse } from "next/server";
import { SESSION_COOKIE, requestOrigin } from "@/lib/auth";

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
