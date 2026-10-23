import "dotenv/config";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/db";
import { menuItems as starterMenu } from "@/lib/restaurant";
import { menuItems, UserRole, users } from "@/lib/schema";

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME?.trim();
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminName || !adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error(
      "Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and a SEED_ADMIN_PASSWORD of at least 12 characters before seeding.",
    );
  }

  const db = getDb();
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });
  if (existingAdmin && existingAdmin.role !== UserRole.ADMIN) {
    throw new Error("The configured seed email already belongs to a non-admin user.");
  }
  if (!existingAdmin) {
    await db.insert(users).values({
      id: randomUUID(),
      name: adminName,
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      role: UserRole.ADMIN,
    });
  }

  for (const item of starterMenu) {
    const existingItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.slug, item.id),
      columns: { id: true },
    });
    if (!existingItem) {
      await db.insert(menuItems).values({
        id: randomUUID(),
        slug: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        image: item.image,
        available: item.available ?? true,
        featured: item.featured ?? false,
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
