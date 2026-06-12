-- CreateTable
CREATE TABLE `SplitRequest` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` INTEGER NOT NULL,
    `requesterId` INTEGER NOT NULL,
    `payerId` INTEGER NOT NULL,
    `amountOwed` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SplitRequest_transactionId_idx`(`transactionId`),
    INDEX `SplitRequest_requesterId_idx`(`requesterId`),
    INDEX `SplitRequest_payerId_idx`(`payerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SplitRequest` ADD CONSTRAINT `SplitRequest_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SplitRequest` ADD CONSTRAINT `SplitRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SplitRequest` ADD CONSTRAINT `SplitRequest_payerId_fkey` FOREIGN KEY (`payerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
