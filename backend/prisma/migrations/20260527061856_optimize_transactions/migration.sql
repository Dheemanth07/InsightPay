/*
  Warnings:

  - The values [ADD,SEND,RECEIVE,QR] on the enum `Transaction_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropForeignKey
ALTER TABLE `category` DROP FOREIGN KEY `Category_userId_fkey`;

-- AlterTable
ALTER TABLE `category` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `method` ENUM('MANUAL', 'QR_CODE', 'SYSTEM') NOT NULL DEFAULT 'MANUAL',
    MODIFY `type` ENUM('DEPOSIT', 'TRANSFER', 'WITHDRAWAL') NOT NULL;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
