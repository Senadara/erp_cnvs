-- AlterTable
ALTER TABLE `products` ADD COLUMN `display_group_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stock_items` ADD COLUMN `display_group_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'STAFF', 'MITRA') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `feature_overrides` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_outlets` (
    `userId` VARCHAR(191) NOT NULL,
    `outletId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `outletId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mitra_product_scopes` (
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mitra_stock_scopes` (
    `userId` VARCHAR(191) NOT NULL,
    `stockItemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `stockItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `display_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `context` ENUM('PRODUCT', 'STOCK') NOT NULL,
    `outlet_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `display_groups_context_outlet_id_idx`(`context`, `outlet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_outlets` ADD CONSTRAINT `user_outlets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_outlets` ADD CONSTRAINT `user_outlets_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `outlets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mitra_product_scopes` ADD CONSTRAINT `mitra_product_scopes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mitra_product_scopes` ADD CONSTRAINT `mitra_product_scopes_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mitra_stock_scopes` ADD CONSTRAINT `mitra_stock_scopes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mitra_stock_scopes` ADD CONSTRAINT `mitra_stock_scopes_stockItemId_fkey` FOREIGN KEY (`stockItemId`) REFERENCES `stock_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `display_groups` ADD CONSTRAINT `display_groups_outlet_id_fkey` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_items` ADD CONSTRAINT `stock_items_display_group_id_fkey` FOREIGN KEY (`display_group_id`) REFERENCES `display_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_display_group_id_fkey` FOREIGN KEY (`display_group_id`) REFERENCES `display_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
