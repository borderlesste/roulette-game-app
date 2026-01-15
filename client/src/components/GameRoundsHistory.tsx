import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useGameSocket } from '@/hooks/useGameSocket';
import { Loader2 } from 'lucide-react';

interface GameRound {
  id: number;
  winnerId: number;
  winnerName: string;
  prizeAmount: number;
  potAtTime: number;
  createdAt: Date;
}

export default function GameRoundsHistory() {
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useGameSocket();
  const historyQuery = trpc.spin.getHistory.useQuery({ limit: 10, offset: 0 });

  useEffect(() => {
    if (historyQuery.data) {
      setRounds(historyQuery.data.rounds);
      setIsLoading(false);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (!socket) return;

    // Escuchar actualizaciones de rondas completadas
    socket.on('spin-result', (result) => {
      const newRound: GameRound = {
        id: Date.now(),
        winnerId: result.winnerId,
        winnerName: result.winnerName,
        prizeAmount: result.prize,
        potAtTime: result.newPot,
        createdAt: new Date(),
      };

      // Añadir a la parte superior de la lista
      setRounds((prev) => [newRound, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.off('spin-result');
    };
  }, [socket]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">📊 Últimas Rondas</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rounds.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay rondas completadas aún</p>
        ) : (
          rounds.map((round, index) => (
            <div
              key={round.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  #{index + 1} - {round.winnerName}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(round.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">R$ {round.prizeAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-600">Pozo: R$ {round.potAtTime.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
