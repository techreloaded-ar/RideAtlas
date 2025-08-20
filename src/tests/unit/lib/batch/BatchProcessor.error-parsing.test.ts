// src/tests/unit/lib/batch/BatchProcessor.error-parsing.test.ts
import { BatchProcessor } from '@/lib/batch/BatchProcessor'

describe('BatchProcessor Error Parsing', () => {
  let processor: BatchProcessor

  beforeEach(() => {
    processor = new BatchProcessor()
  })

  describe('parseJobErrors', () => {
    it('should parse Prisma push structure correctly', () => {
      const prismaError = {
        push: {
          message: 'Viaggio: Caratteristiche non valide: [Patrimonio culturale dell\'Europa Orientale]. Valori consentiti: [Strade sterrate, Curve strette]',
          tripIndex: 0,
          field: 'characteristics'
        }
      }

      // Access the private method through any casting for testing
      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      const result = parseJobErrors(prismaError)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        message: 'Viaggio: Caratteristiche non valide: [Patrimonio culturale dell\'Europa Orientale]. Valori consentiti: [Strade sterrate, Curve strette]',
        tripIndex: 0,
        stageIndex: undefined,
        field: 'characteristics'
      })
    })

    it('should handle direct error structure', () => {
      const directError = {
        message: 'Direct error message',
        tripIndex: 1,
        field: 'title'
      }

      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      const result = parseJobErrors(directError)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        message: 'Direct error message',
        tripIndex: 1,
        stageIndex: undefined,
        field: 'title'
      })
    })

    it('should handle array of errors', () => {
      const errorArray = [
        { message: 'First error', tripIndex: 0 },
        { message: 'Second error', tripIndex: 1 }
      ]

      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      const result = parseJobErrors(errorArray)

      expect(result).toHaveLength(2)
      expect(result[0].message).toBe('First error')
      expect(result[1].message).toBe('Second error')
    })

    it('should handle string error', () => {
      const stringError = 'Simple string error message'

      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      const result = parseJobErrors(stringError)

      expect(result).toHaveLength(1)
      expect(result[0].message).toBe('Simple string error message')
    })

    it('should return fallback for malformed errors', () => {
      const malformedError = { someOtherField: 'value' }

      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      const result = parseJobErrors(malformedError)

      expect(result).toHaveLength(1)
      expect(result[0].message).toBe('Errore durante il processamento')
    })

    it('should handle null/undefined input', () => {
      const parseJobErrors = (processor as any).parseJobErrors.bind(processor)
      
      expect(parseJobErrors(null)).toEqual([])
      expect(parseJobErrors(undefined)).toEqual([])
    })
  })
})