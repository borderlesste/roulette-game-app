/**
 * Configuración centralizada del juego de ruleta
 * Permite ajustar parámetros económicos y de gameplay
 */

export interface GameConfig {
  // Configuración de jugadores
  maxActivePlayers: number;
  
  // Configuración económica
  houseEdge: number; // Porcentaje que se queda la casa (0.05 = 5%)
  maxPrizeMultiplier: number; // Multiplicador máximo del premio (3x)
  maxPotPercentage: number; // Porcentaje máximo del pozo que se puede ganar (0.3 = 30%)
  
  // Configuración de premios
  minPrizeAmount: number; // Premio mínimo garantizado
  
  // Montos de entrada permitidos
  allowedEntryAmounts: number[];
  
  // Configuración de probabilidades
  useWeightedSelection: boolean; // Si true, usa selección ponderada por monto
  weightExponent: number; // Exponente para cálculo de pesos (1 = lineal, >1 = más peso a entradas altas)
}

/**
 * Configuración por defecto del juego
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxActivePlayers: 10,
  houseEdge: 0.05, // 5% para la casa
  maxPrizeMultiplier: 3,
  maxPotPercentage: 0.3, // 30% del pozo
  minPrizeAmount: 5, // Premio mínimo de 5 Reales
  allowedEntryAmounts: [5, 10, 15, 20],
  useWeightedSelection: true,
  weightExponent: 1.2, // Ligera ventaja para entradas más altas
};

/**
 * Obtiene la configuración actual del juego
 * En el futuro, esto podría cargar desde base de datos o variables de entorno
 */
export function getGameConfig(): GameConfig {
  return { ...DEFAULT_GAME_CONFIG };
}

/**
 * Valida que un monto de entrada sea válido
 */
export function isValidEntryAmount(amount: number): boolean {
  const config = getGameConfig();
  return config.allowedEntryAmounts.includes(amount);
}

/**
 * Calcula la comisión de la casa sobre un monto
 */
export function calculateHouseCommission(amount: number): number {
  const config = getGameConfig();
  return Math.floor(amount * config.houseEdge);
}

/**
 * Calcula el monto neto después de la comisión de la casa
 */
export function calculateNetAmount(amount: number): number {
  return amount - calculateHouseCommission(amount);
}
