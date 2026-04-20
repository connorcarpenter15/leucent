CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'live', 'completed', 'expired');--> statement-breakpoint
CREATE TABLE "ai_context_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"source_path" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"contents" text NOT NULL,
	"embedding" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"interviewer_user_id" uuid NOT NULL,
	"candidate_name" text NOT NULL,
	"candidate_email" text NOT NULL,
	"title" text NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"neon_branch_id" text,
	"sandbox_id" text,
	"sandbox_status" text DEFAULT 'not_provisioned' NOT NULL,
	"replay_s3_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"actor" text NOT NULL,
	"payload" jsonb NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_invite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "interviewer_constraint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
-- NOTE: `neon_auth.user` and `neon_auth.organization` are owned by Neon Auth
-- and are provisioned automatically when Auth (+ the Organization plugin) is
-- enabled on the branch. drizzle-kit re-emits CREATE TABLE for them because
-- `tablesFilter` in drizzle.config.ts is an INCLUDE filter (it controls
-- introspection, not generation). We strip those statements by hand so
-- migrate() doesn't conflict with Neon Auth's schema; the FK statements
-- below just point at the already-existing Neon Auth tables. Column types
-- (uuid for id) must stay aligned with Neon Auth's provisioned DDL —
-- packages/db/scripts/inspect-neon-auth.ts prints the live column shapes.
--> statement-breakpoint
ALTER TABLE "ai_context_chunk" ADD CONSTRAINT "ai_context_chunk_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "neon_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_interviewer_user_id_user_id_fk" FOREIGN KEY ("interviewer_user_id") REFERENCES "neon_auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_event" ADD CONSTRAINT "interview_event_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_invite" ADD CONSTRAINT "interview_invite_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviewer_constraint" ADD CONSTRAINT "interviewer_constraint_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviewer_constraint" ADD CONSTRAINT "interviewer_constraint_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "neon_auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_chunk_interview_idx" ON "ai_context_chunk" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "interview_org_idx" ON "interview" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "interview_interviewer_idx" ON "interview" USING btree ("interviewer_user_id");--> statement-breakpoint
CREATE INDEX "interview_status_idx" ON "interview" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_interview_ts_idx" ON "interview_event" USING btree ("interview_id","ts");--> statement-breakpoint
CREATE INDEX "event_kind_idx" ON "interview_event" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "invite_interview_idx" ON "interview_invite" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "constraint_interview_idx" ON "interviewer_constraint" USING btree ("interview_id");