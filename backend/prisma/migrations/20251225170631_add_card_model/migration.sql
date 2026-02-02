-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `cardToken` VARCHAR(191) NOT NULL,
    `last4` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `expiryMonth` INTEGER NOT NULL,
    `expiryYear` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Card_cardToken_key`(`cardToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex
-- CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);
DROP INDEX `user_email_key` ON `user`;
