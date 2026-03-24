// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  numeric,
  boolean,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { sql, SQL } from "drizzle-orm";
import { vector } from "drizzle-orm/pg-core";

// Custom type for tsvector (Drizzle doesn't have native support)
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Table 1: knowledge_items — core entity for captured knowledge
export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sourceType: text("source_type").notNull(), // "text_paste" | "audio_transcription"
    sourceContent: text("source_content"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    source: text("source"),
    domain: text("domain").notNull(),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Phase 3: Full-text search vector (D-03, D-05)
    // Title weight A, Tags weight A, Content weight B, Source weight C
    searchVector: tsvector("search_vector")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('chinese', coalesce(${knowledgeItems.title}, '')), 'A') ||
              setweight(to_tsvector('chinese', coalesce(array_to_string(${knowledgeItems.tags}, ' '), '')), 'A') ||
              setweight(to_tsvector('chinese', coalesce(${knowledgeItems.content}, '')), 'B') ||
              setweight(to_tsvector('chinese', coalesce(${knowledgeItems.source}, '')), 'C')`
      ),

    // Phase 4: Semantic search vector (D-03 pre-migration)
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    // GIN index for full-text search (D-03)
    index("knowledge_items_search_idx")
      .using("gin", table.searchVector),

    // HNSW index for vector similarity (Phase 4)
    index("knowledge_items_embedding_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

// Table 2: review_state — FSRS scheduling state per knowledge item (1:1)
// CRITICAL: All FSRS fields must be here from Phase 1 to avoid Phase 2 migration debt
export const reviewState = pgTable("review_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  knowledgeItemId: uuid("knowledge_item_id").notNull().unique(),
  stability: real("stability").notNull().default(0),
  difficulty: real("difficulty").notNull().default(0),
  retrievability: real("retrievability").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table 3: transcriptions — audio transcription jobs (Phase 2 forward-compat; no feature activated in Phase 1)
export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  audioUrl: text("audio_url").notNull(),
  text: text("text"),
  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  language: text("language"),
  durationSeconds: integer("duration_seconds"),
  costMinutes: integer("cost_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Table 4: payments — PayPal payment records
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  paypalOrderId: text("paypal_order_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // pending | completed | failed | refunded
  paymentType: text("payment_type").notNull(), // onetime | subscription
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table 5: subscriptions — PayPal subscription records
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  paypalSubscriptionId: text("paypal_subscription_id").notNull(),
  paypalPlanId: text("paypal_plan_id").notNull(),
  status: text("status").notNull(), // active | cancelled | expired | suspended
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Table 6: user_preferences — notification and user settings (D-01, D-02)
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),

  // Notification settings (D-01, D-02)
  emailNotificationsEnabled: boolean("email_notifications_enabled")
    .notNull()
    .default(true),
  dailyReminderTime: text("daily_reminder_time")
    .notNull()
    .default("09:00"), // HH:mm format, per D-01
  reminderTimezone: text("reminder_timezone")
    .notNull()
    .default("Asia/Shanghai"),

  // Domain filters (D-02: empty array = all domains)
  includedDomains: text("included_domains")
    .array()
    .notNull()
    .default([]),

  // Search settings (D-12)
  saveSearchHistory: boolean("save_search_history")
    .notNull()
    .default(true),

  // User profile (D-09)
  displayName: text("display_name"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Export types for new tables
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
