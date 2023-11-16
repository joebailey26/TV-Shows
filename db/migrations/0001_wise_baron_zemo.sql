ALTER TABLE tv_shows ADD `user_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `id_user_idx` ON `tv_shows` (`id`,`user_id`);