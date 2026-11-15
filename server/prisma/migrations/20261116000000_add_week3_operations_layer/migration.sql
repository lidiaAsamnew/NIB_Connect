CREATE TABLE `startup_profiles` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `businessName` VARCHAR(160) NOT NULL,
    `sector` VARCHAR(120) NOT NULL,
    `region` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `startup_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `supplier_profiles` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `companyName` VARCHAR(160) NOT NULL,
    `tinNumber` VARCHAR(40) NOT NULL,
    `discountRate` DECIMAL(5, 2) NOT NULL,
    `bankAccountNumber` VARCHAR(64) NOT NULL,
    `address` TEXT NULL,
    `contactPerson` VARCHAR(120) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` CHAR(36) NULL,
    `verificationRemarks` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `supplier_profiles_userId_key`(`userId`),
    UNIQUE INDEX `supplier_profiles_tinNumber_key`(`tinNumber`),
    INDEX `supplier_profiles_isVerified_createdAt_idx`(`isVerified`, `createdAt`),
    INDEX `supplier_profiles_verifiedById_idx`(`verifiedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `products` (
    `id` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `stockQuantity` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `products_supplierId_isActive_idx`(`supplierId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vouchers`
    MODIFY `status` ENUM(
        'ACTIVE',
        'REDEEMED',
        'EXPIRED',
        'ALLOCATED',
        'COMMITTED_TO_ORDER',
        'REDEEMED_AND_SETTLED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `startupId` CHAR(36) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD INDEX `vouchers_startupId_status_idx`(`startupId`, `status`);

CREATE TABLE `orders` (
    `id` CHAR(36) NOT NULL,
    `startupId` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NOT NULL,
    `voucherId` CHAR(36) NULL,
    `grossAmount` DECIMAL(12, 2) NOT NULL,
    `discountApplied` DECIMAL(12, 2) NOT NULL,
    `netAmountToPay` DECIMAL(12, 2) NOT NULL,
    `status` ENUM(
        'PLACED',
        'DISPATCHED_IN_TRANSIT',
        'DELIVERED_PENDING_HANDSHAKE',
        'VERIFIED_AND_CLEARED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PLACED',
    `waybillCode` VARCHAR(191) NULL,
    `otpSecureHash` VARCHAR(191) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `dispatchedAt` DATETIME(3) NULL,
    `arrivedAt` DATETIME(3) NULL,
    `clearedAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `orders_voucherId_key`(`voucherId`),
    UNIQUE INDEX `orders_waybillCode_key`(`waybillCode`),
    INDEX `orders_startupId_idx`(`startupId`),
    INDEX `orders_supplierId_idx`(`supplierId`),
    INDEX `orders_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `productId` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `lineTotal` DECIMAL(12, 2) NOT NULL,
    INDEX `order_items_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `delivery_handshakes` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `submittedByUserId` CHAR(36) NULL,
    `phoneNumber` VARCHAR(16) NULL,
    `otpHash` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `success` BOOLEAN NOT NULL,
    `message` VARCHAR(191) NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `delivery_handshakes_orderId_attemptedAt_idx`(`orderId`, `attemptedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `escrow_transactions` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `voucherId` CHAR(36) NULL,
    `direction` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `escrow_transactions_reference_key`(`reference`),
    INDEX `escrow_transactions_orderId_createdAt_idx`(`orderId`, `createdAt`),
    INDEX `escrow_transactions_voucherId_idx`(`voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(255) NULL,
    `relatedEntityId` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `notifications_userId_type_relatedEntityId_key`(`userId`, `type`, `relatedEntityId`),
    INDEX `notifications_userId_isRead_createdAt_idx`(`userId`, `isRead`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `startup_profiles`
    ADD CONSTRAINT `startup_profiles_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `supplier_profiles`
    ADD CONSTRAINT `supplier_profiles_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `supplier_profiles_verifiedById_fkey`
    FOREIGN KEY (`verifiedById`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `products`
    ADD CONSTRAINT `products_supplierId_fkey`
    FOREIGN KEY (`supplierId`) REFERENCES `supplier_profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `vouchers`
    ADD CONSTRAINT `vouchers_startupId_fkey`
    FOREIGN KEY (`startupId`) REFERENCES `startup_profiles`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `orders`
    ADD CONSTRAINT `orders_startupId_fkey`
    FOREIGN KEY (`startupId`) REFERENCES `startup_profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `orders_supplierId_fkey`
    FOREIGN KEY (`supplierId`) REFERENCES `supplier_profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `orders_voucherId_fkey`
    FOREIGN KEY (`voucherId`) REFERENCES `vouchers`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `order_items`
    ADD CONSTRAINT `order_items_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `order_items_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `delivery_handshakes`
    ADD CONSTRAINT `delivery_handshakes_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `delivery_handshakes_submittedByUserId_fkey`
    FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `escrow_transactions`
    ADD CONSTRAINT `escrow_transactions_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `escrow_transactions_voucherId_fkey`
    FOREIGN KEY (`voucherId`) REFERENCES `vouchers`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `notifications`
    ADD CONSTRAINT `notifications_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
