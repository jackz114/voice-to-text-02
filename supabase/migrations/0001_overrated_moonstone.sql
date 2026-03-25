CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true NOT NULL,
	"daily_reminder_time" text DEFAULT '09:00' NOT NULL,
	"reminder_timezone" text DEFAULT 'Asia/Shanghai' NOT NULL,
	"included_domains" text[] DEFAULT '{}' NOT NULL,
	"save_search_history" boolean DEFAULT true NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('simple', coalesce("knowledge_items"."title", '')), 'A') ||
              setweight(to_tsvector('simple', coalesce(array_to_string("knowledge_items"."tags", ' '), '')), 'A') ||
              setweight(to_tsvector('simple', coalesce("knowledge_items"."content", '')), 'B') ||
              setweight(to_tsvector('simple', coalesce("knowledge_items"."source", '')), 'C')) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "knowledge_items_search_idx" ON "knowledge_items" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "knowledge_items_embedding_idx" ON "knowledge_items" USING hnsw ("embedding" vector_cosine_ops);