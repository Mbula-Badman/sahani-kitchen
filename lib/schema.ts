import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleValues = ["ADMIN", "EMPLOYEE", "CLIENT"] as const;
export const orderStatusValues = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;
export const serviceTypeValues = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;

export const UserRole = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
  CLIENT: "CLIENT",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type OrderStatus = (typeof orderStatusValues)[number];
export type ServiceType = (typeof serviceTypeValues)[number];

const userRoleEnum = pgEnum("UserRole", userRoleValues);
const orderStatusEnum = pgEnum("OrderStatus", orderStatusValues);
const serviceTypeEnum = pgEnum("ServiceType", serviceTypeValues);

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    passwordHash: text("passwordHash").notNull(),
    role: userRoleEnum("role").notNull().default("CLIENT"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("User_email_key").on(table.email),
    index("User_role_createdAt_idx").on(table.role, table.createdAt),
  ],
);

export const menuItems = pgTable(
  "MenuItem",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    image: text("image").notNull(),
    available: boolean("available").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("MenuItem_slug_key").on(table.slug),
    index("MenuItem_category_available_idx").on(table.category, table.available),
  ],
);

export const orders = pgTable(
  "Order",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("PLACED"),
    serviceType: serviceTypeEnum("serviceType").notNull(),
    notes: text("notes"),
    total: integer("total").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("Order_status_createdAt_idx").on(table.status, table.createdAt),
    index("Order_userId_createdAt_idx").on(table.userId, table.createdAt),
  ],
);

export const orderItems = pgTable(
  "OrderItem",
  {
    id: text("id").primaryKey(),
    orderId: text("orderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: text("menuItemId").references(() => menuItems.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    unitPrice: integer("unitPrice").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [index("OrderItem_orderId_idx").on(table.orderId)],
);

export const ratings = pgTable(
  "Rating",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    comment: text("comment"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("Rating_published_createdAt_idx").on(table.published, table.createdAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  ratings: many(ratings),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));
