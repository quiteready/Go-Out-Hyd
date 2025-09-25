import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

// Users table - for application user data (references auth.users.id)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // References auth.users.id from Supabase
    email: text("email").notNull().unique(), // Synced from auth.users
    full_name: text("full_name"),

    // Metadata
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Stripe integration fields - only essential data for querying Stripe
    stripe_customer_id: text("stripe_customer_id"),

    // Role-based access control
    role: text("role", {
      enum: ["member", "admin"],
    })
      .default("member")
      .notNull(),
  },
  (t) => [
    // Add index for role-based queries
    index("role_idx").on(t.role),
  ],
);

// TypeScript types
export type User = InferSelectModel<typeof users>;
export type UpdateUser = Partial<User>;

// Role-related types
export type UserRole = "member" | "admin";
export type AdminUser = User & { role: "admin" };
