ALTER TABLE "interview_invite" ADD COLUMN "url_token" text;--> statement-breakpoint
ALTER TABLE "interview_invite" ADD CONSTRAINT "interview_invite_url_token_unique" UNIQUE("url_token");