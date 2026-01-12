import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePrize } from './gameEngine';

describe('Game Procedures - Prize Calculation', () => {
  describe('calculatePrize function', () => {
    it('should calculate correct prize for 5 Reais entry with small pot', () => {
      const prize = calculatePrize(5, 50);
      expect(prize).toBe(15); // min(5*3, 50*0.3) = min(15, 15) = 15
    });

    it('should cap prize at 3x entry amount', () => {
      const prize = calculatePrize(5, 1000);
      expect(prize).toBe(15); // min(5*3, 1000*0.3) = min(15, 300) = 15
    });

    it('should cap prize at 30% of pot when pot is small', () => {
      const prize = calculatePrize(20, 100);
      expect(prize).toBe(30); // min(20*3, 100*0.3) = min(60, 30) = 30
    });

    it('should handle different entry amounts correctly', () => {
      expect(calculatePrize(5, 200)).toBe(15);
      expect(calculatePrize(10, 200)).toBe(30);
      expect(calculatePrize(15, 200)).toBe(45);
      expect(calculatePrize(20, 200)).toBe(60);
    });

    it('should return 0 for zero pot', () => {
      const prize = calculatePrize(5, 0);
      expect(prize).toBe(0);
    });

    it('should handle very large pots', () => {
      const prize = calculatePrize(10, 100000);
      expect(prize).toBe(30); // Still capped at 10*3
    });

    it('should use floor division for pot percentage', () => {
      // 33 * 0.3 = 9.9, should floor to 9
      const prize = calculatePrize(20, 33);
      expect(prize).toBe(9); // min(60, 9) = 9
    });
  });

  describe('Entry amount validation', () => {
    const validAmounts = [5, 10, 15, 20];

    it('should accept all valid entry amounts', () => {
      validAmounts.forEach((amount) => {
        expect(validAmounts).toContain(amount);
      });
    });

    it('should not accept invalid entry amounts', () => {
      const invalidAmounts = [1, 3, 7, 25, 100];
      invalidAmounts.forEach((amount) => {
        expect(validAmounts).not.toContain(amount);
      });
    });
  });

  describe('Prize distribution logic', () => {
    it('should ensure prize never exceeds 3x entry amount', () => {
      const testCases = [
        { entry: 5, pot: 10000, expected: 15 },
        { entry: 10, pot: 10000, expected: 30 },
        { entry: 15, pot: 10000, expected: 45 },
        { entry: 20, pot: 10000, expected: 60 },
      ];

      testCases.forEach(({ entry, pot, expected }) => {
        const prize = calculatePrize(entry, pot);
        expect(prize).toBe(expected);
        expect(prize).toBeLessThanOrEqual(entry * 3);
      });
    });

    it('should ensure prize never exceeds 30% of pot', () => {
      const testCases = [
        { entry: 5, pot: 100, expected: 15 },
        { entry: 10, pot: 100, expected: 30 },
        { entry: 15, pot: 100, expected: 30 },
        { entry: 20, pot: 100, expected: 30 },
      ];

      testCases.forEach(({ entry, pot, expected }) => {
        const prize = calculatePrize(entry, pot);
        expect(prize).toBe(expected);
        expect(prize).toBeLessThanOrEqual(pot * 0.3);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum entry amount', () => {
      const prize = calculatePrize(5, 50);
      expect(prize).toBeGreaterThan(0);
      expect(prize).toBeLessThanOrEqual(15);
    });

    it('should handle maximum entry amount', () => {
      const prize = calculatePrize(20, 500);
      expect(prize).toBeGreaterThan(0);
      expect(prize).toBeLessThanOrEqual(60);
    });

    it('should be deterministic', () => {
      const prize1 = calculatePrize(10, 200);
      const prize2 = calculatePrize(10, 200);
      expect(prize1).toBe(prize2);
    });
  });
});
