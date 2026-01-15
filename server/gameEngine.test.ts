import { describe, it, expect } from 'vitest';
import { calculatePrize } from './gameEngine';

describe('Game Engine - Prize Calculation', () => {
  describe('Basic Prize Calculation', () => {
    it('should calculate prize for 5 Reais entry with small pot', () => {
      const prize = calculatePrize(5, 50);
      // Max possible: 5 * 3 = 15
      // Pot percentage: 50 * 0.3 = 15
      // Min(15, 15) = 15
      expect(prize).toBe(15);
    });

    it('should calculate prize for 5 Reais entry with large pot', () => {
      const prize = calculatePrize(5, 1000);
      // Max possible: 5 * 3 = 15
      // Pot percentage: 1000 * 0.3 = 300
      // Min(15, 300) = 15
      expect(prize).toBe(15);
    });

    it('should calculate prize for 10 Reais entry', () => {
      const prize = calculatePrize(10, 100);
      // Max possible: 10 * 3 = 30
      // Pot percentage: 100 * 0.3 = 30
      // Min(30, 30) = 30
      expect(prize).toBe(30);
    });

    it('should calculate prize for 15 Reais entry', () => {
      const prize = calculatePrize(15, 200);
      // Max possible: 15 * 3 = 45
      // Pot percentage: 200 * 0.3 = 60
      // Min(45, 60) = 45
      expect(prize).toBe(45);
    });

    it('should calculate prize for 20 Reais entry', () => {
      const prize = calculatePrize(20, 300);
      // Max possible: 20 * 3 = 60
      // Pot percentage: 300 * 0.3 = 90
      // Min(60, 90) = 60
      expect(prize).toBe(60);
    });

    it('should respect pot percentage limit when pot is small', () => {
      const prize = calculatePrize(20, 100);
      // Max possible: 20 * 3 = 60
      // Pot percentage: 100 * 0.3 = 30
      // Min(60, 30) = 30
      expect(prize).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero pot', () => {
      const prize = calculatePrize(5, 0);
      // Max possible: 5 * 3 = 15
      // Pot percentage: 0 * 0.3 = 0
      // Min(15, 0) = 0
      expect(prize).toBe(0);
    });

    it('should handle very large pot', () => {
      const prize = calculatePrize(5, 10000);
      // Max possible: 5 * 3 = 15
      // Pot percentage: 10000 * 0.3 = 3000
      // Min(15, 3000) = 15
      expect(prize).toBe(15);
    });

    it('should throw error for invalid entry amount', () => {
      expect(() => calculatePrize(7, 100)).toThrow('Invalid entry amount');
      expect(() => calculatePrize(25, 100)).toThrow('Invalid entry amount');
      expect(() => calculatePrize(0, 100)).toThrow('Invalid entry amount');
      expect(() => calculatePrize(-5, 100)).toThrow('Invalid entry amount');
    });

    it('should throw error for negative pot', () => {
      expect(() => calculatePrize(10, -50)).toThrow('Invalid pot amount');
    });
  });

  describe('Minimum Prize Guarantee', () => {
    it('should guarantee minimum prize when pot allows', () => {
      const prize = calculatePrize(20, 20);
      // Max possible: 20 * 3 = 60
      // Pot percentage: 20 * 0.3 = 6
      // Minimum prize: 5
      // Should return min(60, min(6, 20)) but with min prize guarantee
      expect(prize).toBeGreaterThanOrEqual(5);
    });

    it('should not guarantee minimum prize when pot is too small', () => {
      const prize = calculatePrize(5, 3);
      // Pot is only 3, can't guarantee minimum of 5
      // Pot percentage: 3 * 0.3 = 0.9 = 0 (floor)
      expect(prize).toBeLessThan(5);
    });
  });

  describe('Prize Sustainability', () => {
    it('should never exceed 30% of pot', () => {
      const testCases = [
        { entry: 5, pot: 100 },
        { entry: 10, pot: 200 },
        { entry: 15, pot: 300 },
        { entry: 20, pot: 500 },
        { entry: 20, pot: 1000 },
      ];

      testCases.forEach(({ entry, pot }) => {
        const prize = calculatePrize(entry, pot);
        expect(prize).toBeLessThanOrEqual(pot * 0.3);
      });
    });

    it('should never exceed 3x entry amount', () => {
      const testCases = [
        { entry: 5, pot: 1000 },
        { entry: 10, pot: 2000 },
        { entry: 15, pot: 3000 },
        { entry: 20, pot: 5000 },
      ];

      testCases.forEach(({ entry, pot }) => {
        const prize = calculatePrize(entry, pot);
        expect(prize).toBeLessThanOrEqual(entry * 3);
      });
    });

    it('should always return non-negative prize', () => {
      const testCases = [
        { entry: 5, pot: 0 },
        { entry: 10, pot: 1 },
        { entry: 15, pot: 5 },
        { entry: 20, pot: 10 },
      ];

      testCases.forEach(({ entry, pot }) => {
        const prize = calculatePrize(entry, pot);
        expect(prize).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Realistic Scenarios', () => {
    it('should calculate fair prize for typical game state', () => {
      // 10 jugadores con entradas variadas
      // Total pot: 2*5 + 3*10 + 3*15 + 2*20 = 10 + 30 + 45 + 40 = 125
      const pot = 125;

      const prizes = {
        entry5: calculatePrize(5, pot),
        entry10: calculatePrize(10, pot),
        entry15: calculatePrize(15, pot),
        entry20: calculatePrize(20, pot),
      };

      // Verificar que los premios son proporcionales (cuando no están limitados por el pozo)
      expect(prizes.entry10).toBeGreaterThan(prizes.entry5);
      expect(prizes.entry15).toBeGreaterThan(prizes.entry10);
      // entry15 y entry20 tienen el mismo premio porque están limitados por el 30% del pozo
      expect(prizes.entry20).toBeGreaterThanOrEqual(prizes.entry15);

      // Verificar valores específicos
      expect(prizes.entry5).toBe(15); // min(15, 37.5) = 15
      expect(prizes.entry10).toBe(30); // min(30, 37.5) = 30
      expect(prizes.entry15).toBe(37); // min(45, 37.5) = 37 (floor)
      expect(prizes.entry20).toBe(37); // min(60, 37.5) = 37 (floor)
    });

    it('should handle pot depletion scenario', () => {
      // Pozo casi vacío después de varios premios
      const lowPot = 30;

      const prizes = {
        entry5: calculatePrize(5, lowPot),
        entry10: calculatePrize(10, lowPot),
        entry15: calculatePrize(15, lowPot),
        entry20: calculatePrize(20, lowPot),
      };

      // Todos los premios deberían estar limitados por el 30% del pozo (9)
      expect(prizes.entry5).toBeLessThanOrEqual(9);
      expect(prizes.entry10).toBeLessThanOrEqual(9);
      expect(prizes.entry15).toBeLessThanOrEqual(9);
      expect(prizes.entry20).toBeLessThanOrEqual(9);
    });

    it('should handle pot accumulation scenario', () => {
      // Pozo grande acumulado
      const largePot = 1000;

      const prizes = {
        entry5: calculatePrize(5, largePot),
        entry10: calculatePrize(10, largePot),
        entry15: calculatePrize(15, largePot),
        entry20: calculatePrize(20, largePot),
      };

      // Los premios deberían estar limitados por el multiplicador, no por el pozo
      expect(prizes.entry5).toBe(15); // 5 * 3
      expect(prizes.entry10).toBe(30); // 10 * 3
      expect(prizes.entry15).toBe(45); // 15 * 3
      expect(prizes.entry20).toBe(60); // 20 * 3
    });
  });

  describe('House Edge Impact', () => {
    it('should account for house commission in prize calculation', () => {
      // Con house edge del 5%, el premio efectivo es menor
      const pot = 200;
      const entry = 20;
      
      const grossPrize = calculatePrize(entry, pot);
      // El premio bruto es 60 (min(60, 60))
      expect(grossPrize).toBe(60);
      
      // La comisión de la casa (5%) se aplicará después
      // Net prize = 60 - (60 * 0.05) = 57
      // Esto se maneja en gameEngine.processGameRound()
    });
  });
});
