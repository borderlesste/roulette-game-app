import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function StatsChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const statsQuery = trpc.stats.getUserStats.useQuery();
  const comparisonQuery = trpc.stats.getComparisonStats.useQuery();

  useEffect(() => {
    if (statsQuery.data) {
      const data = statsQuery.data.stats.map((stat) => ({
        date: stat.date,
        gamesWon: stat.gamesWon,
        gamesPlayed: stat.gamesPlayed,
        winnings: stat.totalWinnings,
        losses: stat.totalLosses,
      }));
      setChartData(data);
      setIsLoading(false);
    }
  }, [statsQuery.data]);

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
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">📊 Tus Estadísticas (Últimos 30 días)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Juegos Jugados</p>
            <p className="text-2xl font-bold text-blue-600">{statsQuery.data?.totals.gamesPlayed}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Juegos Ganados</p>
            <p className="text-2xl font-bold text-green-600">{statsQuery.data?.totals.gamesWon}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Tasa de Victoria</p>
            <p className="text-2xl font-bold text-purple-600">{statsQuery.data?.totals.winRate}%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Ganancias Totales</p>
            <p className="text-2xl font-bold text-yellow-600">R$ {statsQuery.data?.totals.totalWinnings}</p>
          </div>
        </div>
      </Card>

      {/* Gráfico de Ganancias */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">💰 Ganancias Diarias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="winnings" stroke="#10b981" name="Ganancias (R$)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Juegos */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">🎮 Juegos Ganados vs Perdidos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="gamesWon" fill="#10b981" name="Ganados" />
            <Bar dataKey="gamesPlayed" fill="#ef4444" name="Totales" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparación con Promedio */}
      {comparisonQuery.data && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">📈 Comparación con Promedio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Tus Ganancias</p>
              <p className="text-2xl font-bold">R$ {comparisonQuery.data.userStats.totalWinnings}</p>
              <p className="text-xs text-gray-500">Promedio: R$ {comparisonQuery.data.averageWinnings}</p>
              <p className="text-sm font-semibold text-blue-600 mt-2">
                {comparisonQuery.data.comparisonPercentage.winnings}% del promedio
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-sm text-gray-600">Tus Juegos Jugados</p>
              <p className="text-2xl font-bold">{comparisonQuery.data.userStats.gamesPlayed}</p>
              <p className="text-xs text-gray-500">Promedio: {comparisonQuery.data.averageGamesPlayed}</p>
              <p className="text-sm font-semibold text-purple-600 mt-2">
                {comparisonQuery.data.comparisonPercentage.gamesPlayed}% del promedio
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
