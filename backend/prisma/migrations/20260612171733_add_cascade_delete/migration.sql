-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_cardId_fkey`;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
