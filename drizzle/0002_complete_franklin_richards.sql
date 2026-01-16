CREATE TABLE `bonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('welcome_bonus','streak_bonus','hourly_multiplier','referral_bonus') NOT NULL,
	`amount` int NOT NULL,
	`multiplier` int NOT NULL DEFAULT 1,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spectatorMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spectatorMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spectators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`socketId` varchar(64) NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`disconnectedAt` timestamp,
	CONSTRAINT `spectators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userDailyStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`gamesWon` int NOT NULL DEFAULT 0,
	`totalWinnings` int NOT NULL DEFAULT 0,
	`totalLosses` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userDailyStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bonuses` ADD CONSTRAINT `bonuses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `spectatorMessages` ADD CONSTRAINT `spectatorMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `spectators` ADD CONSTRAINT `spectators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userDailyStats` ADD CONSTRAINT `userDailyStats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;