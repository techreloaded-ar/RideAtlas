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

export async function sendVerificationEmail(email: string, token: string, isPasswordSetup: boolean = false) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('⚠️  Configurazione email non completa. Email non inviata.');
    if (isPasswordSetup) {
      console.log('📧 Email di setup password simulata per:', email);
      console.log('🔗 Link di setup password:', `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`);
    } else {
      console.log('📧 Email di verifica simulata per:', email);
      console.log('🔗 Link di verifica:', `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`);
    }
    
    // In sviluppo, simula l'invio riuscito
    if (process.env.NODE_ENV === 'development') {
      return { success: true, simulated: true };
    }
    
    return { success: false, error: 'Configurazione email mancante' };
  }
  
  const verificationUrl = isPasswordSetup 
    ? `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`
    : `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  const subject = isPasswordSetup 
    ? 'Imposta la tua password - RideAtlas'
    : 'Verifica il tuo account RideAtlas';
    
  const welcomeTitle = isPasswordSetup 
    ? 'Imposta la tua password'
    : 'Benvenuto in RideAtlas!';
    
  const welcomeText = isPasswordSetup
    ? 'Un amministratore ha creato un account per te. Per completare la configurazione e iniziare a esplorare le nostre avventure, imposta la tua password cliccando sul pulsante qui sotto.'
    : 'Grazie per esserti registrato. Per completare la registrazione e iniziare a esplorare le nostre avventure, clicca sul pulsante qui sotto per verificare il tuo indirizzo email.';
    
  const buttonText = isPasswordSetup ? 'Imposta Password' : 'Verifica Email';
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rideatlas.it',
    to: email,
    subject: subject,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">RideAtlas</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Il viaggio lo progettiamo insieme, tu guidi l'avventura</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${welcomeTitle}</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
            ${welcomeText}
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              ${buttonText}
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            ${isPasswordSetup 
              ? 'Se non ti aspettavi questo messaggio, contatta l\'amministratore del sistema.'
              : 'Se non hai richiesto questa registrazione, puoi tranquillamente ignorare questa email.'
            }
            <br><br>
            Il link scadrà tra 24 ore.
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
      ${welcomeTitle}
      
      ${isPasswordSetup 
        ? `Un amministratore ha creato un account per te. Per completare la configurazione, visita questo link:`
        : `Per completare la registrazione, visita questo link:`
      }
      ${verificationUrl}
      
      Il link scadrà tra 24 ore.
      
      ${isPasswordSetup 
        ? 'Se non ti aspettavi questo messaggio, contatta l\'amministratore del sistema.'
        : 'Se non hai richiesto questa registrazione, puoi ignorare questa email.'
      }
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

export async function sendRoleChangeNotificationEmail(
  email: string, 
  userName: string, 
  newRole: string, 
  changedBy: string
) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('⚠️  Configurazione email non completa. Email di notifica ruolo non inviata.');
    console.log('📧 Email di cambio ruolo simulata per:', email);
    console.log('🔄 Nuovo ruolo:', newRole);
    console.log('👨‍💼 Cambiato da:', changedBy);
    
    // In sviluppo, simula l'invio riuscito
    if (process.env.NODE_ENV === 'development') {
      return { success: true, simulated: true };
    }
    
    return { success: false, error: 'Configurazione email mancante' };
  }

  // Converti il ruolo in italiano per l'email
  const roleTranslations: Record<string, string> = {
    'User': 'Utente',
    'Rider': 'Rider',
    'Sentinel': 'Sentinel'
  };

  const roleInItalian = roleTranslations[newRole] || newRole;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rideatlas.it',
    to: email,
    subject: 'Aggiornamento ruolo account - RideAtlas',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">RideAtlas</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Il viaggio lo progettiamo insieme, tu guidi l'avventura</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Aggiornamento Ruolo Account</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
            Ciao ${userName || 'Utente'},
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
            Ti informiamo che un amministratore (<strong>${changedBy}</strong>) ha aggiornato il tuo ruolo su RideAtlas.
          </p>
          
          <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #333; font-size: 16px;">
              <strong>Il tuo nuovo ruolo:</strong> <span style="color: #667eea; font-weight: bold;">${roleInItalian}</span>
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
            Questo cambiamento potrebbe influenzare le tue autorizzazioni e l'accesso a determinate funzioni della piattaforma. Accedi al tuo account per vedere i nuovi privilegi disponibili.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Accedi al Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            Se hai domande su questo cambiamento, contatta il supporto o l'amministratore che ha effettuato la modifica.
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
      Aggiornamento Ruolo Account - RideAtlas
      
      Ciao ${userName || 'Utente'},
      
      Ti informiamo che un amministratore (${changedBy}) ha aggiornato il tuo ruolo su RideAtlas.
      
      Il tuo nuovo ruolo: ${roleInItalian}
      
      Questo cambiamento potrebbe influenzare le tue autorizzazioni e l'accesso a determinate funzioni della piattaforma.
      
      Accedi al tuo account: ${process.env.NEXTAUTH_URL}/dashboard
      
      Se hai domande su questo cambiamento, contatta il supporto o l'amministratore che ha effettuato la modifica.
      
      © 2024 RideAtlas. Tutti i diritti riservati.
    `,
  };

  try {
    console.log('📧 Tentativo di invio email di notifica ruolo a:', email);
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Email di notifica ruolo inviata con successo a:', email);
    return { success: true };
  } catch (error: unknown) {
    console.error('❌ Errore invio email di notifica ruolo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return { success: false, error: errorMessage };
  }
}
