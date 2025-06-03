import { extractCharacteristicsFromTags } from '@/lib/tripUtils';

describe('Simple tripUtils test', () => {
  test('should extract characteristics from tags', () => {
    const tags = ['char:mountain', 'adventure'];
    const result = extractCharacteristicsFromTags(tags);
    expect(result).toEqual(['mountain']);
  });
});
