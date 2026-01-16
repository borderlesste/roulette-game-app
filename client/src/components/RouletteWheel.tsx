import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface RoulettePlayer {
  id: number;
  name: string;
  entryAmount: number;
}

interface RouletteWheelProps {
  players: RoulettePlayer[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinFinish: (winnerIndex: number) => void;
  pot: number;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  players,
  isSpinning,
  onSpinStart,
  onSpinFinish,
  pot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);

  // Dibujar la ruleta
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || players.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Limpiar canvas con fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colores vibrantes para los segmentos
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B88B', '#ABEBC6'
    ];

    // Dibujar segmentos
    const sliceAngle = (360 / players.length) * (Math.PI / 180);

    players.forEach((player, index) => {
      // Calcular ángulo de inicio considerando la rotación actual
      const baseAngle = (index * 360) / players.length;
      const startAngle = (baseAngle * Math.PI / 180) + (rotation * Math.PI / 180);
      const endAngle = startAngle + sliceAngle;

      // Dibujar segmento
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Borde externo oscuro
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dibujar nombre del jugador (más grande y visible)
      const textAngle = startAngle + sliceAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      
      // Fondo blanco para el texto
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-35, -12, 70, 35);
      
      // Nombre
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, 0, -3);
      
      // Monto de entrada
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`R$ ${player.entryAmount}`, 0, 12);
      
      ctx.restore();
    });

    // Dibujar círculo central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#333333';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Texto central
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RULETA', centerX, centerY - 12);
    
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`R$ ${pot}`, centerX, centerY + 15);

    // Dibujar indicador (triángulo rojo en la parte superior)
    ctx.beginPath();
    ctx.moveTo(centerX, 5);
    ctx.lineTo(centerX - 18, 28);
    ctx.lineTo(centerX + 18, 28);
    ctx.closePath();
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [players, rotation, pot]);

  const handleSpinClick = () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para girar');
      return;
    }

    if (isAnimating || isSpinning) return;

    setIsAnimating(true);
    setSelectedWinner(null);
    onSpinStart();

    // Seleccionar un ganador aleatorio
    const randomWinner = Math.floor(Math.random() * players.length);

    // CORRECCIÓN: Calcular rotación correctamente
    // El indicador está en la parte superior (0 grados)
    // Queremos que el ganador esté en la parte superior al final
    // Cada segmento ocupa 360/players.length grados
    const segmentAngle = 360 / players.length;
    
    // El ganador está en la posición: randomWinner * segmentAngle
    // Para que esté en la parte superior (indicador), necesitamos rotar:
    // targetRotation = (randomWinner * segmentAngle) + múltiples vueltas
    const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7 vueltas completas
    const randomOffset = Math.random() * 0.3; // Pequeña variación para que sea más realista
    const targetRotation = (randomWinner * segmentAngle) + (360 * fullRotations) + randomOffset;
    
    const duration = 4000 + Math.random() * 2000; // 4-6 segundos
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: comienza rápido, desacelera hacia el final (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const newRotation = startRotation + (targetRotation - startRotation) * easeOut;
      
      // Normalizar rotación a 0-360 para evitar números muy grandes
      const normalizedRotation = newRotation % 360;
      setRotation(normalizedRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Asegurar que la rotación final sea exacta
        const finalRotation = targetRotation % 360;
        setRotation(finalRotation);
        setIsAnimating(false);
        setSelectedWinner(randomWinner);
        onSpinFinish(randomWinner);
      }
    };

    requestAnimationFrame(animate);
  };

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border border-border">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Esperando jugadores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-card rounded-lg border border-border">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Ruleta del Juego</h2>
        <p className="text-lg text-muted-foreground">
          Pozo Total: <span className="font-bold text-green-600">R$ {pot}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">Jugadores: {players.length}/10</p>
      </div>

      <div className="relative w-full max-w-md aspect-square">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full border-4 border-border rounded-full shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? 'none' : 'transform 0.3s ease',
          }}
        />
      </div>

      {selectedWinner !== null && (
        <div className="text-center bg-green-50 border-2 border-green-500 rounded-lg p-4 w-full max-w-xs animate-pulse">
          <p className="text-sm text-green-700 font-semibold">¡GANADOR!</p>
          <p className="text-2xl font-bold text-green-900">{players[selectedWinner].name}</p>
          <p className="text-sm text-green-700 mt-2">Entrada: R$ {players[selectedWinner].entryAmount}</p>
        </div>
      )}

      <Button
        onClick={handleSpinClick}
        disabled={isAnimating || isSpinning || players.length < 2}
        size="lg"
        className="w-full max-w-xs"
      >
        {isAnimating || isSpinning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Girando...
          </>
        ) : (
          'Girar Ruleta'
        )}
      </Button>

      {players.length < 2 && (
        <p className="text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded">
          Se necesitan al menos 2 jugadores para girar
        </p>
      )}

      {/* Lista de jugadores activos */}
      <div className="w-full mt-4 pt-4 border-t border-border">
        <h3 className="font-semibold mb-3 text-sm">Jugadores Activos:</h3>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`p-2 rounded text-sm border ${
                selectedWinner === index
                  ? 'bg-green-100 border-green-500 font-semibold'
                  : 'bg-muted border-border'
              }`}
            >
              <div className="font-semibold">{index + 1}. {player.name}</div>
              <div className="text-muted-foreground text-xs">R$ {player.entryAmount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
