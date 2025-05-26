// src/scripts/test-prisma.ts
import { PrismaClient } from '@prisma/client'

async function testPrismaConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Testando connessione a Prisma...')
    
    // Test semplice connessione
    await prisma.$connect()
    console.log('✅ Connessione al database riuscita!')
    
    // Test query semplice
    const tripCount = await prisma.trip.count()
    console.log(`📊 Trovati ${tripCount} viaggi nel database`)
    
    const profileCount = await prisma.profile.count()
    console.log(`👥 Trovati ${profileCount} profili nel database`)
    
    console.log('🎉 Tutti i test superati!')
  } catch (error) {
    console.error('❌ Errore durante il test:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaConnection()
