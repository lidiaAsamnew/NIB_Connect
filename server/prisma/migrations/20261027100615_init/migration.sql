-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `fullName` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `phoneNumber` VARCHAR(16) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('EU_COMPLIANCE_OFFICER', 'NIB_SYSTEM_OPERATOR', 'TIER1_SUPPLIER', 'WOMEN_STARTUP_OWNER') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
