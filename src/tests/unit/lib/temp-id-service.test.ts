// src/lib/temp-id-service.test.ts

import { TempIdService, generateTempId, generateTempStageId, generateTempMediaId, isTempId, isPermanentId, filterTempEntities, filterPermanentEntities } from '@/lib/temp-id-service';

describe('TempIdService', () => {
  describe('generateTempId', () => {
    it('should generate temp ID with default format', () => {
      const id = TempIdService.generateTempId();
      expect(id).toMatch(/^temp-\d+-[a-z0-9]+$/);
    });

    it('should generate temp ID with custom prefix', () => {
      const id = TempIdService.generateTempId('custom');
      expect(id).toMatch(/^temp-custom-\d+-[a-z0-9]+$/);
    });

    it('should generate different IDs on successive calls', () => {
      const id1 = TempIdService.generateTempId();
      const id2 = TempIdService.generateTempId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateTempStageId', () => {
    it('should generate stage-specific temp ID', () => {
      const id = TempIdService.generateTempStageId();
      expect(id).toMatch(/^temp-stage--\d+-[a-z0-9]+$/);
    });
  });

  describe('generateTempMediaId', () => {
    it('should generate media-specific temp ID', () => {
      const id = TempIdService.generateTempMediaId();
      expect(id).toMatch(/^temp-media--\d+-[a-z0-9]+$/);
    });
  });

  describe('generateTempIdWithIndex', () => {
    it('should generate temp ID with index', () => {
      const id = TempIdService.generateTempIdWithIndex('batch', 5);
      expect(id).toMatch(/^temp-batch-\d+-5$/);
    });
  });

  describe('isTempId', () => {
    it('should return true for temp IDs', () => {
      expect(TempIdService.isTempId('temp-12345-abc')).toBe(true);
      expect(TempIdService.isTempId('temp-stage-12345-def')).toBe(true);
    });

    it('should return false for permanent IDs', () => {
      expect(TempIdService.isTempId('user-123')).toBe(false);
      expect(TempIdService.isTempId('abc123')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(TempIdService.isTempId(null)).toBe(false);
      expect(TempIdService.isTempId(undefined)).toBe(false);
      expect(TempIdService.isTempId('')).toBe(false);
    });
  });

  describe('isPermanentId', () => {
    it('should return false for temp IDs', () => {
      expect(TempIdService.isPermanentId('temp-12345-abc')).toBe(false);
    });

    it('should return true for permanent IDs', () => {
      expect(TempIdService.isPermanentId('user-123')).toBe(true);
      expect(TempIdService.isPermanentId('abc123')).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(TempIdService.isPermanentId(null)).toBe(false);
      expect(TempIdService.isPermanentId(undefined)).toBe(false);
    });
  });

  describe('filterTempEntities', () => {
    const entities = [
      { id: 'temp-123-abc', name: 'temp1' },
      { id: 'user-456', name: 'permanent1' },
      { id: 'temp-789-def', name: 'temp2' },
      { id: 'stage-101', name: 'permanent2' }
    ];

    it('should filter only temp entities', () => {
      const tempEntities = TempIdService.filterTempEntities(entities, entity => entity.id);
      expect(tempEntities).toHaveLength(2);
      expect(tempEntities[0].name).toBe('temp1');
      expect(tempEntities[1].name).toBe('temp2');
    });
  });

  describe('filterPermanentEntities', () => {
    const entities = [
      { id: 'temp-123-abc', name: 'temp1' },
      { id: 'user-456', name: 'permanent1' },
      { id: 'temp-789-def', name: 'temp2' },
      { id: 'stage-101', name: 'permanent2' }
    ];

    it('should filter only permanent entities', () => {
      const permanentEntities = TempIdService.filterPermanentEntities(entities, entity => entity.id);
      expect(permanentEntities).toHaveLength(2);
      expect(permanentEntities[0].name).toBe('permanent1');
      expect(permanentEntities[1].name).toBe('permanent2');
    });
  });

  describe('extractPrefix', () => {
    it('should extract prefix from temp ID', () => {
      expect(TempIdService.extractPrefix('temp-stage-123-abc')).toBe('stage');
      expect(TempIdService.extractPrefix('temp-media-456-def')).toBe('media');
    });

    it('should return null for non-temp IDs', () => {
      expect(TempIdService.extractPrefix('user-123')).toBeNull();
    });

    it('should return null for malformed temp IDs', () => {
      expect(TempIdService.extractPrefix('temp-')).toBeNull();
      expect(TempIdService.extractPrefix('temp-abc')).toBeNull();
    });
  });

  describe('hasTempPrefix', () => {
    it('should return true when prefix matches', () => {
      expect(TempIdService.hasTempPrefix('temp-stage-123-abc', 'stage')).toBe(true);
      expect(TempIdService.hasTempPrefix('temp-media-456-def', 'media')).toBe(true);
    });

    it('should return false when prefix does not match', () => {
      expect(TempIdService.hasTempPrefix('temp-stage-123-abc', 'media')).toBe(false);
    });

    it('should return false for non-temp IDs', () => {
      expect(TempIdService.hasTempPrefix('user-123', 'stage')).toBe(false);
    });
  });

  describe('Named exports', () => {
    it('should work with named export functions', () => {
      expect(generateTempId()).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(generateTempStageId()).toMatch(/^temp-stage--\d+-[a-z0-9]+$/);
      expect(generateTempMediaId()).toMatch(/^temp-media--\d+-[a-z0-9]+$/);
      expect(isTempId('temp-123-abc')).toBe(true);
      expect(isPermanentId('user-123')).toBe(true);
    });
  });
});