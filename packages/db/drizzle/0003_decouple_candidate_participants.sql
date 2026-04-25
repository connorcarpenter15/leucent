CREATE TYPE "public"."participant_identity_mode" AS ENUM('guest', 'registered');--> statement-breakpoint
CREATE TYPE "public"."participant_auth_method" AS ENUM('session', 'magic_link', 'otp');--> statement-breakpoint
CREATE TABLE "candidate_profile" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"headline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text,
	"display_name" text,
	"identity_mode" "participant_identity_mode" NOT NULL,
	"auth_method" "participant_auth_method" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"upgraded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "interview_participant_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_invite" ADD COLUMN "recipient_name" text;--> statement-breakpoint
ALTER TABLE "interview_invite" ADD COLUMN "recipient_email" text;--> statement-breakpoint
ALTER TABLE "interview_invite" ADD COLUMN "max_uses" integer;--> statement-breakpoint
ALTER TABLE "interview_invite" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
UPDATE "interview_invite" AS invite
SET
	"recipient_name" = interview."candidate_name",
	"recipient_email" = interview."candidate_email"
FROM "interview"
WHERE invite."interview_id" = interview."id";--> statement-breakpoint
ALTER TABLE "candidate_profile" ADD CONSTRAINT "candidate_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_participant" ADD CONSTRAINT "interview_participant_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_participant" ADD CONSTRAINT "interview_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_participant_session" ADD CONSTRAINT "interview_participant_session_participant_id_interview_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."interview_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participant_interview_idx" ON "interview_participant" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "participant_user_idx" ON "interview_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "participant_email_idx" ON "interview_participant" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "participant_interview_user_unique_idx" ON "interview_participant" USING btree ("interview_id","user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "participant_interview_guest_email_unique_idx" ON "interview_participant" USING btree ("interview_id", lower("email")) WHERE "user_id" IS NULL AND "email" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "participant_session_participant_idx" ON "interview_participant_session" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participant_session_token_hash_idx" ON "interview_participant_session" USING btree ("session_token_hash");
