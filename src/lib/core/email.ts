import nodemailer from 'nodemailer';

// Types for email templates
interface EmailTemplateData {
  title: string;
  welcomeText: string;
  buttonText: string;
  buttonUrl: string;
  warningText?: string;
  footerText?: string;
  additionalContent?: string;
}

interface EmailResult {
  success: boolean;
  simulated?: boolean;
  error?: string;
}

// Verifica che le variabili d'ambiente siano configurate
function validateEmailConfig(): boolean {
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

// Template HTML riutilizzabile per tutte le email
function generateEmailTemplate(data: EmailTemplateData): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">RideAtlas</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Il viaggio lo progettiamo insieme, tu guidi l'avventura</p>
      </div>
      
      <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${data.title}</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
          ${data.welcomeText}
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${data.buttonUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            ${data.buttonText}
          </a>
        </div>
        
        ${data.warningText ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
              ${data.warningText}
            </p>
          </div>
        ` : ''}
        
        ${data.additionalContent || ''}
        
        <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
          ${data.footerText || 'Il link scadrà tra 24 ore.'}
          ${data.buttonUrl ? `<br><br>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br><a href="${data.buttonUrl}" style="color: #667eea; word-break: break-all;">${data.buttonUrl}</a>` : ''}
        </p>
        
        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 RideAtlas. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Template testo semplice riutilizzabile
function generateTextTemplate(data: EmailTemplateData): string {
  return `
    ${data.title}
    
    ${data.welcomeText}
    
    ${data.buttonText}: ${data.buttonUrl}
    
    ${data.footerText || 'Il link scadrà tra 24 ore.'}
    
    ${data.warningText || ''}
    
    © 2024 RideAtlas. Tutti i diritti riservati.
  `.trim();
}

// Funzione generica per inviare email
async function sendTemplatedEmail(
  to: string,
  subject: string,
  templateData: EmailTemplateData,
  logContext: string
): Promise<EmailResult> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error(`⚠️  Configurazione email non completa. ${logContext} non inviata.`);
    
    
    
    // In sviluppo, simula l'invio riuscito
    if (process.env.NODE_ENV === 'development') {
      return { success: true, simulated: true };
    }
    
    return { success: false, error: 'Configurazione email mancante' };
  }
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rideatlas.it',
    to,
    subject,
    html: generateEmailTemplate(templateData),
    text: generateTextTemplate(templateData),
  };

  try {
    
    
    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error: unknown) {
    console.error(`❌ Errore invio ${logContext.toLowerCase()}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return { success: false, error: errorMessage };
  }
}

export async function sendVerificationEmail(email: string, token: string, isPasswordSetup: boolean = false): Promise<EmailResult> {
  const verificationUrl = isPasswordSetup 
    ? `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`
    : `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  const subject = isPasswordSetup 
    ? 'Imposta la tua password - RideAtlas'
    : 'Verifica il tuo account RideAtlas';
    
  const templateData: EmailTemplateData = {
    title: isPasswordSetup ? 'Imposta la tua password' : 'Benvenuto in RideAtlas!',
    welcomeText: isPasswordSetup
      ? 'Un amministratore ha creato un account per te. Per completare la configurazione e iniziare a esplorare le nostre avventure, imposta la tua password cliccando sul pulsante qui sotto.'
      : 'Grazie per esserti registrato. Per completare la registrazione e iniziare a esplorare le nostre avventure, clicca sul pulsante qui sotto per verificare il tuo indirizzo email.',
    buttonText: isPasswordSetup ? 'Imposta Password' : 'Verifica Email',
    buttonUrl: verificationUrl,
    footerText: isPasswordSetup 
      ? 'Se non ti aspettavi questo messaggio, contatta l\'amministratore del sistema.\n\nIl link scadrà tra 24 ore.'
      : 'Se non hai richiesto questa registrazione, puoi tranquillamente ignorare questa email.\n\nIl link scadrà tra 24 ore.'
  };

  const logContext = isPasswordSetup ? 'Email di setup password' : 'Email di verifica';
  return sendTemplatedEmail(email, subject, templateData, logContext);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  const templateData: EmailTemplateData = {
    title: 'Reset della Password',
    welcomeText: 'Hai richiesto di reimpostare la password del tuo account RideAtlas. Clicca sul pulsante qui sotto per impostare una nuova password.',
    buttonText: 'Reimposta Password',
    buttonUrl: resetUrl,
    warningText: '<strong>⚠️ Importante:</strong> Questo link scadrà tra 1 ora per motivi di sicurezza. Se non hai richiesto questo reset, puoi ignorare questa email.',
    footerText: 'Il link scadrà tra 1 ora per motivi di sicurezza.'
  };

  return sendTemplatedEmail(email, 'Reset della password - RideAtlas', templateData, 'Email di reset password');
}

export async function sendRoleChangeNotificationEmail(
  email: string,
  userName: string,
  newRole: string,
  changedBy: string
): Promise<EmailResult> {
  // Converti il ruolo in italiano per l'email
  const roleTranslations: Record<string, string> = {
    'Explorer': 'Explorer',
    'Ranger': 'Ranger',
    'Sentinel': 'Sentinel'
  };

  const roleInItalian = roleTranslations[newRole] || newRole;
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;

  const templateData: EmailTemplateData = {
    title: 'Aggiornamento Ruolo Account',
    welcomeText: `Ciao ${userName || 'Utente'},\n\nTi informiamo che un amministratore (${changedBy}) ha aggiornato il tuo ruolo su RideAtlas.\n\nIl tuo nuovo ruolo: ${roleInItalian}\n\nQuesto cambiamento potrebbe influenzare le tue autorizzazioni e l'accesso a determinate funzioni della piattaforma. Accedi al tuo account per vedere i nuovi privilegi disponibili.`,
    buttonText: 'Accedi al Dashboard',
    buttonUrl: dashboardUrl,
    additionalContent: `
      <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #333; font-size: 16px;">
          <strong>Il tuo nuovo ruolo:</strong> <span style="color: #667eea; font-weight: bold;">${roleInItalian}</span>
        </p>
      </div>
    `,
    footerText: 'Se hai domande su questo cambiamento, contatta il supporto o l\'amministratore che ha effettuato la modifica.'
  };

  return sendTemplatedEmail(email, 'Aggiornamento ruolo account - RideAtlas', templateData, 'Email di notifica ruolo');
}

