import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  gameState,
  activePlayers,
  gameRounds,
  transactions,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import type { InsertTransaction } from '../drizzle/schema';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// --- Funciones para el Juego de Ruleta ---

export async function getGameState() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get game state: database not available");
    return undefined;
  }

  const result = await db.select().from(gameState).limit(1);
  if (result.length === 0) {
    // Crear estado de juego inicial si no existe
    await db.insert(gameState).values({ status: 'WAITING_FOR_PLAYERS', pot: 0 });
    return (await db.select().from(gameState).limit(1))[0];
  }
  return result[0];
}

export async function getActivePlayers() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(activePlayers)
    .innerJoin(users, eq(activePlayers.userId, users.id));
}

export async function createTransaction(
  userId: number,
  type: 'deposit' | 'entry_fee' | 'prize_won' | 'withdrawal',
  amount: number,
  balanceBefore: number,
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const balanceAfter = balanceBefore + (type === 'deposit' || type === 'prize_won' ? amount : -amount);

  await db.insert(transactions).values({
    userId,
    type,
    amount,
    description,
    balanceBefore,
    balanceAfter,
  });

  return balanceAfter;
}

export async function getTransactionHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getGameRoundHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameRounds)
    .innerJoin(users, eq(gameRounds.winnerId, users.id))
    .orderBy(desc(gameRounds.completedAt))
    .limit(limit);
}
