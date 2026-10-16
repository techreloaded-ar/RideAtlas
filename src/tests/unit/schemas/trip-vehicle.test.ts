/**
 * @jest-environment node
 */
import { Prisma } from '@prisma/client'

describe('Schema Prisma - mezzo di trasporto del viaggio', () => {
  const { enums, models } = Prisma.dmmf.datamodel

  it('definisce l\'enum Vehicle con MOTO, BICI, EBIKE, MONOPATTINO', () => {
    const vehicle = enums.find((e) => e.name === 'Vehicle')
    expect(vehicle).toBeDefined()
    expect(vehicle!.values.map((v) => v.name)).toEqual(['MOTO', 'BICI', 'EBIKE', 'MONOPATTINO'])
  })

  it('espone Trip.vehicle come enum obbligatorio con default MOTO', () => {
    const trip = models.find((m) => m.name === 'Trip')
    const field = trip!.fields.find((f) => f.name === 'vehicle')
    expect(field).toBeDefined()
    expect(field!.kind).toBe('enum')
    expect(field!.type).toBe('Vehicle')
    expect(field!.isRequired).toBe(true)
    expect(field!.hasDefaultValue).toBe(true)
    expect(field!.default).toBe('MOTO')
  })
})
