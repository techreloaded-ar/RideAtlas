// Seed dei dati demo locali: `RIDEATLAS_DEMO_DATA=1 npm run db:seed`.
// Vedi prisma/demo-data.ts per il catalogo e le protezioni.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { assertDemoSeedAllowed, seedDemoData } from './demo-data'

async function main() {
  assertDemoSeedAllowed(process.env)
  // Usa esattamente l'URL verificato, non un eventuale valore letto da file .env.
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
  try {
    await seedDemoData(prisma, password => bcrypt.hash(password, 12), message => console.log(message))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
