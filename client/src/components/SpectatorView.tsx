import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useGameSocket } from '@/hooks/useGameSocket';
import { Loader2, Send, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SpectatorView() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useGameSocket();

  const spectatorsQuery = trpc.spectator.getConnectedSpectators.useQuery();
  const messagesQuery = trpc.spectator.getSpectatorMessages.useQuery({ limit: 50 });
  const sendMessageMutation = trpc.spectator.sendSpectatorMessage.useMutation();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('El mensaje no puede estar vacío');
      return;
    }

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({ message });
      setMessage('');
      messagesQuery.refetch();

      // Emitir evento a Socket.IO
      if (socket) {
        socket.emit('spectator-message', { message });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Espectadores Conectados */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold">Espectadores Conectados</h3>
        </div>
        {spectatorsQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {spectatorsQuery.data?.spectators.map((spectator) => (
              <span
                key={spectator.id}
                className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm"
              >
                👁️ {spectator.userName || 'Anonymous'}
              </span>
            ))}
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              Total: {spectatorsQuery.data?.count || 0}
            </span>
          </div>
        )}
      </Card>

      {/* Chat de Espectadores */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">💬 Chat de Espectadores</h3>

        {/* Mensajes */}
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-3 space-y-2">
          {messagesQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : messagesQuery.data && messagesQuery.data.messages.length > 0 ? (
            messagesQuery.data.messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-semibold text-blue-600">{msg.userName}:</span>
                <span className="text-gray-700 ml-2">{msg.message}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm py-8">
              No hay mensajes aún. ¡Sé el primero en escribir!
            </p>
          )}
        </div>

        {/* Input de Mensaje */}
        <div className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Información de Espectador */}
      <Card className="p-4 bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">💡 Tip:</span> Como espectador, puedes ver la ruleta en vivo y chatear con otros
          espectadores. ¡Únete a la cola cuando estés listo para jugar!
        </p>
      </Card>
    </div>
  );
}
