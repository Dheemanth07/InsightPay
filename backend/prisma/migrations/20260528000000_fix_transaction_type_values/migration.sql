-- Repair rows that were left with MySQL's empty enum value after the
-- Transaction.type enum was changed from ADD/SEND/RECEIVE/QR.
UPDATE `Transaction`
SET
    `method` = CASE
        WHEN `reference` LIKE 'qr\_%' THEN 'QR_CODE'
        ELSE `method`
    END,
    `type` = CASE
        WHEN `reference` LIKE 'qr\_%' THEN 'TRANSFER'
        WHEN `fromUserId` IS NULL AND `toUserId` IS NOT NULL THEN 'DEPOSIT'
        WHEN `fromUserId` IS NOT NULL AND `toUserId` IS NOT NULL THEN 'TRANSFER'
        WHEN `fromUserId` IS NOT NULL AND `toUserId` IS NULL THEN 'WITHDRAWAL'
        ELSE 'TRANSFER'
    END
WHERE `type` = '';
