CREATE TABLE `activePlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryAmount` int NOT NULL,
	`position` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activePlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`winnerId` int NOT NULL,
	`winnerEntryAmount` int NOT NULL,
	`prizeAmount` int NOT NULL,
	`potAtTime` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('WAITING_FOR_PLAYERS','READY_TO_SPIN','SPINNING','FINISHED') NOT NULL DEFAULT 'WAITING_FOR_PLAYERS',
	`pot` int NOT NULL DEFAULT 0,
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameState_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','entry_fee','prize_won','withdrawal') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `balance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('inactive','waiting','playing') DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gamesPlayed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalWinnings` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `activePlayers` ADD CONSTRAINT `activePlayers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gameRounds` ADD CONSTRAINT `gameRounds_winnerId_users_id_fk` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gameState` ADD CONSTRAINT `gameState_winnerId_users_id_fk` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;