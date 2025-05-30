// src/scripts/verify-system.ts
import { PrismaClient } from '@prisma/client'
import { UserRole } from '@/types/profile'

const prisma = new PrismaClient()

async function verifySystem() {
  console.log('🔍 Verifica del sistema di gestione ruoli...\n')

  try {
    // Verifica utenti nel database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    console.log(`👥 Utenti nel database: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.email}: ${user.role} (creato: ${user.createdAt.toLocaleDateString()})`)
    })

    // Verifica che ci sia almeno un Sentinel
    const sentinels = users.filter(user => user.role === 'Sentinel')
    console.log(`\n🛡️  Sentinel trovati: ${sentinels.length}`)

    if (sentinels.length === 0) {
      console.log('⚠️  ATTENZIONE: Nessun utente Sentinel trovato!')
    } else {
      console.log('✅ Sistema pronto con almeno un Sentinel')
    }

    // Verifica enums
    console.log('\n📋 Ruoli disponibili:')
    Object.values(UserRole).forEach(role => {
      console.log(`  - ${role}`)
    })

  } catch (error) {
    console.error('❌ Errore durante la verifica:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySystem().catch(console.error)
