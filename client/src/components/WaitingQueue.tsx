import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export interface QueuePlayer {
  userId: number;
  entryAmount: number;
  userName: string;
}

interface WaitingQueueProps {
  players: QueuePlayer[];
  queueLength: number;
}

export const WaitingQueue: React.FC<WaitingQueueProps> = ({ players, queueLength }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Cola de Espera</h3>
        <span className="ml-auto text-sm font-bold text-primary">{queueLength}</span>
      </div>

      {queueLength === 0 ? (
        <p className="text-sm text-muted-foreground">No hay jugadores esperando</p>
      ) : (
        <div className="space-y-2">
          {players.length > 0 ? (
            players.map((player, index) => (
              <div
                key={`${player.userId}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{player.userName}</p>
                    {index === 0 && (
                      <p className="text-xs text-green-600 font-semibold">Siguiente...</p>
                    )}
                  </div>
                </div>
                <p className="font-bold text-primary">R$ {player.entryAmount}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {queueLength} jugador(es) esperando...
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
