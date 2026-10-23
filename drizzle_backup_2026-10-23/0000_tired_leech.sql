CREATE TYPE "public"."OrderStatus" AS ENUM('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ServiceType" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('ADMIN', 'EMPLOYEE', 'CLIENT');--> statement-breakpoint
CREATE TABLE "MenuItem" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"image" text NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"menuItemId" text,
	"name" text NOT NULL,
	"unitPrice" integer NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Order" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"status" "OrderStatus" DEFAULT 'PLACED' NOT NULL,
	"serviceType" "ServiceType" NOT NULL,
	"notes" text,
	"total" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Rating" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"published" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"passwordHash" text NOT NULL,
	"role" "UserRole" DEFAULT 'CLIENT' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_MenuItem_id_fk" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "MenuItem_category_available_idx" ON "MenuItem" USING btree ("category","available");--> statement-breakpoint
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "Order_status_createdAt_idx" ON "Order" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "Order_userId_createdAt_idx" ON "Order" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "Rating_published_createdAt_idx" ON "Rating" USING btree ("published","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_role_createdAt_idx" ON "User" USING btree ("role","createdAt");