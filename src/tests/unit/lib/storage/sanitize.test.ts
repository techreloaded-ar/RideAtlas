// src/tests/unit/lib/storage/sanitize.test.ts
import { sanitizeDirectoryName } from '@/lib/storage/types/storage';

describe('sanitizeDirectoryName', () => {
  it('deve rimuovere caratteri non sicuri', () => {
    expect(sanitizeDirectoryName('Test<>:"/\\|?*')).toBe('Test_________');
  });

  it('deve mantenere caratteri alfanumerici e spazi', () => {
    expect(sanitizeDirectoryName('Viaggio in Toscana 2024')).toBe('Viaggio in Toscana 2024');
  });

  it('deve rimuovere spazi multipli', () => {
    expect(sanitizeDirectoryName('Test    con     spazi')).toBe('Test con spazi');
  });

  it('deve rimuovere punti finali', () => {
    expect(sanitizeDirectoryName('Test...')).toBe('Test');
  });

  it('deve troncare nomi troppo lunghi', () => {
    const longName = 'A'.repeat(150);
    const result = sanitizeDirectoryName(longName);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('deve gestire stringhe con caratteri speciali misti', () => {
    expect(sanitizeDirectoryName('Trip<>: "Name"/Test|?*')).toBe('Trip___ _Name__Test___');
  });

  it('deve rimuovere spazi iniziali e finali', () => {
    expect(sanitizeDirectoryName('  Test Nome  ')).toBe('Test Nome');
  });
});