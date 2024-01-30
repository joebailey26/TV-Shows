CREATE TABLE `episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seasonId` integer NOT NULL,
	`episode` integer NOT NULL,
	`name` text NOT NULL,
	`air_date` text NOT NULL,
	FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season` integer NOT NULL,
	`episodateTvShowId` integer NOT NULL,
	FOREIGN KEY (`episodateTvShowId`) REFERENCES `episodateTvShows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `watchedEpisodes` (
	`userId` integer NOT NULL,
	`episodeId` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episodeId`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `permalink` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `url` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `description` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `description_source` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `start_date` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `end_date` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `country` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `status` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `runtime` integer;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `network` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `youtube_link` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `image_path` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `image_thumbnail_path` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `rating` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `genres` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `pictures` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `countdown` integer REFERENCES episodes(id);--> statement-breakpoint
CREATE UNIQUE INDEX `episodeSeasonIdx` ON `episodes` (`seasonId`,`episode`);--> statement-breakpoint
CREATE UNIQUE INDEX `userEpisodeIdx` ON `watchedEpisodes` (`userId`,`episodeId`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `episodateTvShows` DROP COLUMN `episodateData`;--> statement-breakpoint
ALTER TABLE `tv_shows` DROP COLUMN `latestWatchedEpisode`;