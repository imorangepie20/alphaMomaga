CREATE TABLE "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"action" varchar(80) NOT NULL,
	"actor_subject" varchar(255) NOT NULL,
	"actor_role" varchar(40) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_subject","created_at");