ALTER TABLE `users` ADD COLUMN `username` VARCHAR(60) NULL;

UPDATE `users`
SET `username` = CONCAT('user_', LEFT(REPLACE(`id`, '-', ''), 12))
WHERE `username` IS NULL;

ALTER TABLE `users` MODIFY `username` VARCHAR(60) NOT NULL;

CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);