export async function sendEmailChangeVerification(newEmail: string, token: string): Promise<EmailResult> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/profile/verify-email-change?token=${token}`;

  const templateData: EmailTemplateData = {
    title: 'Verifica il cambio email',
    welcomeText: 'Hai richiesto di modificare l\'indirizzo email associato al tuo account RideAtlas. Per completare il processo, clicca sul pulsante qui sotto per verificare il tuo nuovo indirizzo email.',
    buttonText: 'Verifica Nuova Email',
    buttonUrl: verificationUrl,
    warningText: '<strong>⚠️ Importante:</strong> Questo link scadrà tra 24 ore per motivi di sicurezza. Se non hai richiesto questo cambio email, ignora questa email e contatta il supporto.',
    footerText: 'Il link scadrà tra 24 ore per motivi di sicurezza.'
  };

  return sendTemplatedEmail(newEmail, 'Verifica il cambio email - RideAtlas', templateData, 'Email di verifica cambio email');
}

export async function sendContactEmail(
  nome: string,
  senderEmail: string,
  messaggio: string
): Promise<EmailResult> {
  const transporter = createTransporter();

  if (!transporter) {
    console.error('⚠️  Configurazione email non completa. Email di contatto non inviata.');
    
    
    

    // In sviluppo, simula l'invio riuscito
    if (process.env.NODE_ENV === 'development') {
      return { success: true, simulated: true };
    }

    return { success: false, error: 'Configurazione email mancante' };
  }

  // Email HTML per il destinatario (info@rideatlas.it)
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Nuovo Messaggio di Contatto</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">RideAtlas</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
        <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
            <strong>Da:</strong> ${nome}
          </p>
          <p style="margin: 0; color: #333; font-size: 14px;">
            <strong>Email:</strong> <a href="mailto:${senderEmail}" style="color: #667eea; text-decoration: none;">${senderEmail}</a>
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">Messaggio:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${messaggio}</p>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
            Ricevuto il ${new Date().toLocaleString('it-IT')}
          </p>
        </div>
      </div>
    </div>
  `;

  // Testo semplice
  const textContent = `
Nuovo Messaggio di Contatto - RideAtlas

Da: ${nome}
Email: ${senderEmail}

Messaggio:
${messaggio}

---
Ricevuto il ${new Date().toLocaleString('it-IT')}
  `.trim();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rideatlas.it',
    to: 'info@rideatlas.it',
    replyTo: senderEmail,
    subject: `Nuovo messaggio di contatto da ${nome}`,
    html: htmlContent,
    text: textContent,
  };

  try {
    

    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error: unknown) {
    console.error('❌ Errore invio email di contatto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return { success: false, error: errorMessage };
  }
}
