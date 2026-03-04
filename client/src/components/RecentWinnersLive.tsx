import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Trophy, Zap, Clock } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface Winner {
  id: number;
  winnerName: string;
  winnerId: number;
  prizeAmount: number;
  potAtTime: number;
  winnerEntryAmount: number;
  completedAt: Date;
  timeAgo: string;
}

export const RecentWinnersLive: React.FC = () => {
  const { t } = useTranslations();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener últimos ganadores
  const { data: recentWinners, isLoading: isLoadingWinners } = trpc.winners.getRecentWinners.useQuery();

  useEffect(() => {
    if (recentWinners) {
      setWinners(recentWinners as Winner[]);
      setIsLoading(false);
    }
  }, [recentWinners]);

  // Actualizar cada 5 segundos para refrescar el tiempo relativo
  useEffect(() => {
    const interval = setInterval(() => {
      setWinners((prev) =>
        prev.map((winner) => ({
          ...winner,
          timeAgo: getTimeAgo(new Date(winner.completedAt)),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || isLoadingWinners) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('recentWinners')}
        </h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        {t('recentWinners')}
      </h3>

      {winners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('noWinnersYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {winners.map((winner, index) => (
            <div
              key={winner.id}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md scale-105'
                  : 'bg-muted border-border hover:border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Posición y nombre */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="inline-block bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        🏆 #{index + 1}
                      </span>
                    )}
                    {index > 0 && (
                      <span className="inline-block bg-gray-300 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    )}
                    <p className="font-semibold text-foreground truncate">{winner.winnerName}</p>
                  </div>

                  {/* Detalles de entrada y premio */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">Entrada:</span>
                      <span className="font-semibold text-foreground">R$ {winner.winnerEntryAmount}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-green-500" />
                      <span className="font-semibold text-green-600">R$ {winner.prizeAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Tiempo y pozo */}
                <div className="text-right text-sm">
                  <div className="flex items-center justify-end gap-1 text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{winner.timeAgo}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pozo: <span className="font-semibold text-foreground">R$ {winner.potAtTime}</span>
                  </div>
                </div>
              </div>

              {/* Barra de progreso del premio */}
              {index === 0 && (
                <div className="mt-3 h-1 bg-yellow-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"
                    style={{
                      width: `${Math.min((winner.prizeAmount / winner.potAtTime) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pie con información */}
      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        <p>
          💡 {t('winnersHelpText')}
        </p>
      </div>
    </div>
  );
};

/**
 * Calcula el tiempo relativo desde una fecha
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString('es-ES');
}
