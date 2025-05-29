// Script di test per verificare il comportamento della verifica email
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testEmailVerification() {
  console.log('🧪 Test della verifica email...\n');

  try {
    // Pulisci i dati di test precedenti
    await prisma.emailVerificationToken.deleteMany({
      where: { email: 'test@example.com' }
    });
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });

    // Crea un utente di test non verificato
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        hashedPassword: 'test123'
      }
    });
    console.log('✅ Utente di test creato:', testUser.email);

    // Crea un token di verifica
    const token = crypto.randomBytes(32).toString('hex');
    const verificationToken = await prisma.emailVerificationToken.create({
      data: {
        email: 'test@example.com',
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ore
      }
    });
    console.log('✅ Token di verifica creato:', token);

    // Simula la prima chiamata API (React Strict Mode - prima esecuzione)
    console.log('\n🔄 Simulando prima chiamata API...');
    const response1 = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`);
    const data1 = await response1.json();
    console.log('📥 Risposta 1:', data1);

    // Simula la seconda chiamata API (React Strict Mode - seconda esecuzione)
    console.log('\n🔄 Simulando seconda chiamata API (duplicate call)...');
    const response2 = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`);
    const data2 = await response2.json();
    console.log('📥 Risposta 2:', data2);

    // Verifica lo stato finale dell'utente
    const finalUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    console.log('\n📊 Stato finale utente:');
    console.log('- Email verificata:', finalUser?.emailVerified ? 'SÌ' : 'NO');
    console.log('- Data verifica:', finalUser?.emailVerified);

    // Verifica che il token sia stato eliminato
    const remainingToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });
    console.log('- Token rimanente:', remainingToken ? 'PRESENTE (ERRORE!)' : 'ELIMINATO ✅');

    // Test con token inesistente (simulando terza chiamata)
    console.log('\n🔄 Simulando terza chiamata con token già eliminato...');
    const response3 = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`);
    const data3 = await response3.json();
    console.log('📥 Risposta 3:', data3);

    // Cleanup
    await prisma.user.delete({ where: { email: 'test@example.com' } });
    console.log('\n🧹 Cleanup completato');

    console.log('\n✅ Test completato con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailVerification();
