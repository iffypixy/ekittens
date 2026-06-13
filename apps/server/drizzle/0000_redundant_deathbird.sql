CREATE TABLE "player_ratings" (
	"user_id" varchar(10) PRIMARY KEY NOT NULL,
	"mu" double precision NOT NULL,
	"sigma" double precision NOT NULL,
	"ordinal" double precision NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker" varchar(10) NOT NULL,
	"blocked" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_blocker_blocked_pk" PRIMARY KEY("blocker","blocked")
);
--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"requester" varchar(10) NOT NULL,
	"recipient" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_requests_requester_recipient_pk" PRIMARY KEY("requester","recipient")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"user_lo" varchar(10) NOT NULL,
	"user_hi" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_user_lo_user_hi_pk" PRIMARY KEY("user_lo","user_hi")
);
--> statement-breakpoint
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
