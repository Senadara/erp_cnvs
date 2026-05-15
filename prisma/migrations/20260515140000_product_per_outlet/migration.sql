-- Menu produk per outlet
ALTER TABLE `products` ADD COLUMN `outlet_id` VARCHAR(191) NULL;

UPDATE `products` p
SET p.`outlet_id` = (
  SELECT o.`id` FROM `outlets` o ORDER BY o.`createdAt` ASC LIMIT 1
)
WHERE p.`outlet_id` IS NULL;

ALTER TABLE `products` MODIFY `outlet_id` VARCHAR(191) NOT NULL;
ALTER TABLE `products` ADD CONSTRAINT `products_outlet_id_fkey` FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `products_outlet_id_idx` ON `products`(`outlet_id`);

-- Grup tampilan produk ikut outlet (bukan global)
UPDATE `display_groups` dg
SET dg.`outlet_id` = (
  SELECT o.`id` FROM `outlets` o ORDER BY o.`createdAt` ASC LIMIT 1
)
WHERE dg.`context` = 'PRODUCT' AND dg.`outlet_id` IS NULL;
