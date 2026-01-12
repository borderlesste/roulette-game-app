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
    const radius = Math.min(centerX, centerY) - 10;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Colores para los segmentos
    const colors = ['#3b82f6', '#1e40af', '#1e3a8a', '#0c4a6e', '#0369a1', '#0284c7'];

    // Dibujar segmentos
    const sliceAngle = (360 / players.length) * (Math.PI / 180);

    players.forEach((player, index) => {
      const startAngle = (index * 360) / players.length * (Math.PI / 180) + (rotation * Math.PI / 180);
      const endAngle = startAngle + sliceAngle;

      // Dibujar segmento
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dibujar texto
      const textAngle = startAngle + sliceAngle / 2;
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7);

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, 0, 0);
      ctx.fillText(`R$ ${player.entryAmount}`, 0, 15);
      ctx.restore();
    });

    // Dibujar círculo central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dibujar indicador en la parte superior
    ctx.beginPath();
    ctx.moveTo(centerX - 15, 10);
    ctx.lineTo(centerX + 15, 10);
    ctx.lineTo(centerX, 30);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }, [players, rotation]);

  const handleSpinClick = () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para girar');
      return;
    }

    if (isAnimating || isSpinning) return;

    setIsAnimating(true);
    onSpinStart();

    // Seleccionar un ganador aleatorio
    const randomWinner = Math.floor(Math.random() * players.length);
    setSelectedWinner(randomWinner);

    // Calcular rotación para que el ganador quede en la parte superior
    const targetRotation = (randomWinner * 360) / players.length + 360 * 5;
    const duration = 3000 + Math.random() * 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function para desaceleración
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setRotation(targetRotation * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        onSpinFinish(randomWinner);
      }
    };

    requestAnimationFrame(animate);
  };

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground mb-4">Esperando jugadores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-card rounded-lg border border-border">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Ruleta del Juego</h2>
        <p className="text-lg text-muted-foreground">
          Pozo Total: <span className="font-bold text-primary">R$ {pot}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">Jugadores: {players.length}/10</p>
      </div>

      <div className="relative w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full border-4 border-border rounded-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? 'none' : 'transform 0.3s ease',
          }}
        />
      </div>

      {selectedWinner !== null && (
        <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-xs">
          <p className="text-sm text-green-700 font-semibold">Ganador!</p>
          <p className="text-lg font-bold text-green-900">{players[selectedWinner].name}</p>
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
    </div>
  );
};
