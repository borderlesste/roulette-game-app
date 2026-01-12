import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const ENTRY_AMOUNTS = ['5', '10', '15', '20'] as const;

interface JoinQueueFormProps {
  balance: number;
  userStatus: string;
  onJoinSuccess: () => void;
}

export const JoinQueueForm: React.FC<JoinQueueFormProps> = ({
  balance,
  userStatus,
  onJoinSuccess,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<typeof ENTRY_AMOUNTS[number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const joinQueueMutation = trpc.game.joinQueue.useMutation({
    onSuccess: () => {
      toast.success('Te has unido a la cola');
      setSelectedAmount(null);
      onJoinSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al unirse a la cola');
    },
  });

  const handleJoin = async () => {
    if (!selectedAmount) {
      toast.error('Selecciona una cantidad');
      return;
    }

    const amount = parseInt(selectedAmount);
    if (balance < amount) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsLoading(true);
    try {
      await joinQueueMutation.mutateAsync({ entryAmount: selectedAmount });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = userStatus !== 'inactive' || isLoading;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <LogIn className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Unirse a la Ruleta</h3>
      </div>

      {userStatus !== 'inactive' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            {userStatus === 'waiting' ? 'Ya estás en la cola de espera' : 'Ya estás jugando'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold mb-3">Selecciona tu entrada:</p>
          <div className="grid grid-cols-2 gap-2">
            {ENTRY_AMOUNTS.map((amount) => {
              const maxWin = parseInt(amount) * 3;
              const isAffordable = balance >= parseInt(amount);

              return (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  disabled={isDisabled || !isAffordable}
                  className={`p-3 rounded-lg border-2 transition ${
                    selectedAmount === amount
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!isAffordable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-bold text-lg">R$ {amount}</p>
                  <p className="text-xs text-muted-foreground">Gana hasta R$ {maxWin}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleJoin}
          disabled={isDisabled || !selectedAmount}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uniéndose...
            </>
          ) : (
            'Unirse a la Cola'
          )}
        </Button>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Nota:</span> El premio depende del pozo total y tu entrada.
          </p>
        </div>
      </div>
    </Card>
  );
};
