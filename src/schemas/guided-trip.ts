import { z } from 'zod'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida (formato AAAA-MM-GG)')
  .refine(value => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), 'Data non valida')

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri`)
    .optional()
    .transform(value => (value && value.length > 0 ? value : undefined))

/** Dati inseriti dal Ranger per creare o modificare un viaggio guidato. */
export const guidedTripInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Il titolo deve avere almeno 3 caratteri').max(120, 'Massimo 120 caratteri'),
    description: z.string().trim().min(10, 'Descrivi il viaggio in almeno 10 caratteri').max(5000, 'Massimo 5000 caratteri'),
    program: z.string().trim().min(3, 'Inserisci il programma, una riga per giorno').max(5000, 'Massimo 5000 caratteri'),
    includedServices: optionalText(1000),
    coverImageUrl: z
      .string()
      .trim()
      .optional()
      .transform(value => (value && value.length > 0 ? value : undefined))
      .refine(value => value === undefined || /^https?:\/\/\S+$/i.test(value), 'Inserisci un indirizzo http(s) valido'),
    departureDate: isoDate,
    returnDate: isoDate,
    meetingPoint: z.string().trim().min(3, 'Indica punto e ora di ritrovo').max(300, 'Massimo 300 caratteri'),
    maxParticipants: z.coerce
      .number({ invalid_type_error: 'Indica il numero massimo di partecipanti' })
      .int('Il numero di posti deve essere intero')
      .min(1, 'Serve almeno un posto')
      .max(100, 'Massimo 100 partecipanti'),
    pricePerParticipant: z.coerce
      .number({ invalid_type_error: 'Indica il prezzo a persona' })
      .min(1, 'Il prezzo deve essere di almeno 1 €')
      .max(20000, 'Prezzo troppo alto')
      .transform(value => Math.round(value * 100) / 100),
    registrationDeadline: isoDate,
    cancellationNoticeDays: z.coerce
      .number({ invalid_type_error: 'Indica i giorni di preavviso per la disdetta' })
      .int('I giorni devono essere un numero intero')
      .min(0, 'I giorni non possono essere negativi')
      .max(365, 'Massimo 365 giorni'),
  })
  .superRefine((value, ctx) => {
    if (value.returnDate < value.departureDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Il rientro non può precedere la partenza' })
    }
    if (value.registrationDeadline > value.departureDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registrationDeadline'], message: 'Le iscrizioni devono chiudersi entro la data di partenza' })
    }
  })

export type GuidedTripInput = z.infer<typeof guidedTripInputSchema>

export const refundGuidedTripRegistrationSchema = z.object({
  note: z.string().trim().max(500, 'Massimo 500 caratteri').optional(),
})
