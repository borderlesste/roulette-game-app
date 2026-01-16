import { describe, it, expect } from 'vitest';

/**
 * Tests para validar la física y lógica de la ruleta
 * Aseguran que el ganador seleccionado se alinea correctamente con el indicador
 */

describe('Roulette Physics and Logic', () => {
  /**
   * Calcula el ángulo de rotación necesario para que un jugador específico
   * quede en el indicador (parte superior)
   */
  function calculateTargetRotation(winnerIndex: number, totalPlayers: number): number {
    const segmentAngle = 360 / totalPlayers;
    const fullRotations = 5; // Número de vueltas completas
    const randomOffset = 0.15; // Pequeña variación
    return (winnerIndex * segmentAngle) + (360 * fullRotations) + randomOffset;
  }

  /**
   * Normaliza la rotación a un rango de 0-360 grados
   */
  function normalizeRotation(rotation: number): number {
    const result = rotation % 360;
    return result < 0 ? result + 360 : result;
  }

  /**
   * Determina qué jugador está en el indicador basado en la rotación
   */
  function getWinnerFromRotation(rotation: number, totalPlayers: number): number {
    const normalizedRotation = normalizeRotation(rotation);
    const segmentAngle = 360 / totalPlayers;
    
    // El indicador está en la parte superior (0 grados)
    // Encontrar qué segmento está en esa posición
    for (let i = 0; i < totalPlayers; i++) {
      const segmentStart = (i * segmentAngle) % 360;
      const segmentEnd = ((i + 1) * segmentAngle) % 360;
      
      if (segmentEnd > segmentStart) {
        if (normalizedRotation >= segmentStart && normalizedRotation < segmentEnd) {
          return i;
        }
      } else {
        // Caso cuando el segmento cruza el límite de 360 grados
        if (normalizedRotation >= segmentStart || normalizedRotation < segmentEnd) {
          return i;
        }
      }
    }
    
    return 0;
  }

  it('debería calcular correctamente la rotación para 10 jugadores', () => {
    const totalPlayers = 10;
    const segmentAngle = 360 / totalPlayers; // 36 grados por segmento
    
    expect(segmentAngle).toBe(36);
  });

  it('debería alinear el ganador 0 en el indicador', () => {
    const totalPlayers = 10;
    const winnerIndex = 0;
    const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
    const normalizedRotation = normalizeRotation(targetRotation);
    
    // El ganador 0 debe estar entre 0 y 36 grados
    expect(normalizedRotation).toBeGreaterThanOrEqual(0);
    expect(normalizedRotation).toBeLessThan(36);
  });

  it('debería alinear el ganador 5 en el indicador', () => {
    const totalPlayers = 10;
    const winnerIndex = 5;
    const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
    const normalizedRotation = normalizeRotation(targetRotation);
    
    // El ganador 5 debe estar entre 180 y 216 grados (5 * 36 = 180)
    expect(normalizedRotation).toBeGreaterThanOrEqual(180);
    expect(normalizedRotation).toBeLessThan(216);
  });

  it('debería alinear el ganador 9 en el indicador', () => {
    const totalPlayers = 10;
    const winnerIndex = 9;
    const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
    const normalizedRotation = normalizeRotation(targetRotation);
    
    // El ganador 9 debe estar entre 324 y 360 grados (9 * 36 = 324)
    expect(normalizedRotation).toBeGreaterThanOrEqual(324);
    expect(normalizedRotation).toBeLessThan(360);
  });

  it('debería recuperar correctamente el ganador desde la rotación (10 jugadores)', () => {
    const totalPlayers = 10;
    
    for (let winnerIndex = 0; winnerIndex < totalPlayers; winnerIndex++) {
      const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
      const recoveredWinner = getWinnerFromRotation(targetRotation, totalPlayers);
      
      expect(recoveredWinner).toBe(winnerIndex);
    }
  });

  it('debería recuperar correctamente el ganador desde la rotación (8 jugadores)', () => {
    const totalPlayers = 8;
    
    for (let winnerIndex = 0; winnerIndex < totalPlayers; winnerIndex++) {
      const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
      const recoveredWinner = getWinnerFromRotation(targetRotation, totalPlayers);
      
      expect(recoveredWinner).toBe(winnerIndex);
    }
  });

  it('debería recuperar correctamente el ganador desde la rotación (6 jugadores)', () => {
    const totalPlayers = 6;
    
    for (let winnerIndex = 0; winnerIndex < totalPlayers; winnerIndex++) {
      const targetRotation = calculateTargetRotation(winnerIndex, totalPlayers);
      const recoveredWinner = getWinnerFromRotation(targetRotation, totalPlayers);
      
      expect(recoveredWinner).toBe(winnerIndex);
    }
  });

  it('debería manejar rotaciones negativas correctamente', () => {
    const totalPlayers = 10;
    const negativeRotation = -45;
    const normalizedRotation = normalizeRotation(negativeRotation);
    
    // En JavaScript, -45 % 360 = -45, así que normalizamos sumando 360
    const properlyNormalized = normalizedRotation < 0 ? normalizedRotation + 360 : normalizedRotation;
    expect(properlyNormalized).toBe(315);
  });

  it('debería manejar rotaciones muy grandes correctamente', () => {
    const totalPlayers = 10;
    const largeRotation = 3600 + 45; // 10 vueltas + 45 grados
    const normalizedRotation = normalizeRotation(largeRotation);
    
    // 3645 % 360 debería ser 45
    expect(normalizedRotation).toBe(45);
  });

  it('debería mantener consistencia entre cálculo de rotación y recuperación de ganador', () => {
    const testCases = [
      { players: 10, winner: 0 },
      { players: 10, winner: 5 },
      { players: 10, winner: 9 },
      { players: 8, winner: 3 },
      { players: 6, winner: 2 },
      { players: 5, winner: 4 },
    ];

    testCases.forEach(({ players, winner }) => {
      const targetRotation = calculateTargetRotation(winner, players);
      const recoveredWinner = getWinnerFromRotation(targetRotation, players);
      
      expect(recoveredWinner).toBe(winner);
    });
  });

  it('debería validar que la segmentación es correcta para diferentes números de jugadores', () => {
    const playerCounts = [5, 6, 8, 10, 12];
    
    playerCounts.forEach((count) => {
      const segmentAngle = 360 / count;
      const totalAngle = segmentAngle * count;
      
      // La suma de todos los segmentos debe ser 360 grados
      expect(totalAngle).toBe(360);
    });
  });
});
