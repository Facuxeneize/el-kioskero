ALTER TABLE `sales`
  ADD COLUMN `idempotency_key` VARCHAR(100) NULL,
  ADD UNIQUE INDEX `sales_idempotency_key_key` (`idempotency_key`);
