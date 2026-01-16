import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Loader2, Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const [period, setPeriod] = useState<'all_time' | 'last_30_days' | 'today'>('all_time');
  const leaderboardQuery = trpc.stats.getLeaderboard.useQuery({ limit: 10, period });

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'all_time':
        return 'Todos los Tiempos';
      case 'last_30_days':
        return 'Últimos 30 Días';
      case 'today':
        return 'Hoy';
    }
  };

  if (leaderboardQuery.isLoading) {
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">🏆 Ranking de Jugadores</h3>
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('today')}
          >
            Hoy
          </Button>
          <Button
            variant={period === 'last_30_days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('last_30_days')}
          >
            30 Días
          </Button>
          <Button
            variant={period === 'all_time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('all_time')}
          >
            Todos
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">Período: {getPeriodLabel()}</p>

      <div className="space-y-2">
        {leaderboardQuery.data?.leaderboard.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              leaderboardQuery.data?.userRank === index + 1
                ? 'bg-blue-100 border-2 border-blue-500'
                : index < 3
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 flex items-center justify-center">
                {getMedalIcon(index + 1)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {user.name || 'Anonymous'}
                  {leaderboardQuery.data?.userRank === index + 1 && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      Tú
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-600">
                  {user.gamesPlayed} juegos jugados
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">R$ {user.totalWinnings}</p>
            </div>
          </div>
        ))}
      </div>

      {leaderboardQuery.data?.userRank && leaderboardQuery.data.userRank > 10 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-center">
            Tu posición: <span className="font-bold text-blue-600">#{leaderboardQuery.data.userRank}</span>
          </p>
        </div>
      )}
    </Card>
  );
}
