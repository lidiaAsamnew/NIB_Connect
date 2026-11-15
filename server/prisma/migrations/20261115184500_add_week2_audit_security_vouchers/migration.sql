CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NULL,
    `action` VARCHAR(64) NOT NULL,
    `entityType` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `audit_logs_action_createdAt_idx`(`action`, `createdAt`),
    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `audit_logs_actorId_fkey`
      FOREIGN KEY (`actorId`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `security_events` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `eventType` VARCHAR(64) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `security_events_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `security_events_eventType_createdAt_idx`(`eventType`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `security_events_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `vouchers` (
    `id` CHAR(36) NOT NULL,
    `recipientUserId` CHAR(36) NOT NULL,
    `allocatedByUserId` CHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'REDEEMED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vouchers_recipientUserId_createdAt_idx`(`recipientUserId`, `createdAt`),
    INDEX `vouchers_allocatedByUserId_createdAt_idx`(`allocatedByUserId`, `createdAt`),
    INDEX `vouchers_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `vouchers_recipientUserId_fkey`
      FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `vouchers_allocatedByUserId_fkey`
      FOREIGN KEY (`allocatedByUserId`) REFERENCES `users`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
