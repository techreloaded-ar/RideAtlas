import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { PurchaseService } from '@/lib/purchaseService';
import { PurchaseStatus } from '@prisma/client';
import { z } from 'zod';

const giftTripSchema = z.object({
  userId: z.string().min(1, 'User ID è richiesto'),
  tripId: z.string().min(1, 'Trip ID è richiesto'),
  reason: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || undefined;
    const tripId = searchParams.get('tripId') || undefined;
    const status = searchParams.get('status') as PurchaseStatus || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await PurchaseService.getAllPurchases(page, limit, {
      userId,
      tripId,
      status,
      search
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Errore nel recupero degli acquisti:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = giftTripSchema.parse(body);

    const result = await PurchaseService.giftTrip(
      validatedData.userId,
      validatedData.tripId,
      session.user.id,
      validatedData.reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Viaggio regalato con successo' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dati non validi', 
        details: error.errors 
      }, { status: 400 });
    }

    console.error('Errore nel regalo del viaggio:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}