import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signSessionToken, verifySessionToken } from "@/lib/auth";

export const SESSION_COOKIE = "session";

export async function createSession(userId: string, email: string) {
  const token = await signSessionToken({ sub: userId, email });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

// Loads the full user record for the current request. Returns null for
// anonymous visitors — callers decide whether that's an error.
export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  return db.user.findUnique({ where: { id: claims.sub } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHENTICATED");
    err.name = "UNAUTHENTICATED";
    throw err;
  }
  return user;
}
