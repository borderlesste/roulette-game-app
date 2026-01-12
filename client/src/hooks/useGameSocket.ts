import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameState {
  gameState: {
    id: number;
    status: 'WAITING_FOR_PLAYERS' | 'READY_TO_SPIN' | 'SPINNING' | 'FINISHED';
    pot: number;
    winnerId: number | null;
  };
  activePlayers: Array<{
    id: number;
    userId: number;
    entryAmount: number;
    position: number;
    userName: string;
  }>;
  nextInQueue: {
    userId: number;
    entryAmount: number;
    userName: string;
  } | null;
  queueLength: number;
}

export interface SpinResult {
  winner: {
    id: number;
    name: string;
    prize: number;
  };
  newPlayer: {
    id: number;
    name: string;
    entryAmount: number;
  } | null;
  newPot: number;
}

export function useGameSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinner, setLastWinner] = useState<SpinResult | null>(null);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Conexión establecida
    newSocket.on('connect', () => {
      console.log('[Socket] Conectado al servidor');
      setIsConnected(true);
      newSocket.emit('request-game-state');
    });

    // Actualización del estado del juego
    newSocket.on('game-state-update', (data: GameState) => {
      console.log('[Socket] Actualización del estado:', data);
      setGameState(data);
    });

    // Inicio de animación de giro
    newSocket.on('spin-animation-start', () => {
      console.log('[Socket] Ruleta comienza a girar');
      setIsSpinning(true);
    });

    // Resultado del giro
    newSocket.on('spin-result', (data: SpinResult) => {
      console.log('[Socket] Resultado del giro:', data);
      setLastWinner(data);
      setIsSpinning(false);
    });

    // Actualización de la cola
    newSocket.on('queue-updated', (data: { queueLength: number; nextInQueue: any }) => {
      console.log('[Socket] Cola actualizada:', data);
      setGameState((prev) => ({
        ...prev!,
        queueLength: data.queueLength,
        nextInQueue: data.nextInQueue,
      }));
    });

    // Error
    newSocket.on('error', (error: any) => {
      console.error('[Socket] Error:', error);
    });

    // Desconexión
    newSocket.on('disconnect', () => {
      console.log('[Socket] Desconectado del servidor');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const requestGameState = useCallback(() => {
    if (socket) {
      socket.emit('request-game-state');
    }
  }, [socket]);

  const startSpin = useCallback(() => {
    if (socket) {
      socket.emit('spin-started');
    }
  }, [socket]);

  const finishSpin = useCallback(() => {
    if (socket) {
      socket.emit('spin-finished');
    }
  }, [socket]);

  const notifyPlayerJoinedQueue = useCallback(() => {
    if (socket) {
      socket.emit('player-joined-queue');
    }
  }, [socket]);

  const requestQueueUpdate = useCallback(() => {
    if (socket) {
      socket.emit('request-queue-update');
    }
  }, [socket]);

  return {
    socket,
    gameState,
    isConnected,
    isSpinning,
    lastWinner,
    requestGameState,
    startSpin,
    finishSpin,
    notifyPlayerJoinedQueue,
    requestQueueUpdate,
  };
}
