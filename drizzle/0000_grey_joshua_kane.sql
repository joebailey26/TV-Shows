CREATE TABLE IF NOT EXISTS `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `episodateTvShows` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`permalink` text,
	`url` text,
	`description` text,
	`description_source` text,
	`start_date` text,
	`end_date` text,
	`country` text,
	`status` text,
	`runtime` integer,
	`network` text,
	`youtube_link` text,
	`image_path` text,
	`image_thumbnail_path` text,
	`rating` text,
	`rating_count` text,
	`genres` text,
	`pictures` text,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season` integer NOT NULL,
	`episode` integer NOT NULL,
	`name` text NOT NULL,
	`air_date` text NOT NULL,
	`episodateTvShowId` integer NOT NULL,
	FOREIGN KEY (`episodateTvShowId`) REFERENCES `episodateTvShows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `showEpisodeIdx` ON `episodes` (`episodateTvShowId`,`season`,`episode`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tv_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`showId` integer NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`showId`) REFERENCES `episodateTvShows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `showUserIdx` ON `tv_shows` (`showId`,`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `watchedEpisodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`episodeId` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episodeId`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `userEpisodeIdx` ON `watchedEpisodes` (`userId`,`episodeId`);