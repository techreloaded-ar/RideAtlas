import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/schemas/contact';
import { sendContactEmail } from '@/lib/core/email';

export async function POST(request: NextRequest) {
  try {
    // Parsing del body della richiesta
    const body = await request.json();

    // Validazione dei dati con Zod
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dati non validi',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { nome, email, messaggio } = validationResult.data;

    // Invio dell'email
    const emailResult = await sendContactEmail(nome, email, messaggio);

    if (!emailResult.success) {
      console.error('Errore invio email di contatto:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Si è verificato un errore durante l\'invio del messaggio. Riprova più tardi.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Messaggio inviato con successo!',
        simulated: emailResult.simulated || false
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore nel processing della richiesta di contatto:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore del server. Riprova più tardi.'
      },
      { status: 500 }
    );
  }
}
