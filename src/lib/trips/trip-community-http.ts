import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { ZodSchema } from 'zod';
import type { CommunityActor, CommunityResult } from '@/lib/trips/trip-community';

/** Utente corrente come attore per recensioni e commenti (null se non autenticato). */
export async function getCommunityActor(): Promise<CommunityActor> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role ?? null };
}

/** Legge e valida il corpo JSON della richiesta. */
export async function parseCommunityBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Dati non validi' }, { status: 400 }) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Dati non validi';
    return { ok: false, response: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}

export function communityResponse<T>(result: CommunityResult<T>, successStatus = 200): NextResponse {
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.data, { status: successStatus });
}

export function communityServerError(context: string, error: unknown): NextResponse {
  console.error(`❌ [${context}]`, error);
  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
}
