DROP TABLE IF EXISTS `tv_shows`;
CREATE TABLE `tv_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_id` integer NOT NULL,
	`user_email` text DEFAULT 'joe@joebailey.xyz' NOT NULL,
  `latest_watched_episode_id` integer
);
CREATE UNIQUE INDEX `show_user_idx` ON `tv_shows` (`show_id`,`user_email`);
INSERT INTO tv_shows (show_id) VALUES (1), (2), (3), (4), (5);
