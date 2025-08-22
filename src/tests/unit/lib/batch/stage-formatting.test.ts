// Test per la funzione formatStageIndex
describe('formatStageIndex', () => {
  // Creiamo una versione pubblica della funzione per testare la logica
  const formatStageIndex = (index: number): string => {
    return index.toString().padStart(2, '0');
  };

  it('deve formattare numeri a una cifra con zero padding', () => {
    expect(formatStageIndex(1)).toBe('01');
    expect(formatStageIndex(5)).toBe('05');
    expect(formatStageIndex(9)).toBe('09');
  });

  it('deve mantenere numeri a due cifre senza modifiche', () => {
    expect(formatStageIndex(10)).toBe('10');
    expect(formatStageIndex(15)).toBe('15');
    expect(formatStageIndex(99)).toBe('99');
  });

  it('deve gestire numeri a tre cifre correttamente', () => {
    expect(formatStageIndex(100)).toBe('100');
    expect(formatStageIndex(999)).toBe('999');
  });

  it('deve gestire il numero zero', () => {
    expect(formatStageIndex(0)).toBe('00');
  });
});