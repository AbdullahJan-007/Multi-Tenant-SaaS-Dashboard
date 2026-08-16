import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ForbiddenError } from "@/lib/rbac";
import { OrgNotFoundError } from "@/lib/org";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof OrgNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof Error && error.name === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  // A findUnique-then-create check (register, org slug generation) has a
  // small race window: two requests can both pass the check before either
  // writes. The database's unique constraint is the real guard — this
  // catches that case so it fails with a clear message instead of a bare
  // 500, without needing a special case in every route that does this.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: "That value is already taken. Please try again." },
      { status: 409 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
