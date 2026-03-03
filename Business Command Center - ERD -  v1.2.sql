CREATE TABLE `Organization` (
  `id` uuid PRIMARY KEY,
  `name` varchar(255),
  `country` varchar(255),
  `currency` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `Branch` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255),
  `city` varchar(255)
);

CREATE TABLE `Location` (
  `id` uuid PRIMARY KEY,
  `branch_id` uuid,
  `name` varchar(255),
  `type` varchar(255)
);

CREATE TABLE `User` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255),
  `email` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `Role` (
  `id` uuid PRIMARY KEY,
  `name` varchar(255)
);

CREATE TABLE `UserRole` (
  `user_id` uuid,
  `role_id` uuid
);

CREATE TABLE `Category` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255)
);

CREATE TABLE `Unit` (
  `id` uuid PRIMARY KEY,
  `name` varchar(255)
);

CREATE TABLE `Product` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `category_id` uuid,
  `unit_id` uuid,
  `name` varchar(255),
  `sku` varchar(255),
  `barcode` varchar(255),
  `price` decimal,
  `cost` decimal,
  `low_stock_threshold` int,
  `active` boolean
);

CREATE TABLE `ProductVariant` (
  `id` uuid PRIMARY KEY,
  `product_id` uuid,
  `name` varchar(255),
  `sku` varchar(255),
  `barcode` varchar(255),
  `price` decimal,
  `cost` decimal,
  `active` boolean
);

CREATE TABLE `Bundle` (
  `id` uuid PRIMARY KEY,
  `product_id` uuid
);

CREATE TABLE `BundleItem` (
  `bundle_id` uuid,
  `product_id` uuid,
  `quantity` int
);

CREATE TABLE `StockLedger` (
  `id` uuid PRIMARY KEY,
  `product_id` uuid,
  `variant_id` uuid,
  `location_id` uuid,
  `change_qty` int,
  `movement_type` varchar(255),
  `reference_id` uuid,
  `created_at` timestamp
);

CREATE TABLE `Transfer` (
  `id` uuid PRIMARY KEY,
  `from_location_id` uuid,
  `to_location_id` uuid,
  `status` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `TransferItem` (
  `id` uuid PRIMARY KEY,
  `transfer_id` uuid,
  `product_id` uuid,
  `variant_id` uuid,
  `quantity` int
);

CREATE TABLE `Customer` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255),
  `phone` varchar(255),
  `address` varchar(255),
  `credit_balance` decimal,
  `created_at` timestamp
);

CREATE TABLE `CustomerNote` (
  `id` uuid PRIMARY KEY,
  `customer_id` uuid,
  `note` text,
  `created_at` timestamp
);

CREATE TABLE `Supplier` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255),
  `phone` varchar(255),
  `created_at` timestamp
);

CREATE TABLE `PurchaseOrder` (
  `id` uuid PRIMARY KEY,
  `supplier_id` uuid,
  `location_id` uuid,
  `status` varchar(255),
  `expected_date` timestamp,
  `created_at` timestamp
);

CREATE TABLE `PurchaseOrderItem` (
  `id` uuid PRIMARY KEY,
  `purchase_order_id` uuid,
  `product_id` uuid,
  `variant_id` uuid,
  `quantity` int,
  `cost` decimal
);

CREATE TABLE `GoodsReceipt` (
  `id` uuid PRIMARY KEY,
  `purchase_order_id` uuid,
  `received_at` timestamp,
  `note` varchar(255)
);

CREATE TABLE `GoodsReceiptItem` (
  `id` uuid PRIMARY KEY,
  `goods_receipt_id` uuid,
  `purchase_order_item_id` uuid,
  `product_id` uuid,
  `variant_id` uuid,
  `quantity_received` int
);

CREATE TABLE `SupplierPayment` (
  `id` uuid PRIMARY KEY,
  `supplier_id` uuid,
  `amount` decimal,
  `payment_date` timestamp,
  `note` varchar(255)
);

CREATE TABLE `SalesOrder` (
  `id` uuid PRIMARY KEY,
  `customer_id` uuid,
  `location_id` uuid,
  `user_id` uuid,
  `source` varchar(255),
  `status` varchar(255),
  `subtotal` decimal,
  `discount` decimal,
  `tax` decimal,
  `total` decimal,
  `amount_paid` decimal,
  `created_at` timestamp
);

CREATE TABLE `SalesOrderItem` (
  `id` uuid PRIMARY KEY,
  `sales_order_id` uuid,
  `product_id` uuid,
  `variant_id` uuid,
  `quantity` int,
  `price` decimal,
  `discount` decimal,
  `cost` decimal
);

CREATE TABLE `Payment` (
  `id` uuid PRIMARY KEY,
  `sales_order_id` uuid,
  `amount` decimal,
  `method` varchar(255),
  `paid_at` timestamp
);

CREATE TABLE `ReturnReason` (
  `id` uuid PRIMARY KEY,
  `reason` varchar(255)
);

