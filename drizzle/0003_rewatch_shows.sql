CREATE TABLE IF NOT EXISTS `tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `tagsSlugIdx` ON `tags` (`slug`);

CREATE TABLE IF NOT EXISTS `showTags` (
  `showId` integer NOT NULL,
  `tagId` integer NOT NULL,
  FOREIGN KEY (`showId`) REFERENCES `tv_shows`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `showTagsIdx` ON `showTags` (`showId`,`tagId`);

INSERT OR IGNORE INTO `tags` (`slug`, `name`) VALUES ('rewatch', 'Rewatch');
