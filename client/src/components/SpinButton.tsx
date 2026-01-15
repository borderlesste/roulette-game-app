import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useGameSocket } from '@/hooks/useGameSocket';
import { toast } from 'sonner';

interface SpinButtonProps {
  canSpin: boolean;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (result: any) => void;
}

export default function SpinButton({ canSpin, isSpinning, onSpinStart, onSpinEnd }: SpinButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useGameSocket();
  const spinMutation = trpc.spin.execute.useMutation();

  const handleSpin = async () => {
    if (!canSpin || isLoading || isSpinning) {
      toast.error('No se puede girar la ruleta en este momento');
      return;
    }

    setIsLoading(true);
    onSpinStart();

    try {
      // Emitir evento a Socket.IO
      if (socket) {
        socket.emit('spin-started');
      }

      // Ejecutar mutación del servidor
      const result = await spinMutation.mutateAsync();

      // Emitir resultado a todos los clientes
      if (socket) {
        socket.emit('spin-finished', result);
      }

      // Notificar al componente padre
      onSpinEnd(result);

      // Mostrar notificación
      toast.success(`¡${result.winnerName} ganó R$ ${result.prize}!`);
    } catch (error) {
      console.error('Error durante el giro:', error);
      toast.error(error instanceof Error ? error.message : 'Error al girar la ruleta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSpin}
      disabled={!canSpin || isLoading || isSpinning}
      size="lg"
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6"
    >
      {isLoading || isSpinning ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Girando...
        </>
      ) : canSpin ? (
        '🎡 Girar Ruleta'
      ) : (
        'Esperando jugadores...'
      )}
    </Button>
  );
}
