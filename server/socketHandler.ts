import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getDb } from './db';
import { getActivePlayersWithDetails, getNextQueuePreview, processGameRound } from './gameEngine';
import { getQueueLength } from './queue';
import { gameState } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export let io: SocketIOServer | null = null;

/**
 * Inicializa Socket.IO en el servidor HTTP
 */
export function initializeSocketIO(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware para logging
  io.use((socket, next) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
    next();
  });

  // Manejadores de conexión
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Usuario conectado: ${socket.id}`);

    // Unirse a la sala del juego
    socket.join('game-room');

    // Enviar estado actual al cliente
    socket.on('request-game-state', async () => {
      try {
        const db = await getDb();
        if (!db) return;

        const state = await db.select().from(gameState).limit(1);
        const activePlayers = await getActivePlayersWithDetails();
        const nextInQueue = await getNextQueuePreview();
        const queueLength = await getQueueLength();

        socket.emit('game-state-update', {
          gameState: state[0],
          activePlayers,
          nextInQueue,
          queueLength,
        });
      } catch (error) {
        console.error('[Socket.IO] Error al obtener estado del juego:', error);
      }
    });

    // Evento: Ruleta comienza a girar
    socket.on('spin-started', async () => {
      try {
        const db = await getDb();
        if (!db) return;

        // Actualizar estado a SPINNING
        const state = await db.select().from(gameState).limit(1);
        if (state[0]) {
          await db.update(gameState)
            .set({ status: 'SPINNING' })
            .where(eq(gameState.id, state[0].id));
        }

        // Emitir a todos los clientes
        io?.to('game-room').emit('spin-animation-start', {
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[Socket.IO] Error al iniciar giro:', error);
      }
    });

    // Evento: Ruleta termina de girar
    socket.on('spin-finished', async () => {
      try {
        const result = await processGameRound();

        // Emitir resultado a todos los clientes
        io?.to('game-room').emit('spin-result', {
          winner: result.winner,
          newPlayer: result.newPlayer,
          newPot: result.newPot,
          timestamp: Date.now(),
        });

        // Enviar estado actualizado
        const db = await getDb();
        if (db) {
          const state = await db.select().from(gameState).limit(1);
          const activePlayers = await getActivePlayersWithDetails();
          const nextInQueue = await getNextQueuePreview();
          const queueLength = await getQueueLength();

          io?.to('game-room').emit('game-state-update', {
            gameState: state[0],
            activePlayers,
            nextInQueue,
            queueLength,
          });
        }
      } catch (error) {
        console.error('[Socket.IO] Error al procesar resultado:', error);
        socket.emit('error', { message: 'Error al procesar el resultado' });
      }
    });

    // Evento: Usuario se une a la cola
    socket.on('player-joined-queue', async () => {
      try {
        const queueLength = await getQueueLength();
        const nextInQueue = await getNextQueuePreview();

        io?.to('game-room').emit('queue-updated', {
          queueLength,
          nextInQueue,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[Socket.IO] Error al actualizar cola:', error);
      }
    });

    // Evento: Solicitar actualización de cola
    socket.on('request-queue-update', async () => {
      try {
        const queueLength = await getQueueLength();
        const nextInQueue = await getNextQueuePreview();

        socket.emit('queue-updated', {
          queueLength,
          nextInQueue,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[Socket.IO] Error al obtener cola:', error);
      }
    });

    // Evento: Desconexión
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Usuario desconectado: ${socket.id}`);
    });

    // Evento: Error
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Error del cliente ${socket.id}:`, error);
    });
  });

  return io;
}

/**
 * Emite un evento a todos los clientes en la sala del juego
 */
export function broadcastToGameRoom(event: string, data: any) {
  if (io) {
    io.to('game-room').emit(event, data);
  }
}

/**
 * Emite un evento a un cliente específico
 */
export function emitToSocket(socketId: string, event: string, data: any) {
  if (io) {
    io.to(socketId).emit(event, data);
  }
}

/**
 * Obtiene el número de clientes conectados
 */
export function getConnectedClientsCount(): number {
  return io?.engine.clientsCount || 0;
}
