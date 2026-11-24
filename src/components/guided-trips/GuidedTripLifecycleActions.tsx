'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GuidedTripLifecycleActionsProps {
  guidedTripId: string;
  status: 'Bozza' | 'Pubblicato' | 'Annullato';
  confirmedCount: number;
}

/** Pubblicazione e annullamento del viaggio guidato. */
export default function GuidedTripLifecycleActions({ guidedTripId, status, confirmedCount }: GuidedTripLifecycleActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  async function run(action: 'publish' | 'cancel') {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/guided-trips/${guidedTripId}/${action}`, { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setConfirmingCancellation(false);
    setMessage(response.ok ? { kind: 'success', text: data.message } : { kind: 'error', text: data.error ?? 'Operazione non riuscita' });
    router.refresh();
  }

  if (status === 'Annullato') return null;

  return (
    <div className="space-y-3">
      {status === 'Bozza' && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
          <p className="text-sm text-primary-900">La bozza è visibile solo a te. Pubblicandola il viaggio compare subito in «Viaggi guidati» ed è prenotabile.</p>
          <button type="button" disabled={busy} onClick={() => run('publish')} className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            Pubblica viaggio
          </button>
        </div>
      )}
      {status === 'Pubblicato' &&
        (confirmingCancellation ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              Confermi l&apos;annullamento? Il viaggio non sarà più prenotabile
              {confirmedCount > 0 ? ` e i ${confirmedCount} iscritti riceveranno un avviso: un Sentinel eseguirà i rimborsi` : ''}. L&apos;operazione non si può annullare.
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={busy} onClick={() => run('cancel')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                Sì, annulla il viaggio
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmingCancellation(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
                No
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingCancellation(true)} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            Annulla viaggio
          </button>
        ))}
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
