UPDATE `Card`
SET
    `issuerBank` = UPPER(`brand`),
    `brand` = CASE
        WHEN UPPER(`brand`) = 'SBI' THEN 'RuPay'
        WHEN UPPER(`brand`) = 'ICICI' THEN 'Mastercard'
        ELSE 'Visa'
    END
WHERE UPPER(`brand`) IN ('HDFC', 'SBI', 'ICICI', 'AXIS');
