'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RefundQueueRow } from '@/lib/guided-trips/guidedTripService';
import { formatEuro, formatStoredDay } from '@/lib/guided-trips/guidedTripRules';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  REFUND_PENDING: { label: 'Da rimborsare', className: 'bg-amber-100 text-amber-800' },
  REFUND_FAILED: { label: 'Rimborso non riuscito', className: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Rimborsato', className: 'bg-green-100 text-green-800' },
};

/** Rimborsi delle prenotazioni di viaggi guidati annullati (e delle disdette con rimborso non riuscito). */
export default function GuidedTripRefundManagement() {
  const [rows, setRows] = useState<RefundQueueRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/guided-trip-refunds');
      if (!response.ok) throw new Error('Errore nel caricamento dei rimborsi');
      const data = await response.json();
      setRows(data.refunds ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Errore sconosciuto');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refund(bookingId: string) {
    setProcessingBookingId(bookingId);
    setFeedback(null);
    const response = await fetch(`/api/admin/guided-trip-refunds/${bookingId}`, { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    setProcessingBookingId(null);
    setFeedback(response.ok ? { kind: 'success', text: data.message ?? 'Rimborso eseguito' } : { kind: 'error', text: data.error ?? 'Rimborso non riuscito' });
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {feedback && (
        <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-lg px-3 py-2 text-sm ${feedback.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {feedback.text}
        </p>
      )}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {error && <p className="p-6 text-center text-red-600">{error}</p>}
        {!error && rows === null && <p className="p-6 text-center text-gray-500">Caricamento...</p>}
        {rows && rows.length === 0 && <p className="p-6 text-center text-gray-500">Nessun rimborso da gestire.</p>}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                  <th scope="col" className="px-4 py-3 font-semibold">Viaggio</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ranger</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Partecipante</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Importo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Stato</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const badge = STATUS_BADGES[row.status] ?? { label: row.status, className: 'bg-gray-100 text-gray-700' };
                  const actionable = row.status === 'REFUND_PENDING' || row.status === 'REFUND_FAILED';
                  return (
                    <tr key={row.bookingId} className="border-b border-gray-100 align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{row.guidedTrip.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatStoredDay(row.guidedTrip.startDate, { day: 'numeric', month: 'short' })} – {formatStoredDay(row.guidedTrip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                          {row.userCancellation
                            ? ' · disdetta dell\'utente'
                            : row.guidedTrip.cancelledAt
                              ? ` · annullato il ${new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).format(new Date(row.guidedTrip.cancelledAt))}`
                              : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.guidedTrip.organizerName}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{row.participantName}</p>
                        <p className="text-xs text-gray-500">{row.participantEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{formatEuro(row.amountPaid)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        {row.status === 'REFUND_FAILED' && row.refundFailureReason && <p className="mt-1 max-w-xs text-xs text-red-700">{row.refundFailureReason}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {actionable && (
                          <button
                            type="button"
                            disabled={processingBookingId !== null}
                            onClick={() => refund(row.bookingId)}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {processingBookingId === row.bookingId ? 'Rimborso…' : row.status === 'REFUND_FAILED' ? 'Riprova' : 'Rimborsa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
