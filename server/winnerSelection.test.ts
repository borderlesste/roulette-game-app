import { describe, it, expect } from 'vitest';
import {
  calculatePlayerWeight,
  prepareWeightedPlayers,
  selectWeightedWinner,
  calculateWinProbabilities,
  getSelectionStats,
  type Player,
} from './winnerSelection';

describe('Winner Selection - Weighted Algorithm', () => {
  const mockPlayers: Player[] = [
    { id: 1, userId: 101, entryAmount: 5, position: 0 },
    { id: 2, userId: 102, entryAmount: 10, position: 1 },
    { id: 3, userId: 103, entryAmount: 15, position: 2 },
    { id: 4, userId: 104, entryAmount: 20, position: 3 },
  ];

  describe('calculatePlayerWeight', () => {
    it('should calculate weight using exponential formula', () => {
      // Con weightExponent = 1.2 (default)
      const weight5 = calculatePlayerWeight(5);
      const weight10 = calculatePlayerWeight(10);
      const weight20 = calculatePlayerWeight(20);

      // Verificar que los pesos aumentan exponencialmente
      expect(weight10).toBeGreaterThan(weight5);
      expect(weight20).toBeGreaterThan(weight10);
      
      // Verificar valores aproximados (con weightExponent = 1.2)
      expect(weight5).toBeCloseTo(6.9, 0);
      expect(weight10).toBeCloseTo(15.8, 0);
      expect(weight20).toBeCloseTo(36.4, 0);
    });

    it('should return positive weights for all valid entry amounts', () => {
      [5, 10, 15, 20].forEach((amount) => {
        const weight = calculatePlayerWeight(amount);
        expect(weight).toBeGreaterThan(0);
      });
    });
  });

  describe('prepareWeightedPlayers', () => {
    it('should calculate cumulative weights correctly', () => {
      const weighted = prepareWeightedPlayers(mockPlayers);

      // Verificar que todos tienen peso
      weighted.forEach((player) => {
        expect(player.weight).toBeGreaterThan(0);
        expect(player.cumulativeWeight).toBeGreaterThan(0);
      });

      // Verificar que los pesos acumulativos son crecientes
      for (let i = 1; i < weighted.length; i++) {
        expect(weighted[i].cumulativeWeight).toBeGreaterThan(
          weighted[i - 1].cumulativeWeight
        );
      }

      // Verificar que el último peso acumulativo es la suma de todos los pesos
      const totalWeight = weighted.reduce((sum, p) => sum + p.weight, 0);
      expect(weighted[weighted.length - 1].cumulativeWeight).toBeCloseTo(totalWeight, 5);
    });

    it('should handle single player', () => {
      const singlePlayer = [mockPlayers[0]];
      const weighted = prepareWeightedPlayers(singlePlayer);

      expect(weighted).toHaveLength(1);
      expect(weighted[0].weight).toBeGreaterThan(0);
      expect(weighted[0].cumulativeWeight).toBe(weighted[0].weight);
    });
  });

  describe('selectWeightedWinner', () => {
    it('should select a winner from available players', () => {
      const winner = selectWeightedWinner(mockPlayers);

      expect(winner).toBeDefined();
      // Verificar que el ganador es uno de los jugadores (comparar por userId)
      const winnerIds = mockPlayers.map(p => p.userId);
      expect(winnerIds).toContain(winner.userId);
    });

    it('should return the only player when there is one', () => {
      const singlePlayer = [mockPlayers[0]];
      const winner = selectWeightedWinner(singlePlayer);

      expect(winner).toEqual(singlePlayer[0]);
    });

    it('should throw error when no players available', () => {
      expect(() => selectWeightedWinner([])).toThrow('No players available');
    });

    it('should favor higher entry amounts statistically', () => {
      // Ejecutar selección múltiples veces y contar resultados
      const iterations = 10000;
      const counts = new Map<number, number>();

      for (let i = 0; i < iterations; i++) {
        const winner = selectWeightedWinner(mockPlayers);
        counts.set(winner.entryAmount, (counts.get(winner.entryAmount) || 0) + 1);
      }

      // Convertir a porcentajes
      const percentages = new Map<number, number>();
      counts.forEach((count, amount) => {
        percentages.set(amount, (count / iterations) * 100);
      });

      // Verificar que entradas más altas tienen mayor probabilidad
      const pct5 = percentages.get(5) || 0;
      const pct10 = percentages.get(10) || 0;
      const pct15 = percentages.get(15) || 0;
      const pct20 = percentages.get(20) || 0;

      expect(pct10).toBeGreaterThan(pct5);
      expect(pct15).toBeGreaterThan(pct10);
      expect(pct20).toBeGreaterThan(pct15);

      // Verificar que la suma de probabilidades es aproximadamente 100%
      const totalPct = pct5 + pct10 + pct15 + pct20;
      expect(totalPct).toBeCloseTo(100, 0);
    });
  });

  describe('calculateWinProbabilities', () => {
    it('should calculate probabilities that sum to 1', () => {
      const probabilities = calculateWinProbabilities(mockPlayers);

      expect(probabilities.size).toBe(mockPlayers.length);

      // Sumar todas las probabilidades
      let totalProbability = 0;
      probabilities.forEach((prob) => {
        totalProbability += prob;
      });

      expect(totalProbability).toBeCloseTo(1, 5);
    });

    it('should give higher probabilities to higher entry amounts', () => {
      const probabilities = calculateWinProbabilities(mockPlayers);

      const prob5 = probabilities.get(101) || 0;
      const prob10 = probabilities.get(102) || 0;
      const prob15 = probabilities.get(103) || 0;
      const prob20 = probabilities.get(104) || 0;

      expect(prob10).toBeGreaterThan(prob5);
      expect(prob15).toBeGreaterThan(prob10);
      expect(prob20).toBeGreaterThan(prob15);
    });

    it('should return empty map for no players', () => {
      const probabilities = calculateWinProbabilities([]);
      expect(probabilities.size).toBe(0);
    });

    it('should give 100% probability to single player', () => {
      const singlePlayer = [mockPlayers[0]];
      const probabilities = calculateWinProbabilities(singlePlayer);

      expect(probabilities.size).toBe(1);
      expect(probabilities.get(101)).toBeCloseTo(1, 5);
    });
  });

  describe('getSelectionStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getSelectionStats(mockPlayers);

      expect(stats.totalPlayers).toBe(4);
      expect(stats.totalPot).toBe(50); // 5 + 10 + 15 + 20
      expect(stats.averageProbability).toBeCloseTo(0.25, 1); // Aproximadamente 25% promedio
      expect(stats.minProbability).toBeGreaterThan(0);
      expect(stats.maxProbability).toBeLessThan(1);
      expect(stats.maxProbability).toBeGreaterThan(stats.minProbability);
    });

    it('should group probabilities by entry amount', () => {
      const stats = getSelectionStats(mockPlayers);

      expect(stats.probabilityByEntry.size).toBeGreaterThan(0);
      
      // Verificar que cada monto de entrada tiene una probabilidad
      [5, 10, 15, 20].forEach((amount) => {
        expect(stats.probabilityByEntry.has(amount)).toBe(true);
      });
    });

    it('should handle multiple players with same entry amount', () => {
      const playersWithDuplicates: Player[] = [
        { id: 1, userId: 101, entryAmount: 10, position: 0 },
        { id: 2, userId: 102, entryAmount: 10, position: 1 },
        { id: 3, userId: 103, entryAmount: 20, position: 2 },
      ];

      const stats = getSelectionStats(playersWithDuplicates);

      expect(stats.totalPlayers).toBe(3);
      expect(stats.totalPot).toBe(40); // 10 + 10 + 20

      // Los dos jugadores con entrada de 10 deberían tener probabilidad combinada
      const prob10 = stats.probabilityByEntry.get(10) || 0;
      const prob20 = stats.probabilityByEntry.get(20) || 0;

      // La suma de todas las probabilidades debe ser aproximadamente 1
      expect(prob10 + prob20).toBeCloseTo(1, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle players with equal entry amounts fairly', () => {
      const equalPlayers: Player[] = [
        { id: 1, userId: 101, entryAmount: 10, position: 0 },
        { id: 2, userId: 102, entryAmount: 10, position: 1 },
        { id: 3, userId: 103, entryAmount: 10, position: 2 },
      ];

      const probabilities = calculateWinProbabilities(equalPlayers);

      // Todos deberían tener la misma probabilidad
      const prob1 = probabilities.get(101) || 0;
      const prob2 = probabilities.get(102) || 0;
      const prob3 = probabilities.get(103) || 0;

      expect(prob1).toBeCloseTo(prob2, 5);
      expect(prob2).toBeCloseTo(prob3, 5);
      expect(prob1).toBeCloseTo(1 / 3, 5);
    });

    it('should handle extreme differences in entry amounts', () => {
      const extremePlayers: Player[] = [
        { id: 1, userId: 101, entryAmount: 5, position: 0 },
        { id: 2, userId: 102, entryAmount: 20, position: 1 },
      ];

      const probabilities = calculateWinProbabilities(extremePlayers);

      const prob5 = probabilities.get(101) || 0;
      const prob20 = probabilities.get(102) || 0;

      // El jugador con 20 debe tener significativamente más probabilidad
      expect(prob20).toBeGreaterThan(prob5 * 2);
      
      // Pero no debe ser desproporcionadamente alto (mantener fairness)
      expect(prob20).toBeLessThan(0.9); // Menos del 90%
    });
  });
});
