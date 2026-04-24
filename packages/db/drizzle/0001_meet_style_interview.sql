ALTER TABLE "interview" ALTER COLUMN "candidate_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "interview" ALTER COLUMN "candidate_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "interview" ADD COLUMN "sandbox_template" text DEFAULT 'nodejs' NOT NULL;