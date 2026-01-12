import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface BalanceCardProps {
  balance: number;
  onBalanceUpdate: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, onBalanceUpdate }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const depositMutation = trpc.game.deposit.useMutation({
    onSuccess: () => {
      toast.success('Depósito realizado exitosamente');
      setDepositAmount('');
      onBalanceUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al realizar el depósito');
    },
  });

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setIsLoading(true);
    try {
      await depositMutation.mutateAsync({ amount });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Mi Saldo</h3>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Saldo Disponible</p>
        <p className="text-3xl font-bold text-blue-600">R$ {balance}</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Cantidad a depositar"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            disabled={isLoading}
            min="1"
            max="10000"
          />
          <Button
            onClick={handleDeposit}
            disabled={isLoading || !depositAmount}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Depositar
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Depósitos sugeridos:</p>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => setDepositAmount(amount.toString())}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                disabled={isLoading}
              >
                R$ {amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
