import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = schema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email } });
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;

    // Same error for "no such user" and "wrong password" — don't leak
    // which emails are registered.
    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id, user.email);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    return handleApiError(error);
  }
}
