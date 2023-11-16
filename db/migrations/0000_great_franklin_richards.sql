DROP TABLE IF EXISTS tv_shows;
CREATE TABLE `tv_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_id` integer NOT NULL,
	`user_id` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `id_user_idx` ON `tv_shows` (`show_id`,`user_id`);