import React, { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { RouletteWheel } from '@/components/RouletteWheel';
import { ActivePlayersList } from '@/components/ActivePlayersList';
import { WaitingQueue } from '@/components/WaitingQueue';
import { BalanceCard } from '@/components/BalanceCard';
import { JoinQueueForm } from '@/components/JoinQueueForm';
import { useGameSocket } from '@/hooks/useGameSocket';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';
import { Loader2, LogOut } from 'lucide-react';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { gameState, isSpinning, startSpin, finishSpin, notifyPlayerJoinedQueue, requestGameState } = useGameSocket();
  const [balance, setBalance] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const statsQuery = trpc.game.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Actualizar stats cuando cambia el usuario
  useEffect(() => {
    if (isAuthenticated && statsQuery.data) {
      setUserStats(statsQuery.data);
      setBalance(statsQuery.data.balance);
    }
  }, [isAuthenticated, statsQuery.data]);

  const handleRefreshStats = async () => {
    setIsLoadingStats(true);
    try {
      await statsQuery.refetch();
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSpinFinish = async (winnerIndex: number) => {
    try {
      await finishSpin();
      await handleRefreshStats();
      toast.success('Ronda completada');
    } catch (error) {
      toast.error('Error al procesar el resultado');
    }
  };

  const handleJoinSuccess = () => {
    notifyPlayerJoinedQueue();
    handleRefreshStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Juego de Ruleta</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Juega, gana y disfruta con amigos
          </p>
        </div>
        <Button size="lg" onClick={() => (window.location.href = getLoginUrl())}>
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ruleta del Juego</h1>
            <p className="text-sm text-muted-foreground">Bienvenido, {user?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ruleta Principal */}
          <div className="lg:col-span-2">
            {gameState ? (
              <RouletteWheel
                players={gameState.activePlayers.map((p) => ({
                  id: p.userId,
                  name: p.userName,
                  entryAmount: p.entryAmount,
                }))}
                isSpinning={isSpinning}
                onSpinStart={startSpin}
                onSpinFinish={handleSpinFinish}
                pot={gameState.gameState.pot}
              />
            ) : (
              <div className="flex items-center justify-center p-8 bg-card rounded-lg border border-border">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance */}
            <BalanceCard balance={balance} onBalanceUpdate={handleRefreshStats} />

            {/* Join Queue Form */}
            <JoinQueueForm
              balance={balance}
              userStatus={userStats?.status || 'inactive'}
              onJoinSuccess={handleJoinSuccess}
            />

            {/* Stats */}
            {userStats && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold mb-3">Mis Estadísticas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juegos Jugados:</span>
                    <span className="font-semibold">{userStats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ganancias Totales:</span>
                    <span className="font-semibold text-green-600">R$ {userStats.totalWinnings}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Jugadores Activos */}
          {gameState && (
            <ActivePlayersList
              players={gameState.activePlayers}
              maxPlayers={10}
            />
          )}

          {/* Cola de Espera */}
          {gameState && (
            <WaitingQueue
              players={gameState.nextInQueue ? [gameState.nextInQueue] : []}
              queueLength={gameState.queueLength}
            />
          )}
        </div>
      </div>
    </div>
  );
}