CREATE TABLE `Return` (
  `id` uuid PRIMARY KEY,
  `sales_order_id` uuid,
  `reason_id` uuid,
  `total_refund` decimal,
  `created_at` timestamp
);

CREATE TABLE `ReturnItem` (
  `id` uuid PRIMARY KEY,
  `return_id` uuid,
  `sales_order_item_id` uuid,
  `product_id` uuid,
  `variant_id` uuid,
  `quantity_returned` int,
  `refund_amount` decimal
);

CREATE TABLE `ExpenseCategory` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `name` varchar(255)
);

CREATE TABLE `Expense` (
  `id` uuid PRIMARY KEY,
  `category_id` uuid,
  `location_id` uuid,
  `amount` decimal,
  `date` timestamp,
  `recurring` boolean,
  `note` varchar(255)
);

CREATE TABLE `AuditLog` (
  `id` uuid PRIMARY KEY,
  `organization_id` uuid,
  `user_id` uuid,
  `action` varchar(255),
  `entity` varchar(255),
  `entity_id` uuid,
  `created_at` timestamp
);

ALTER TABLE `Branch` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `Location` ADD FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`);

ALTER TABLE `User` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `UserRole` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);

ALTER TABLE `UserRole` ADD FOREIGN KEY (`role_id`) REFERENCES `Role` (`id`);

ALTER TABLE `Category` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `Product` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `Product` ADD FOREIGN KEY (`category_id`) REFERENCES `Category` (`id`);

ALTER TABLE `Product` ADD FOREIGN KEY (`unit_id`) REFERENCES `Unit` (`id`);

ALTER TABLE `ProductVariant` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `Bundle` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `BundleItem` ADD FOREIGN KEY (`bundle_id`) REFERENCES `Bundle` (`id`);

ALTER TABLE `BundleItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `StockLedger` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `StockLedger` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `StockLedger` ADD FOREIGN KEY (`location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `Transfer` ADD FOREIGN KEY (`from_location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `Transfer` ADD FOREIGN KEY (`to_location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `TransferItem` ADD FOREIGN KEY (`transfer_id`) REFERENCES `Transfer` (`id`);

ALTER TABLE `TransferItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `TransferItem` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `Customer` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `CustomerNote` ADD FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`id`);

ALTER TABLE `Supplier` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `PurchaseOrder` ADD FOREIGN KEY (`supplier_id`) REFERENCES `Supplier` (`id`);

ALTER TABLE `PurchaseOrder` ADD FOREIGN KEY (`location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `PurchaseOrderItem` ADD FOREIGN KEY (`purchase_order_id`) REFERENCES `PurchaseOrder` (`id`);

ALTER TABLE `PurchaseOrderItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `PurchaseOrderItem` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `GoodsReceipt` ADD FOREIGN KEY (`purchase_order_id`) REFERENCES `PurchaseOrder` (`id`);

ALTER TABLE `GoodsReceiptItem` ADD FOREIGN KEY (`goods_receipt_id`) REFERENCES `GoodsReceipt` (`id`);

ALTER TABLE `GoodsReceiptItem` ADD FOREIGN KEY (`purchase_order_item_id`) REFERENCES `PurchaseOrderItem` (`id`);

ALTER TABLE `GoodsReceiptItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `GoodsReceiptItem` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `SupplierPayment` ADD FOREIGN KEY (`supplier_id`) REFERENCES `Supplier` (`id`);

ALTER TABLE `SalesOrder` ADD FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`id`);

ALTER TABLE `SalesOrder` ADD FOREIGN KEY (`location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `SalesOrder` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);

ALTER TABLE `SalesOrderItem` ADD FOREIGN KEY (`sales_order_id`) REFERENCES `SalesOrder` (`id`);

ALTER TABLE `SalesOrderItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `SalesOrderItem` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `Payment` ADD FOREIGN KEY (`sales_order_id`) REFERENCES `SalesOrder` (`id`);

ALTER TABLE `Return` ADD FOREIGN KEY (`sales_order_id`) REFERENCES `SalesOrder` (`id`);

ALTER TABLE `Return` ADD FOREIGN KEY (`reason_id`) REFERENCES `ReturnReason` (`id`);

ALTER TABLE `ReturnItem` ADD FOREIGN KEY (`return_id`) REFERENCES `Return` (`id`);

ALTER TABLE `ReturnItem` ADD FOREIGN KEY (`sales_order_item_id`) REFERENCES `SalesOrderItem` (`id`);

ALTER TABLE `ReturnItem` ADD FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

ALTER TABLE `ReturnItem` ADD FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant` (`id`);

ALTER TABLE `ExpenseCategory` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `Expense` ADD FOREIGN KEY (`category_id`) REFERENCES `ExpenseCategory` (`id`);

ALTER TABLE `Expense` ADD FOREIGN KEY (`location_id`) REFERENCES `Location` (`id`);

ALTER TABLE `AuditLog` ADD FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`);

ALTER TABLE `AuditLog` ADD FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);
