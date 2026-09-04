ALTER TABLE `products` ADD COLUMN `owner_id` CHAR(36) NULL;

UPDATE `products` p
SET `owner_id` = COALESCE(
  (SELECT MIN(sm.`user_id`) FROM `stock_movements` sm WHERE sm.`product_id` = p.`id`),
  (SELECT MIN(s.`created_by`) FROM `sale_items` si INNER JOIN `sales` s ON s.`id` = si.`sale_id` WHERE si.`product_id` = p.`id`),
  (SELECT MIN(u.`id`) FROM `users` u)
);

ALTER TABLE `products` MODIFY COLUMN `owner_id` CHAR(36) NOT NULL;
ALTER TABLE `products` DROP INDEX `products_barcode_key`;
CREATE UNIQUE INDEX `products_owner_id_barcode_key` ON `products` (`owner_id`, `barcode`);
CREATE INDEX `products_owner_id_idx` ON `products` (`owner_id`);
ALTER TABLE `products` ADD CONSTRAINT `products_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `sales` DROP INDEX `sales_idempotency_key_key`;
CREATE UNIQUE INDEX `sales_created_by_idempotency_key_key` ON `sales` (`created_by`, `idempotency_key`);
CREATE INDEX `sales_created_by_created_at_idx` ON `sales` (`created_by`, `created_at`);
