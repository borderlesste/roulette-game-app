import React from 'react';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export interface ActivePlayer {
  id: number;
  userId: number;
  entryAmount: number;
  position: number;
  userName: string;
}

interface ActivePlayersListProps {
  players: ActivePlayer[];
  maxPlayers?: number;
}

export const ActivePlayersList: React.FC<ActivePlayersListProps> = ({
  players,
  maxPlayers = 10,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Jugadores Activos</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {players.length}/{maxPlayers}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay jugadores activos</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div>
                <p className="font-semibold text-sm">{player.userName}</p>
                <p className="text-xs text-muted-foreground">Posicion {player.position + 1}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">R$ {player.entryAmount}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {players.length < maxPlayers && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            Esperando {maxPlayers - players.length} jugador(es) mas para llenar la ruleta
          </p>
        </div>
      )}
    </Card>
  );
};
