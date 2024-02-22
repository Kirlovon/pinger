CREATE TABLE `urls` (
	`id` integer NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urls_id_unique` ON `urls` (`id`);