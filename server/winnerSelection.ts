/**
 * Módulo de selección de ganadores con algoritmo ponderado
 * Implementa selección justa basada en montos de entrada
 */

import { getGameConfig } from './gameConfig';

export interface Player {
  id: number;
  userId: number;
  entryAmount: number;
  position: number;
}

export interface WeightedPlayer extends Player {
  weight: number;
  cumulativeWeight: number;
}

/**
 * Calcula el peso de un jugador basado en su monto de entrada
 * Usa un exponente configurable para ajustar la ventaja
 * 
 * Ejemplo con weightExponent = 1.2:
 * - Entrada de 5: peso = 5^1.2 ≈ 6.9
 * - Entrada de 10: peso = 10^1.2 ≈ 15.8
 * - Entrada de 15: peso = 15^1.2 ≈ 26.0
 * - Entrada de 20: peso = 20^1.2 ≈ 37.6
 */
export function calculatePlayerWeight(entryAmount: number): number {
  const config = getGameConfig();
  return Math.pow(entryAmount, config.weightExponent);
}

/**
 * Prepara los jugadores con sus pesos y pesos acumulativos
 * para el algoritmo de selección ponderada
 */
export function prepareWeightedPlayers(players: Player[]): WeightedPlayer[] {
  let cumulativeWeight = 0;
  
  return players.map((player) => {
    const weight = calculatePlayerWeight(player.entryAmount);
    cumulativeWeight += weight;
    
    return {
      ...player,
      weight,
      cumulativeWeight,
    };
  });
}

/**
 * Selecciona un ganador usando el algoritmo de selección ponderada
 * (Weighted Random Selection / Roulette Wheel Selection)
 * 
 * Algoritmo:
 * 1. Calcula el peso de cada jugador basado en su entrada
 * 2. Calcula pesos acumulativos
 * 3. Genera un número aleatorio entre 0 y el peso total
 * 4. Selecciona el jugador cuyo rango de peso acumulativo contiene el número
 * 
 * Complejidad: O(n) tiempo, O(n) espacio
 */
export function selectWeightedWinner(players: Player[]): Player {
  if (players.length === 0) {
    throw new Error('No players available for selection');
  }
  
  if (players.length === 1) {
    return players[0];
  }
  
  const config = getGameConfig();
  
  // Si la selección ponderada está deshabilitada, usar selección uniforme
  if (!config.useWeightedSelection) {
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
  }
  
  // Preparar jugadores con pesos
  const weightedPlayers = prepareWeightedPlayers(players);
  const totalWeight = weightedPlayers[weightedPlayers.length - 1].cumulativeWeight;
  
  // Generar número aleatorio entre 0 y el peso total
  const random = Math.random() * totalWeight;
  
  // Búsqueda binaria para encontrar el jugador seleccionado
  // (más eficiente que búsqueda lineal para muchos jugadores)
  let left = 0;
  let right = weightedPlayers.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const prevCumulative = mid > 0 ? weightedPlayers[mid - 1].cumulativeWeight : 0;
    
    if (random >= prevCumulative && random < weightedPlayers[mid].cumulativeWeight) {
      return weightedPlayers[mid];
    } else if (random < prevCumulative) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  // Fallback: retornar el jugador en la posición left
  return weightedPlayers[left];
}

/**
 * Calcula las probabilidades de victoria para cada jugador
 * Útil para mostrar en la UI o para análisis
 */
export function calculateWinProbabilities(players: Player[]): Map<number, number> {
  if (players.length === 0) {
    return new Map();
  }
  
  const config = getGameConfig();
  const probabilities = new Map<number, number>();
  
  // Si la selección ponderada está deshabilitada, todos tienen la misma probabilidad
  if (!config.useWeightedSelection) {
    const uniformProbability = 1 / players.length;
    players.forEach((player) => {
      probabilities.set(player.userId, uniformProbability);
    });
    return probabilities;
  }
  
  // Calcular pesos
  const weightedPlayers = prepareWeightedPlayers(players);
  const totalWeight = weightedPlayers[weightedPlayers.length - 1].cumulativeWeight;
  
  // Calcular probabilidad para cada jugador
  weightedPlayers.forEach((player) => {
    const probability = player.weight / totalWeight;
    probabilities.set(player.userId, probability);
  });
  
  return probabilities;
}

/**
 * Genera estadísticas de la distribución de probabilidades
 * Útil para verificar que el sistema es justo
 */
export function getSelectionStats(players: Player[]): {
  totalPlayers: number;
  totalPot: number;
  averageProbability: number;
  minProbability: number;
  maxProbability: number;
  probabilityByEntry: Map<number, number>;
} {
  const probabilities = calculateWinProbabilities(players);
  const probabilityValues = Array.from(probabilities.values());
  
  const totalPot = players.reduce((sum, p) => sum + p.entryAmount, 0);
  const probabilityByEntry = new Map<number, number>();
  
  // Agrupar probabilidades por monto de entrada
  players.forEach((player) => {
    const prob = probabilities.get(player.userId) || 0;
    const current = probabilityByEntry.get(player.entryAmount) || 0;
    probabilityByEntry.set(player.entryAmount, current + prob);
  });
  
  return {
    totalPlayers: players.length,
    totalPot,
    averageProbability: probabilityValues.reduce((a, b) => a + b, 0) / probabilityValues.length,
    minProbability: Math.min(...probabilityValues),
    maxProbability: Math.max(...probabilityValues),
    probabilityByEntry,
  };
}
