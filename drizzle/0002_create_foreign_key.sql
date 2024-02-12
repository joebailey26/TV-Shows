-- You must make an endpoint request to /api/manuallySyncShows before running this migration
-- as we need to populate the episodateTvShows table

CREATE TABLE new_tv_shows (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    `showId` INTEGER NOT NULL,
    `userId` TEXT NOT NULL,
    `latestWatchedEpisodeId` INTEGER,
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`showId`) REFERENCES `episodateTvShows`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Step 2: Copy data from the old table to the new table
INSERT INTO new_tv_shows (`id`, `showId`, `userId`, `latestWatchedEpisodeId`)
SELECT `id`, `showId`, `userId`, `latestWatchedEpisodeId` FROM `tv_shows`;

-- Step 3: Drop the old table
DROP TABLE `tv_shows`;

-- Step 4: Rename the new table to the original name
ALTER TABLE `new_tv_shows` RENAME TO `tv_shows`;