ALTER TABLE `security_events`
    ADD COLUMN `orderId` CHAR(36) NULL,
    ADD COLUMN `ipAddress` VARCHAR(45) NULL,
    ADD INDEX `security_events_orderId_createdAt_idx`(`orderId`, `createdAt`),
    ADD INDEX `security_events_ipAddress_createdAt_idx`(`ipAddress`, `createdAt`);
