import { prisma } from '@/lib/core/prisma'

import { TripValidationResult, TripValidationError } from '@/types/trip'

export class TripValidationService {
  /**
   * Valida se un viaggio può essere pubblicato
   */
  static async validateForPublication(tripId: string): Promise<TripValidationResult> {
    const errors: TripValidationError[] = []

    try {
      // Recupera il viaggio con le tappe
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          stages: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      if (!trip) {
        errors.push({
          field: 'trip',
          message: 'Viaggio non trovato',
          code: 'TRIP_NOT_FOUND'
        })
        return { isValid: false, errors }
      }

      // Validazione 1: Titolo completo
      if (!trip.title || trip.title.trim().length === 0) {
        errors.push({
          field: 'title',
          message: 'Il titolo è obbligatorio',
          code: 'TITLE_REQUIRED'
        })
      }

      // Validazione 2: Descrizione completa
      if (!trip.summary || trip.summary.trim().length === 0) {
        errors.push({
          field: 'summary',
          message: 'La descrizione è obbligatoria',
          code: 'SUMMARY_REQUIRED'
        })
      }

      // Validazione 3: Deve avere almeno una tappa
      if (!trip.stages || trip.stages.length === 0) {
        errors.push({
          field: 'stages',
          message: 'Il viaggio deve avere almeno una tappa',
          code: 'STAGES_REQUIRED'
        })
      } else {
        // Validazione 4: Tutte le tappe devono avere un GPX
        const stagesWithoutGpx = trip.stages.filter(stage => !stage.gpxFile)
        if (stagesWithoutGpx.length > 0) {
          errors.push({
            field: 'stages.gpx',
            message: `${stagesWithoutGpx.length} tappa/e mancano del file GPX`,
            code: 'STAGES_GPX_REQUIRED'
          })
        }

        // Validazione 5: Tutte le tappe devono avere una descrizione
        const stagesWithoutDescription = trip.stages.filter(stage => 
          !stage.description || stage.description.trim().length === 0
        )
        if (stagesWithoutDescription.length > 0) {
          errors.push({
            field: 'stages.description',
            message: `${stagesWithoutDescription.length} tappa/e mancano della descrizione`,
            code: 'STAGES_DESCRIPTION_REQUIRED'
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('Errore durante la validazione del viaggio:', error)
      errors.push({
        field: 'system',
        message: 'Errore interno durante la validazione',
        code: 'VALIDATION_ERROR'
      })
      
      return { isValid: false, errors }
    }
  }
}