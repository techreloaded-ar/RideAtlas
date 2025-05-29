import nodemailer from 'nodemailer';

// Verifica che le variabili d'ambiente siano configurate
function validateEmailConfig() {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Variabili email mancanti: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
}

// Configurazione del trasportatore email
const createTransporter = () => {
  if (!validateEmailConfig()) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = port === 465; // 465 richiede SSL, 587 usa STARTTLS

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Aggiungi opzioni aggiuntive per debugging
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });
};

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('⚠️  Configurazione email non completa. Email non inviata.');
    console.log('📧 Email di verifica simulata per:', email);
    console.log('🔗 Link di verifica:', `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`);
    
    // In sviluppo, simula l'invio riuscito
    if (process.env.NODE_ENV === 'development') {
      return { success: true, simulated: true };
    }
    
    return { success: false, error: 'Configurazione email mancante' };
  }
  
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rideatlas.it',
    to: email,
    subject: 'Verifica il tuo account RideAtlas',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">RideAtlas</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Il viaggio lo progettiamo insieme, tu guidi l'avventura</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Benvenuto in RideAtlas!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
            Grazie per esserti registrato. Per completare la registrazione e iniziare a esplorare le nostre avventure,
            clicca sul pulsante qui sotto per verificare il tuo indirizzo email.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Verifica Email
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            Se non hai richiesto questa registrazione, puoi tranquillamente ignorare questa email.
            <br><br>
            Il link di verifica scadrà tra 24 ore.
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 RideAtlas. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Benvenuto in RideAtlas!
      
      Per completare la registrazione, visita questo link:
      ${verificationUrl}
      
      Il link scadrà tra 24 ore.
      
      Se non hai richiesto questa registrazione, puoi ignorare questa email.
    `,
  };

  try {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = port === 465;
    
    console.log('📧 Tentativo di invio email a:', email);
    console.log('🔧 Configurazione SMTP:', {
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      user: process.env.SMTP_USER
    });
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Email inviata con successo a:', email);
    return { success: true };
  } catch (error: unknown) {
    console.error('❌ Errore invio email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return { success: false, error: errorMessage };
  }
}
