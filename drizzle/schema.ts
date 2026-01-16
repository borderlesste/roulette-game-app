import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // --- Campos del Juego de Ruleta ---
  balance: int("balance").default(0).notNull(), // Saldo en Reales
  status: mysqlEnum("status", ["inactive", "waiting", "playing"]).default("inactive").notNull(), // Estado en el juego
  gamesPlayed: int("gamesPlayed").default(0).notNull(), // Total de juegos jugados
  totalWinnings: int("totalWinnings").default(0).notNull(), // Total de ganancias en Reales
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabla para rastrear el estado actual del juego de ruleta.
 * Siempre habrá un único documento activo que representa la partida en curso.
 */
export const gameState = mysqlTable("gameState", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["WAITING_FOR_PLAYERS", "READY_TO_SPIN", "SPINNING", "FINISHED"]).default("WAITING_FOR_PLAYERS").notNull(),
  pot: int("pot").default(0).notNull(), // Pozo total acumulado en Reales
  winnerId: int("winnerId").references(() => users.id), // ID del ganador de la última ronda
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameState = typeof gameState.$inferSelect;
export type InsertGameState = typeof gameState.$inferInsert;

/**
 * Tabla para rastrear a los jugadores activos en la ruleta (máximo 10).
 */
export const activePlayers = mysqlTable("activePlayers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  entryAmount: int("entryAmount").notNull(), // Cantidad que pagó para entrar (5, 10, 15, 20)
  position: int("position").notNull(), // Posición en la ruleta (0-9)
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ActivePlayer = typeof activePlayers.$inferSelect;
export type InsertActivePlayer = typeof activePlayers.$inferInsert;

/**
 * Tabla para rastrear el historial de rondas completadas.
 */
export const gameRounds = mysqlTable("gameRounds", {
  id: int("id").autoincrement().primaryKey(),
  winnerId: int("winnerId").notNull().references(() => users.id),
  winnerEntryAmount: int("winnerEntryAmount").notNull(), // Cantidad que pagó el ganador
  prizeAmount: int("prizeAmount").notNull(), // Premio que recibió en Reales
  potAtTime: int("potAtTime").notNull(), // Pozo total en el momento del giro
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = typeof gameRounds.$inferInsert;

/**
 * Tabla para auditoría de todas las transacciones de dinero.
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["deposit", "entry_fee", "prize_won", "withdrawal"]).notNull(),
  amount: int("amount").notNull(), // Cantidad en Reales
  description: text("description"), // Descripción de la transacción
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Tabla para rastrear estadísticas diarias de cada usuario.
 */
export const userDailyStats = mysqlTable("userDailyStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  gamesWon: int("gamesWon").default(0).notNull(),
  totalWinnings: int("totalWinnings").default(0).notNull(),
  totalLosses: int("totalLosses").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDailyStats = typeof userDailyStats.$inferSelect;
export type InsertUserDailyStats = typeof userDailyStats.$inferInsert;

/**
 * Tabla para gestionar bonificaciones y promociones.
 */
export const bonuses = mysqlTable("bonuses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["welcome_bonus", "streak_bonus", "hourly_multiplier", "referral_bonus"]).notNull(),
  amount: int("amount").notNull(),
  multiplier: int("multiplier").default(1).notNull(),
  description: text("description"),
  isActive: int("isActive").default(1).notNull(),
  expiresAt: timestamp("expiresAt"),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = typeof bonuses.$inferInsert;

/**
 * Tabla para rastrear espectadores conectados.
 */
export const spectators = mysqlTable("spectators", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  socketId: varchar("socketId", { length: 64 }).notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  disconnectedAt: timestamp("disconnectedAt"),
});

export type Spectator = typeof spectators.$inferSelect;
export type InsertSpectator = typeof spectators.$inferInsert;

/**
 * Tabla para mensajes del chat de espectadores.
 */
export const spectatorMessages = mysqlTable("spectatorMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpectatorMessage = typeof spectatorMessages.$inferSelect;
export type InsertSpectatorMessage = typeof spectatorMessages.$inferInsert;
