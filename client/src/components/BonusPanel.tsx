import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Loader2, Gift, Zap, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function BonusPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const bonusesQuery = trpc.bonus.getActiveBonuses.useQuery();
  const welcomeBonusMutation = trpc.bonus.applyWelcomeBonus.useMutation();
  const hourlyMultiplierMutation = trpc.bonus.applyHourlyMultiplier.useMutation();

  const handleWelcomeBonus = async () => {
    setIsLoading(true);
    try {
      const result = await welcomeBonusMutation.mutateAsync();
      toast.success(`¡Bono de bienvenida aplicado! +R$ ${result.bonusAmount}`);
      bonusesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aplicar bono');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHourlyMultiplier = async () => {
    setIsLoading(true);
    try {
      const result = await hourlyMultiplierMutation.mutateAsync();
      toast.success(`¡Happy Hour activado! ${result.multiplier}x por 1 hora`);
      bonusesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al activar happy hour');
    } finally {
      setIsLoading(false);
    }
  };

  if (bonusesQuery.isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bonificaciones Activas */}
      {bonusesQuery.data && bonusesQuery.data.bonuses.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-lg font-bold mb-4">🎁 Bonificaciones Activas</h3>
          <div className="space-y-2">
            {bonusesQuery.data.bonuses.map((bonus) => (
              <div key={bonus.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  {bonus.type === 'welcome_bonus' && <Gift className="w-5 h-5 text-green-500" />}
                  {bonus.type === 'hourly_multiplier' && <Zap className="w-5 h-5 text-yellow-500" />}
                  {bonus.type === 'streak_bonus' && <Flame className="w-5 h-5 text-red-500" />}
                  <div>
                    <p className="font-semibold text-sm">{bonus.description}</p>
                    {bonus.multiplier > 1 && (
                      <p className="text-xs text-gray-600">{bonus.multiplier}x multiplicador</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {bonus.amount > 0 && (
                    <p className="font-bold text-green-600">+R$ {bonus.amount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              Multiplicador Total: {bonusesQuery.data.totalMultiplier}x
            </p>
            {bonusesQuery.data.totalBonus > 0 && (
              <p className="text-sm text-blue-800">
                Bono Total: R$ {bonusesQuery.data.totalBonus}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Bonos Disponibles */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">🎉 Bonos Disponibles</h3>
        <div className="space-y-3">
          <div className="p-4 border-2 border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-green-700">Bono de Bienvenida</p>
                <p className="text-sm text-gray-600 mt-1">Recibe R$ 100 al registrarte</p>
              </div>
              <Button
                onClick={handleWelcomeBonus}
                disabled={isLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reclamar'}
              </Button>
            </div>
          </div>

          <div className="p-4 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-yellow-700">Happy Hour (2x)</p>
                <p className="text-sm text-gray-600 mt-1">Disponible 12-13h y 20-21h</p>
              </div>
              <Button
                onClick={handleHourlyMultiplier}
                disabled={isLoading}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar'}
              </Button>
            </div>
          </div>

          <div className="p-4 border-2 border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-red-700">Bono por Racha</p>
                <p className="text-sm text-gray-600 mt-1">Gana R$ 5 por cada victoria en racha</p>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                Automático
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
