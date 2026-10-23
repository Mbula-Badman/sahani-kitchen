"use server";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireRole, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  menuItems,
  orderItems,
  orders,
  orderStatusValues,
  ratings,
  serviceTypeValues,
  UserRole,
  users,
} from "@/lib/schema";
import { menuCategories } from "@/lib/restaurant";

const passwordSchema = z.string().min(12, "Use at least 12 characters.");
const emailSchema = z.email("Enter a valid email address.").transform((value) => value.toLowerCase());

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function registerAction(formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      email: emailSchema,
      phone: z.string().trim().max(30).optional(),
      password: passwordSchema,
    })
    .safeParse({
      name: field(formData, "name"),
      email: field(formData, "email"),
      phone: field(formData, "phone"),
      password: String(formData.get("password") ?? ""),
    });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check your details.")}`);
  }

  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { id: true },
  });
  if (existing) redirect("/register?error=An%20account%20may%20already%20exist%20for%20that%20email.");

  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hash(parsed.data.password, 12),
      role: UserRole.CLIENT,
    })
    .returning({ id: users.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = emailSchema.safeParse(field(formData, "email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success || !password) {
    redirect("/login?error=Enter%20your%20email%20and%20password.");
  }

  const user = await getDb().query.users.findFirst({
    where: eq(users.email, email.data),
    columns: { id: true, passwordHash: true },
  });
  if (!user || !(await compare(password, user.passwordHash))) {
    redirect("/login?error=Email%20or%20password%20is%20incorrect.");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireRole(UserRole.CLIENT);
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().trim().max(30),
    })
    .safeParse({
      name: field(formData, "name"),
      phone: field(formData, "phone"),
    });
  if (!parsed.success) redirect("/dashboard?error=Please%20check%20your%20profile%20details.");

  await getDb()
    .update(users)
    .set({ name: parsed.data.name, phone: parsed.data.phone || null })
    .where(eq(users.id, user.id));
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Profile%20updated.");
}

export async function placeOrderAction(formData: FormData) {
  const user = await requireRole(UserRole.CLIENT);
  const quantities = formData.getAll("quantity").map((value) => String(value));
  const selections = formData
    .getAll("menuItemId")
    .map((value, index) => ({
      menuItemId: String(value).trim(),
      quantity: quantities[index] ?? "",
    }))
    .filter((selection) => selection.menuItemId);
  const parsed = z
    .object({
      items: z
        .array(
          z.object({
            menuItemId: z.string().min(1),
            quantity: z.coerce.number().int().min(1).max(30),
          }),
        )
        .min(1)
        .max(4),
      serviceType: z.enum(serviceTypeValues),
      notes: z.string().trim().max(500),
    })
    .safeParse({
      items: selections,
      serviceType: field(formData, "serviceType"),
      notes: field(formData, "notes"),
    });
  if (!parsed.success) redirect("/dashboard?error=Please%20check%20your%20order%20details.");

  const uniqueIds = [...new Set(parsed.data.items.map((item) => item.menuItemId))];
  const availableItems = await getDb()
    .select({
      id: menuItems.id,
      name: menuItems.name,
      price: menuItems.price,
      available: menuItems.available,
    })
    .from(menuItems)
    .where(inArray(menuItems.id, uniqueIds));
  if (
    availableItems.length !== uniqueIds.length ||
    availableItems.some((item) => !item.available)
  ) {
    redirect("/dashboard?error=That%20dish%20is%20not%20currently%20available.");
  }

  const itemsById = new Map(availableItems.map((item) => [item.id, item]));
  const orderLines = parsed.data.items.map((selection) => {
    const item = itemsById.get(selection.menuItemId);
    if (!item) throw new Error("The selected menu item was not found.");
    return {
      id: randomUUID(),
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: selection.quantity,
    };
  });
  const orderId = randomUUID();
  const db = getDb();
  await db.transaction(async (transaction) => {
    await transaction.insert(orders).values({
      id: orderId,
      userId: user.id,
      serviceType: parsed.data.serviceType,
      notes: parsed.data.notes || null,
      total: orderLines.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ),
    });
    await transaction.insert(orderItems).values(
      orderLines.map((item) => ({ ...item, orderId })),
    );
  });
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Your%20order%20was%20sent%20to%20the%20restaurant.");
}

export async function submitRatingAction(formData: FormData) {
  const user = await requireRole(UserRole.CLIENT);
  const parsed = z
    .object({
      stars: z.coerce.number().int().min(1).max(5),
      comment: z.string().trim().max(1000),
    })
    .safeParse({
      stars: field(formData, "stars"),
      comment: field(formData, "comment"),
    });
  if (!parsed.success) redirect("/dashboard?error=Choose%20a%20rating%20from%201%20to%205%20stars.");

  await getDb().insert(ratings).values({
    id: randomUUID(),
    userId: user.id,
    stars: parsed.data.stars,
    comment: parsed.data.comment || null,
  });
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Thanks.%20Your%20rating%20is%20awaiting%20review.");
}

export async function createEmployeeAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: field(formData, "name"),
      email: field(formData, "email"),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) redirect("/dashboard?error=Check%20the%20employee%20details.%20Passwords%20need%2012%20characters.");
  const db = getDb();
  if (
    await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
      columns: { id: true },
    })
  ) {
    redirect("/dashboard?error=An%20account%20already%20uses%20that%20email.");
  }

  await db.insert(users).values({
    id: randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hash(parsed.data.password, 12),
    role: UserRole.EMPLOYEE,
  });
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Employee%20account%20created.%20Share%20the%20temporary%20password%20securely.");
}

