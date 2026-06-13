CREATE TABLE "users" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"handle" varchar(24) NOT NULL,
	"username" varchar(24),
	"password_hash" varchar(255),
	"avatar_url" varchar(512),
	"is_guest" boolean DEFAULT true NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
