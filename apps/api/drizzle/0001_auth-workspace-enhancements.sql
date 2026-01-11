ALTER TABLE "magic_link_tokens" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD COLUMN "is_register" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "icon" varchar(50) DEFAULT '📁' NOT NULL;