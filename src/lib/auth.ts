import { SignJWT, jwtVerify } from "jose";

const JWT_ALG = "HS256";
const JWT_TTL = "7d";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short. Set it in .env");
  }
  return new TextEncoder().encode(secret);
}

export type SessionClaims = {
  sub: string; // userId
  email: string;
};

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_TTL)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    // Expired, tampered, or malformed — always treat as "not signed in".
    return null;
  }
}
