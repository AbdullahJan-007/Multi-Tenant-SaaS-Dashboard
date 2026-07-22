import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateUniqueSlug, listUserOrganizations } from "@/lib/org";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60)
});

export async function GET() {
  try {
    const user = await requireUser();
    const orgs = await listUserOrganizations(user);
    return NextResponse.json(orgs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { name } = schema.parse(await req.json());
    const slug = await generateUniqueSlug(name);

    // Creating an org and making the creator its OWNER must happen
    // together — a transaction keeps that atomic.
    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, slug } });
      await tx.membership.create({
        data: { userId: user.id, organizationId: org.id, role: "OWNER" }
      });
      return org;
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
