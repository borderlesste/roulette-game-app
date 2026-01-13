/**
 * Sistema de cola en memoria para jugadores en espera
 * Esta versión no depende de Redis y funciona completamente en memoria
 */

export interface WaitingQueueJob {
  userId: number;
  entryAmount: number; // Cantidad que pagó para entrar (5, 10, 15, 20)
  timestamp: number;
}

// Cola en memoria
let queue: WaitingQueueJob[] = [];

/**
 * Añade un jugador a la cola de espera
 */
export async function addToQueue(userId: number, entryAmount: number) {
  const job: WaitingQueueJob = {
    userId,
    entryAmount,
    timestamp: Date.now(),
  };

  queue.push(job);
  console.log(`[Queue] Jugador ${userId} añadido a la cola. Tamaño: ${queue.length}`);
  return job;
}

/**
 * Obtiene el siguiente jugador en la cola sin removerlo
 */
export async function peekNextInQueue() {
  return queue.length > 0 ? queue[0] : null;
}

/**
 * Obtiene y remueve el siguiente jugador en la cola (FIFO)
 */
export async function getNextFromQueue() {
  if (queue.length === 0) return null;
  const job = queue.shift();
  console.log(`[Queue] Jugador ${job?.userId} removido de la cola. Tamaño restante: ${queue.length}`);
  return job || null;
}

/**
 * Obtiene los primeros N jugadores en la cola sin removerlos
 */
export async function peekQueue(limit: number = 10) {
  return queue.slice(0, limit);
}

/**
 * Obtiene el tamaño actual de la cola
 */
export async function getQueueLength() {
  return queue.length;
}

/**
 * Limpia la cola (útil para pruebas)
 */
export async function clearQueue() {
  const size = queue.length;
  queue = [];
  console.log(`[Queue] Cola limpiada. Se removieron ${size} jugadores.`);
}

/**
 * Obtiene toda la cola
 */
export async function getAllQueue() {
  return [...queue];
}
