CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`listing_id` integer NOT NULL,
	`conversation_id` integer NOT NULL,
	`buyer_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_conversation_unique` ON `orders` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `orders_buyer_idx` ON `orders` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `orders_seller_idx` ON `orders` (`seller_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);