CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"name" varchar(255),
	"is_register" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_verification_codes_email" ON "verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_verification_codes_expires_at" ON "verification_codes" USING btree ("expires_at");