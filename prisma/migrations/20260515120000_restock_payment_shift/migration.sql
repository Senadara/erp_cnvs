-- Stok: trackable + counting_basis
ALTER TABLE `stock_items` ADD COLUMN `trackable` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `stock_items` ADD COLUMN `counting_basis` VARCHAR(191) NOT NULL DEFAULT 'BIJI';

-- Transaksi: status bayar + paid_at; metode nullable untuk belum bayar
ALTER TABLE `transactions` ADD COLUMN `payment_status` VARCHAR(191) NOT NULL DEFAULT 'PAID';
ALTER TABLE `transactions` ADD COLUMN `paid_at` DATETIME(3) NULL;
ALTER TABLE `transactions` MODIFY `payment_method` VARCHAR(191) NULL;

UPDATE `transactions` SET `paid_at` = `createdAt` WHERE `payment_status` = 'PAID' AND `paid_at` IS NULL;

CREATE INDEX `transactions_outlet_id_payment_status_createdAt_idx` ON `transactions`(`outlet_id`, `payment_status`, `createdAt`);

-- Riwayat restok
CREATE TABLE `restock_logs` (
    `id` VARCHAR(191) NOT NULL,
    `outlet_id` VARCHAR(191) NOT NULL,
    `stock_item_id` VARCHAR(191) NOT NULL,
    `qty_added` DECIMAL(65, 30) NOT NULL,
    `stock_before` DECIMAL(65, 30) NOT NULL,
    `stock_after` DECIMAL(65, 30) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `restock_logs_outlet_id_createdAt_idx`(`outlet_id`, `createdAt`),
    INDEX `restock_logs_stock_item_id_createdAt_idx`(`stock_item_id`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `restock_logs` ADD CONSTRAINT `restock_logs_outlet_id_fkey` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `restock_logs` ADD CONSTRAINT `restock_logs_stock_item_id_fkey` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
