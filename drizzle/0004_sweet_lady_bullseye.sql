ALTER TABLE episodateTvShows ADD `url` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `rating_count` text;--> statement-breakpoint
ALTER TABLE episodateTvShows ADD `countdown` integer REFERENCES episodes(id);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/