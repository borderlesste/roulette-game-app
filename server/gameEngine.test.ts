import { describe, it, expect } from 'vitest';
import { calculatePrize } from './gameEngine';

describe('Game Engine - Prize Calculation', () => {
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
});
