// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  numeric,
} from "drizzle-orm/pg-core";

// Table 1: knowledge_items — core entity for captured knowledge
export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sourceType: text("source_type").notNull(), // "text_paste" (Phase 1) | "audio_transcription" (Phase 2 forward-compat)
  sourceContent: text("source_content"), // original pasted text or transcription
  title: text("title").notNull(),
  content: text("content").notNull(), // 100-200 char summary, optimal for FSRS
  source: text("source"), // URL or title of original article (optional)
  domain: text("domain").notNull(), // e.g. "React", "Marketing"
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