export async function promoteUserAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = z
    .object({
      email: emailSchema,
      role: z.enum([UserRole.EMPLOYEE, UserRole.ADMIN]),
    })
    .safeParse({
      email: field(formData, "email"),
      role: field(formData, "role"),
    });
  if (!parsed.success) {
    redirect("/dashboard?error=Enter%20a%20valid%20email%20and%20promotion%20role.");
  }

  const db = getDb();
  const account = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { id: true, role: true },
  });
  if (!account) {
    redirect("/dashboard?error=No%20account%20was%20found%20for%20that%20email.");
  }

  const isAllowedPromotion =
    (account.role === UserRole.CLIENT &&
      parsed.data.role === UserRole.EMPLOYEE) ||
    (account.role === UserRole.EMPLOYEE && parsed.data.role === UserRole.ADMIN);
  if (!isAllowedPromotion) {
    redirect("/dashboard?error=That%20account%20cannot%20be%20promoted%20to%20the%20selected%20role.");
  }

  const [updatedAccount] = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(and(eq(users.id, account.id), eq(users.role, account.role)))
    .returning({ id: users.id });
  if (!updatedAccount) {
    redirect("/dashboard?error=The%20account%20role%20changed.%20Refresh%20and%20try%20again.");
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?message=${encodeURIComponent(`Account promoted to ${parsed.data.role}.`)}`);
}

export async function createMenuItemAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      category: z.enum(menuCategories),
      description: z.string().trim().min(5).max(300),
      price: z.coerce.number().int().min(1).max(100000),
      image: z.url().refine((value) => value.startsWith("https://"), "Use a secure HTTPS image URL."),
    })
    .safeParse({
      name: field(formData, "name"),
      category: field(formData, "category"),
      description: field(formData, "description"),
      price: field(formData, "price"),
      image: field(formData, "image"),
    });
  if (!parsed.success) redirect("/dashboard?error=Check%20the%20dish%20details%20and%20image%20URL.");

  const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
  await getDb().insert(menuItems).values({
    id: randomUUID(),
    ...parsed.data,
    slug,
    available: true,
  });
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Menu%20item%20added.");
}

export async function updateMenuItemAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) redirect("/dashboard?error=Only%20an%20admin%20can%20edit%20menu%20details.");
  const parsed = z
    .object({
      id: z.string().min(1),
      name: z.string().trim().min(2).max(100),
      category: z.enum(menuCategories),
      description: z.string().trim().min(5).max(300),
      price: z.coerce.number().int().min(1).max(100000),
      image: z.url().refine((value) => value.startsWith("https://"), "Use a secure HTTPS image URL."),
      featured: z.enum(["true", "false"]),
      available: z.enum(["true", "false"]),
    })
    .safeParse({
      id: field(formData, "id"),
      name: field(formData, "name"),
      category: field(formData, "category"),
      description: field(formData, "description"),
      price: field(formData, "price"),
      image: field(formData, "image"),
      featured: field(formData, "featured"),
      available: field(formData, "available"),
    });
  if (!parsed.success) redirect("/dashboard?error=Check%20the%20menu%20item%20details.");
  const { id, featured, available, ...data } = parsed.data;
  await getDb()
    .update(menuItems)
    .set({ ...data, featured: featured === "true", available: available === "true" })
    .where(eq(menuItems.id, id));
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Menu%20item%20updated.");
}

export async function updateAvailabilityAction(formData: FormData) {
  await requireRole(UserRole.EMPLOYEE, UserRole.ADMIN);
  const parsed = z
    .object({
      id: z.string().min(1),
      available: z.enum(["true", "false"]),
    })
    .safeParse({
      id: field(formData, "id"),
      available: field(formData, "available"),
    });
  if (!parsed.success) redirect("/dashboard?error=Invalid%20availability%20update.");
  await getDb()
    .update(menuItems)
    .set({ available: parsed.data.available === "true" })
    .where(eq(menuItems.id, parsed.data.id));
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Dish%20availability%20updated.");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireRole(UserRole.EMPLOYEE, UserRole.ADMIN);
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(orderStatusValues),
    })
    .safeParse({
      id: field(formData, "id"),
      status: field(formData, "status"),
    });
  if (!parsed.success) redirect("/dashboard?error=Invalid%20order%20status.");

  const order = await getDb().query.orders.findFirst({
    where: eq(orders.id, parsed.data.id),
    columns: { id: true },
  });
  if (!order) redirect("/dashboard?error=Order%20not%20found.");
  await getDb()
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, order.id));
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Order%20status%20updated.");
}

export async function moderateRatingAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = z
    .object({
      id: z.string().min(1),
      published: z.enum(["true", "false"]),
    })
    .safeParse({
      id: field(formData, "id"),
      published: field(formData, "published"),
    });
  if (!parsed.success) redirect("/dashboard?error=Invalid%20rating%20update.");
  await getDb()
    .update(ratings)
    .set({ published: parsed.data.published === "true" })
    .where(eq(ratings.id, parsed.data.id));
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Rating%20moderation%20saved.");
}
