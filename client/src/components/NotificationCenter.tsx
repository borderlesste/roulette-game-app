import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useTranslations } from '@/hooks/useTranslations';

export default function NotificationCenter() {
  const { socket } = useGameSocket();
  const { t } = useTranslations();

  useEffect(() => {
    if (!socket) return;

    // Notificación cuando alguien gana
    socket.on('spin-result', (result) => {
      const message = `${result.winnerName} ${t('notifications.won')} R$ ${result.prize.toFixed(2)}`;
      toast.success(message, {
        duration: 5000,
        description: t('notifications.congratulations'),
      });

      // Reproducir sonido si está disponible
      playNotificationSound();
    });

    // Notificación cuando alguien entra a la ruleta
    socket.on('player-joined-game', (data) => {
      const message = `${data.playerName} ${t('notifications.joined_game')}`;
      toast.info(message, {
        duration: 3000,
      });
    });

    // Notificación cuando alguien se une a la cola
    socket.on('player-joined-queue', (data) => {
      const message = `${data.playerName} ${t('notifications.joined_queue')}`;
      toast.info(message, {
        duration: 3000,
      });
    });

    // Notificación de error
    socket.on('game-error', (error) => {
      toast.error(error.message || t('notifications.error_occurred'), {
        duration: 5000,
      });
    });

    // Actualización de estado del juego
    socket.on('game-state-update', (state) => {
      if (state.status === 'WAITING_FOR_PLAYERS') {
        toast.info(t('notifications.waiting_for_players'), {
          duration: 2000,
        });
      }
    });

    return () => {
      socket.off('spin-result');
      socket.off('player-joined-game');
      socket.off('player-joined-queue');
      socket.off('game-error');
      socket.off('game-state-update');
    };
  }, [socket, t]);

  return null;
}

/**
 * Reproduce un sonido de notificación
 */
function playNotificationSound() {
  try {
    // Crear un contexto de audio simple
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar sonido (frecuencia y duración)
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    // Silenciar errores si el navegador no soporta Web Audio API
    console.debug('Audio notification not available:', error);
  }
}
