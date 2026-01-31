CREATE TABLE "oauth_authorization_codes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code_challenge" varchar(255) NOT NULL,
	"redirect_uri" text NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_oauth_authorization_codes_user_id" ON "oauth_authorization_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_authorization_codes_expires_at" ON "oauth_authorization_codes" USING btree ("expires_at");