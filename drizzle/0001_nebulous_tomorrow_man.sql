CREATE TABLE IF NOT EXISTS `episodateTvShows` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`episodateData` text NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/
-- Step 1: Create a new table with an additional foreign key
