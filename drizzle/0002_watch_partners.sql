CREATE TABLE `watchPartners` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `userId` text NOT NULL,
  `name` text NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `showWatchPartners` (
  `showId` integer NOT NULL,
  `watchPartnerId` integer NOT NULL,
  FOREIGN KEY (`showId`) REFERENCES `tv_shows`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`watchPartnerId`) REFERENCES `watchPartners`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `showPartnerIdx` ON `showWatchPartners` (`showId`,`watchPartnerId`);
