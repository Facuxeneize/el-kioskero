CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `users_email_key` (`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `refresh_tokens_token_hash_key` (`token_hash`),
  INDEX `refresh_tokens_user_id_idx` (`user_id`),
  INDEX `refresh_tokens_expires_at_idx` (`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL,
  `barcode` VARCHAR(64) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `description` VARCHAR(500) NULL,
  `sale_price` DECIMAL(12,2) NOT NULL,
  `current_stock` INTEGER NOT NULL DEFAULT 0,
  `minimum_stock` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `products_barcode_key` (`barcode`),
  INDEX `products_name_idx` (`name`),
  INDEX `products_is_active_idx` (`is_active`),
  CONSTRAINT `products_values_check` CHECK (`sale_price` >= 0 AND `current_stock` >= 0 AND `minimum_stock` >= 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sales` (
  `id` CHAR(36) NOT NULL,
  `sale_number` BIGINT NOT NULL AUTO_INCREMENT,
  `total` DECIMAL(12,2) NOT NULL,
  `total_units` INTEGER NOT NULL,
  `status` ENUM('COMPLETED', 'VOIDED') NOT NULL DEFAULT 'COMPLETED',
  `created_by` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `voided_at` DATETIME(3) NULL,
  UNIQUE INDEX `sales_sale_number_key` (`sale_number`),
  INDEX `sales_created_at_idx` (`created_at`),
  INDEX `sales_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sale_items` (
  `id` CHAR(36) NOT NULL,
  `sale_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(160) NOT NULL,
  `barcode` VARCHAR(64) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `sale_items_sale_id_idx` (`sale_id`),
  INDEX `sale_items_product_id_idx` (`product_id`),
  CONSTRAINT `sale_items_values_check` CHECK (`quantity` > 0 AND `unit_price` >= 0 AND `subtotal` >= 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `movement_type` ENUM('IN', 'SALE', 'ADJUSTMENT', 'SALE_VOID') NOT NULL,
  `quantity_delta` INTEGER NOT NULL,
  `stock_before` INTEGER NOT NULL,
  `stock_after` INTEGER NOT NULL,
  `reference_type` ENUM('SALE', 'MANUAL') NULL,
  `reference_id` CHAR(36) NULL,
  `notes` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `stock_movements_product_id_idx` (`product_id`),
  INDEX `stock_movements_created_at_idx` (`created_at`),
  INDEX `stock_movements_product_id_created_at_idx` (`product_id`, `created_at`),
  INDEX `stock_movements_reference_type_reference_id_idx` (`reference_type`, `reference_id`),
  CONSTRAINT `stock_movement_values_check` CHECK (`stock_before` >= 0 AND `stock_after` >= 0 AND `stock_after` = `stock_before` + `quantity_delta`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sales` ADD CONSTRAINT `sales_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
