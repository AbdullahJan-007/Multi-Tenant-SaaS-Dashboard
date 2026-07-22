import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@acme.test" },
    update: {},
    create: { email: "owner@acme.test", name: "Ava Owner", passwordHash }
  });

  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Inc", slug: "acme" }
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, organizationId: org.id, role: "OWNER" }
  });

  await prisma.project.createMany({
    data: [
      { name: "Website Redesign", description: "Q3 marketing site refresh", organizationId: org.id, createdById: owner.id },
      { name: "Billing Migration", description: "Move to usage-based billing", organizationId: org.id, createdById: owner.id }
    ]
  });

  console.log("Seeded: owner@acme.test / password123 (org: acme)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
