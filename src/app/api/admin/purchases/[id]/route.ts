import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { z } from 'zod';

const refundSchema = z.object({
  reason: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = refundSchema.parse(body);

    const result = await PurchaseService.refundPurchase(
      params.id,
      session.user.id,
      reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Acquisto rimborsato con successo' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Errore nel rimborso dell\'acquisto:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}