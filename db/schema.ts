import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const urls = pgTable(
  "urls",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    shortCode: varchar("short_code", { length: 7 }).notNull().unique(),
    originalUrl: text("original_url").notNull(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shortCodeIdx: index("urls_short_code_idx").on(table.shortCode),
    userIdIdx: index("urls_user_id_idx").on(table.userId),
  }),
);

export const clicks = pgTable(
  "clicks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    urlId: integer("url_id")
      .notNull()
      .references(() => urls.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    urlIdIdx: index("clicks_url_id_idx").on(table.urlId),
    createdAtIdx: index("clicks_created_at_idx").on(table.createdAt),
  }),
);
