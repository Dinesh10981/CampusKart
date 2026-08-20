CREATE TABLE `verification_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`college_email` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_notes` text DEFAULT '' NOT NULL,
	`reviewed_by` text,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_requests_user_unique` ON `verification_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_requests_status_idx` ON `verification_requests` (`status`);