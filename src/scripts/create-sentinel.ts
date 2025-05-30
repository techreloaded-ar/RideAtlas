// Script per creare il primo utente Sentinel
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSentinelUser() {
  try {
    console.log('🔧 Creazione primo utente Sentinel...')

    // Parametri del primo Sentinel
    const sentinelData = {
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      password: 'admin123456', // Password temporanea - cambiarla dopo il primo accesso
      role: UserRole.Sentinel
    }

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: sentinelData.email }
    })

    if (existingUser) {
      console.log('⚠️  L\'utente Sentinel esiste già!')
      console.log(`📧 Email: ${existingUser.email}`)
      console.log(`👤 Ruolo: ${existingUser.role}`)
      
      // Se non è Sentinel, aggiorna il ruolo
      if (existingUser.role !== UserRole.Sentinel) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.Sentinel }
        })
        console.log('✅ Ruolo aggiornato a Sentinel!')
      }
      
      return existingUser
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(sentinelData.password, 12)

    // Crea l'utente Sentinel
    const sentinelUser = await prisma.user.create({
      data: {
        name: sentinelData.name,
        email: sentinelData.email,
        password: hashedPassword,
        role: UserRole.Sentinel,
        emailVerified: new Date(), // Marca come verificato
      }
    })

    console.log('✅ Utente Sentinel creato con successo!')
    console.log(`📧 Email: ${sentinelUser.email}`)
    console.log(`🔑 Password temporanea: ${sentinelData.password}`)
    console.log(`👤 Ruolo: ${sentinelUser.role}`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo accesso!')
    
    return sentinelUser

  } catch (error) {
    console.error('❌ Errore nella creazione dell\'utente Sentinel:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui lo script
if (require.main === module) {
  createSentinelUser()
    .then(() => {
      console.log('🎉 Script completato!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script fallito:', error)
      process.exit(1)
    })
}

export { createSentinelUser }
