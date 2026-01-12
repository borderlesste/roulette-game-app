import Queue from 'bull';
import Redis from 'redis';

// Configuración de Redis - usar URL si está disponible, sino configuración por defecto
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;

// Cliente de Redis para operaciones generales
export const redisClient = Redis.createClient({
  url: redisUrl,
});

// Cola de espera para jugadores que quieren entrar a la ruleta
export const waitingQueue = new Queue('waiting-queue', redisUrl);

// Interfaz para un trabajo en la cola
export interface WaitingQueueJob {
  userId: number;
  entryAmount: number; // Cantidad que pagó para entrar (5, 10, 15, 20)
  timestamp: number;
}

/**
 * Añade un jugador a la cola de espera
 */
export async function addToQueue(userId: number, entryAmount: number) {
  const job = await waitingQueue.add(
    {
      userId,
      entryAmount,
      timestamp: Date.now(),
    } as WaitingQueueJob,
    {
      attempts: 3, // Reintentar hasta 3 veces si falla
      backoff: {
        type: 'exponential',
        delay: 2000, // Esperar 2 segundos entre reintentos
      },
      removeOnComplete: true, // Eliminar el trabajo una vez completado
    }
  );

  return job;
}

/**
 * Obtiene el siguiente jugador en la cola sin removerlo
 */
export async function peekNextInQueue() {
  const jobs = await waitingQueue.getJobs(['waiting'], 0, 0);
  return jobs.length > 0 ? (jobs[0].data as WaitingQueueJob) : null;
}

/**
 * Obtiene el siguiente jugador en la cola y lo remueve
 */
export async function getNextFromQueue() {
  const job = await waitingQueue.getNextJob();
  if (job) {
    await job.remove();
    return job.data as WaitingQueueJob;
  }
  return null;
}

/**
 * Obtiene el número de jugadores esperando en la cola
 */
export async function getQueueLength() {
  return await waitingQueue.count();
}

/**
 * Limpia la cola (útil para testing o reset)
 */
export async function clearQueue() {
  await waitingQueue.clean(0, 'completed');
  await waitingQueue.clean(0, 'failed');
  await waitingQueue.clean(0, 'active');
}

/**
 * Obtiene los primeros N jugadores en la cola sin removerlos
 */
export async function peekQueue(limit = 10) {
  const jobs = await waitingQueue.getJobs(['waiting'], 0, limit - 1);
  return jobs.map((job) => job.data as WaitingQueueJob);
}
