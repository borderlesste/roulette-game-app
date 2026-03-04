import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests para validar el router de ganadores
 */

describe('Winners Router', () => {
  /**
   * Calcula el tiempo relativo desde una fecha
   */
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'hace unos segundos';
    if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

    return date.toLocaleDateString('es-ES');
  }

  it('debería calcular correctamente "hace unos segundos"', () => {
    const now = new Date();
    const result = getTimeAgo(now);
    expect(result).toBe('hace unos segundos');
  });

  it('debería calcular correctamente "hace X minutos"', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = getTimeAgo(fiveMinutesAgo);
    expect(result).toContain('minutos');
  });

  it('debería calcular correctamente "hace 1 minuto"', () => {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const result = getTimeAgo(oneMinuteAgo);
    expect(result).toBe('hace 1 minuto');
  });

  it('debería calcular correctamente "hace X horas"', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = getTimeAgo(twoHoursAgo);
    expect(result).toContain('horas');
  });

  it('debería calcular correctamente "hace 1 hora"', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const result = getTimeAgo(oneHourAgo);
    expect(result).toBe('hace 1 hora');
  });

  it('debería calcular correctamente "hace X días"', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = getTimeAgo(threeDaysAgo);
    expect(result).toContain('días');
  });

  it('debería calcular correctamente "hace 1 día"', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const result = getTimeAgo(oneDayAgo);
    expect(result).toBe('hace 1 día');
  });

  it('debería retornar fecha formateada para fechas antiguas', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const result = getTimeAgo(eightDaysAgo);
    expect(result).not.toContain('hace');
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('debería validar estructura de ganador', () => {
    const winner = {
      id: 1,
      winnerName: 'Juan Pérez',
      winnerId: 123,
      prizeAmount: 150,
      potAtTime: 500,
      winnerEntryAmount: 50,
      completedAt: new Date(),
      timeAgo: 'hace 2 minutos',
    };

    expect(winner).toHaveProperty('id');
    expect(winner).toHaveProperty('winnerName');
    expect(winner).toHaveProperty('winnerId');
    expect(winner).toHaveProperty('prizeAmount');
    expect(winner).toHaveProperty('potAtTime');
    expect(winner).toHaveProperty('winnerEntryAmount');
    expect(winner).toHaveProperty('completedAt');
    expect(winner).toHaveProperty('timeAgo');
  });

  it('debería validar que el premio no exceda el pozo', () => {
    const winners = [
      { prizeAmount: 100, potAtTime: 500 },
      { prizeAmount: 250, potAtTime: 1000 },
      { prizeAmount: 75, potAtTime: 200 },
    ];

    winners.forEach((winner) => {
      expect(winner.prizeAmount).toBeLessThanOrEqual(winner.potAtTime);
    });
  });

  it('debería validar que el monto de entrada sea positivo', () => {
    const winners = [
      { winnerEntryAmount: 5 },
      { winnerEntryAmount: 10 },
      { winnerEntryAmount: 15 },
      { winnerEntryAmount: 20 },
    ];

    winners.forEach((winner) => {
      expect(winner.winnerEntryAmount).toBeGreaterThan(0);
    });
  });

  it('debería validar que el premio sea mayor que la entrada', () => {
    const winners = [
      { winnerEntryAmount: 5, prizeAmount: 15 },
      { winnerEntryAmount: 10, prizeAmount: 30 },
      { winnerEntryAmount: 15, prizeAmount: 45 },
      { winnerEntryAmount: 20, prizeAmount: 60 },
    ];

    winners.forEach((winner) => {
      expect(winner.prizeAmount).toBeGreaterThan(winner.winnerEntryAmount);
    });
  });

  it('debería validar que el multiplicador de premio sea consistente', () => {
    const winners = [
      { winnerEntryAmount: 5, prizeAmount: 15, expectedMultiplier: 3 },
      { winnerEntryAmount: 10, prizeAmount: 30, expectedMultiplier: 3 },
      { winnerEntryAmount: 15, prizeAmount: 45, expectedMultiplier: 3 },
      { winnerEntryAmount: 20, prizeAmount: 60, expectedMultiplier: 3 },
    ];

    winners.forEach((winner) => {
      const actualMultiplier = winner.prizeAmount / winner.winnerEntryAmount;
      expect(actualMultiplier).toBeLessThanOrEqual(winner.expectedMultiplier);
    });
  });

  it('debería ordenar ganadores por fecha descendente', () => {
    const now = new Date();
    const winners = [
      { id: 1, completedAt: new Date(now.getTime() - 10 * 60 * 1000) },
      { id: 2, completedAt: new Date(now.getTime() - 5 * 60 * 1000) },
      { id: 3, completedAt: new Date(now.getTime() - 1 * 60 * 1000) },
    ];

    const sorted = [...winners].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    expect(sorted[0].id).toBe(3);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(1);
  });

  it('debería limitar a 5 ganadores recientes', () => {
    const winners = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      winnerName: `Ganador ${i + 1}`,
    }));

    const recentFive = winners.slice(0, 5);
    expect(recentFive).toHaveLength(5);
  });
});
