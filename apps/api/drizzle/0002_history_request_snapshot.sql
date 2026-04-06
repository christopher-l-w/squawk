ALTER TABLE "request_history" ADD COLUMN "request_headers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "request_history" ADD COLUMN "request_body" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "request_history" ADD COLUMN "error_message" text;