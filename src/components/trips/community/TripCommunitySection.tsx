'use client'

import { useCallback, useEffect, useRef, useState, KeyboardEvent, FormEvent } from 'react'
import Link from 'next/link'
import { StarDisplay, StarInput } from '@/components/trips/community/StarRating'
import { COMMUNITY_TEXT_MAX_LENGTH } from '@/schemas/trip-community'
import {
  formatAverageRating,
  TripCommentItem,
  TripCommentsResponse,
  TripReviewsResponse,
} from '@/types/trip-community'

type TabKey = 'reviews' | 'comments'

interface TripCommunitySectionProps {
  tripId: string
  tripSlug: string
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data?.error || fallback
  } catch {
    return fallback
  }
}

/**
 * Blocco «Opinioni dei motociclisti» nella scheda viaggio:
 * linguette Recensioni (solo acquirenti) e Commenti (discussione aperta).
 */
export function TripCommunitySection({ tripId, tripSlug }: TripCommunitySectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('reviews')
  const [reviews, setReviews] = useState<TripReviewsResponse | null>(null)
  const [comments, setComments] = useState<TripCommentsResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ reviews: null, comments: null })

  const loadReviews = useCallback(async () => {
    const response = await fetch(`/api/trips/${tripId}/reviews`, { cache: 'no-store' })
    if (!response.ok) throw new Error(await readError(response, 'Impossibile caricare le recensioni'))
    setReviews(await response.json())
  }, [tripId])

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/trips/${tripId}/comments`, { cache: 'no-store' })
    if (!response.ok) throw new Error(await readError(response, 'Impossibile caricare i commenti'))
    setComments(await response.json())
  }, [tripId])

  useEffect(() => {
    Promise.all([loadReviews(), loadComments()]).catch((error: Error) => setLoadError(error.message))
  }, [loadReviews, loadComments])

  const tabs: { key: TabKey; label: string }[] = [
    {
      key: 'reviews',
      label: reviews
        ? `Recensioni (${reviews.summary.count})${reviews.summary.average !== null ? ` · ★ ${formatAverageRating(reviews.summary.average)}` : ''}`
        : 'Recensioni',
    },
    { key: 'comments', label: comments ? `Commenti (${comments.total})` : 'Commenti' },
  ]

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const order: TabKey[] = ['reviews', 'comments']
    const index = order.indexOf(activeTab)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % order.length
    if (event.key === 'ArrowLeft') next = (index - 1 + order.length) % order.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = order.length - 1
    setActiveTab(order[next])
    tabRefs.current[order[next]]?.focus()
  }

  const loginHref = `/auth/signin?callbackUrl=${encodeURIComponent(`/trips/${tripSlug}`)}`

  return (
    <section className="mt-12 pt-8 border-t border-gray-200" aria-labelledby="trip-community-title">
      <h2 id="trip-community-title" className="text-2xl font-bold text-gray-900 mb-4">
        Opinioni dei motociclisti
      </h2>

      <div role="tablist" aria-label="Recensioni e commenti" className="flex border-b-2 border-gray-200 mb-6">
        {tabs.map(tab => {
          const selected = activeTab === tab.key
          return (
            <button
              key={tab.key}
              ref={element => { tabRefs.current[tab.key] = element }}
              type="button"
              role="tab"
              id={`trip-community-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`trip-community-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={onTabKeyDown}
              className={`px-4 py-3 -mb-0.5 font-semibold text-sm sm:text-base border-b-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected ? 'text-blue-700 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {loadError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      )}

      <div
        role="tabpanel"
        id="trip-community-panel-reviews"
        aria-labelledby="trip-community-tab-reviews"
        hidden={activeTab !== 'reviews'}
      >
        {reviews ? (
          <ReviewsPanel tripId={tripId} data={reviews} loginHref={loginHref} onChanged={loadReviews} />
        ) : (
          !loadError && <p className="text-sm text-gray-500">Caricamento delle recensioni…</p>
        )}
      </div>

      <div
        role="tabpanel"
        id="trip-community-panel-comments"
        aria-labelledby="trip-community-tab-comments"
        hidden={activeTab !== 'comments'}
      >
        {comments ? (
          <CommentsPanel tripId={tripId} data={comments} loginHref={loginHref} onChanged={loadComments} onLoadedMore={setComments} />
        ) : (
          !loadError && <p className="text-sm text-gray-500">Caricamento dei commenti…</p>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Recensioni
// ---------------------------------------------------------------------------

interface ReviewsPanelProps {
  tripId: string
  data: TripReviewsResponse
  loginHref: string
  onChanged: () => Promise<void>
}

function ReviewsPanel({ tripId, data, loginHref, onChanged }: ReviewsPanelProps) {
  const { summary, reviews, viewer } = data
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (reviewId: string, isOwn: boolean) => {
    const question = isOwn ? 'Vuoi eliminare la tua recensione? L\'operazione non si può annullare.' : 'Vuoi eliminare questa recensione? L\'operazione non si può annullare.'
    if (!window.confirm(question)) return
    setError(null)
    const response = await fetch(`/api/trips/${tripId}/reviews/${reviewId}`, { method: 'DELETE' })
    if (!response.ok) {
      setError(await readError(response, 'Impossibile eliminare la recensione'))
      return
    }
    await onChanged()
  }

  return (
    <div>
      {summary.count > 0 && summary.average !== null ? (
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center bg-gray-50 rounded-lg p-4 mb-6">
          <div>
            <div className="text-4xl font-bold text-gray-900">{formatAverageRating(summary.average)}</div>
            <StarDisplay value={summary.average} />
            <p className="text-sm text-gray-600 mt-1">
              {formatAverageRating(summary.average)} su 5 · {summary.count} {summary.count === 1 ? 'recensione' : 'recensioni'}
            </p>
          </div>
          <ul className="space-y-1 flex-1 max-w-xs" aria-label="Distribuzione dei voti">
            {([5, 4, 3, 2, 1] as const).map(star => {
              const count = summary.distribution[star]
              const percent = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0
              return (
                <li key={star} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-16">{star} {star === 1 ? 'stella' : 'stelle'}</span>
                  <span className="flex-1 h-2 bg-gray-200 rounded" aria-hidden="true">
                    <span className="block h-2 bg-amber-500 rounded" style={{ width: `${percent}%` }} />
                  </span>
                  <span className="w-6 text-right">{count}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="text-gray-600 mb-6">Nessuna recensione ancora.</p>
      )}

      {viewer.canReview ? (
        <ReviewForm tripId={tripId} ownReview={viewer.ownReview} onSaved={onChanged} />
      ) : viewer.ownReview ? null : (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Le recensioni possono essere lasciate solo da chi ha acquistato questo viaggio. Puoi comunque partecipare alla discussione nei commenti.
          {!viewer.isAuthenticated && (
            <>
              {' '}
              <Link href={loginHref} className="font-medium underline">Accedi</Link> se lo hai già acquistato.
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <ul className="space-y-3">
        {reviews.map(review => {
          const isOwn = viewer.ownReview?.id === review.id
          return (
            <li key={review.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{review.author.name}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    ✓ Acquisto verificato
                  </span>
                  {isOwn && <span className="text-xs text-gray-500">(la tua recensione)</span>}
                </div>
                {review.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id, isOwn)}
                    className="text-sm text-gray-500 hover:text-red-700 underline"
                    aria-label={`Elimina la recensione di ${review.author.name}`}
                  >
                    Elimina
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StarDisplay value={review.rating} />
                <span className="text-sm text-gray-600">{review.rating} su 5 · {formatDate(review.createdAt)}</span>
              </div>
              {review.content && <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{review.content}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface ReviewFormProps {
  tripId: string
  ownReview: TripReviewsResponse['viewer']['ownReview']
  onSaved: () => Promise<void>
}

function ReviewForm({ tripId, ownReview, onSaved }: ReviewFormProps) {
  const [rating, setRating] = useState(ownReview?.rating ?? 0)
  const [content, setContent] = useState(ownReview?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    setRating(ownReview?.rating ?? 0)
    setContent(ownReview?.content ?? '')
  }, [ownReview?.id, ownReview?.rating, ownReview?.content])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaved(null)
    if (rating < 1) {
      setError('Seleziona un voto da 1 a 5 stelle')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, content }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Impossibile salvare la recensione'))
        return
      }
      await onSaved()
      setSaved(ownReview ? 'Recensione aggiornata.' : 'Recensione pubblicata. Grazie!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4" aria-labelledby="review-form-title">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 id="review-form-title" className="font-semibold text-gray-900">
          {ownReview ? 'Modifica la tua recensione' : 'Lascia la tua recensione'}
        </h3>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
          Hai acquistato questo viaggio
        </span>
      </div>
      <StarInput value={rating} onChange={setRating} disabled={saving} />
      <label htmlFor="trip-review-content" className="block text-sm font-medium text-gray-700 mt-3 mb-1">
        Racconta la tua esperienza (facoltativo)
      </label>
      <textarea
        id="trip-review-content"
        value={content}
        onChange={event => setContent(event.target.value)}
        maxLength={COMMUNITY_TEXT_MAX_LENGTH}
        rows={3}
        disabled={saving}
        className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500 mt-1">{content.length}/{COMMUNITY_TEXT_MAX_LENGTH} caratteri</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="mt-2 text-sm text-green-700">{saved}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? 'Salvataggio…' : ownReview ? 'Aggiorna recensione' : 'Pubblica recensione'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Commenti
// ---------------------------------------------------------------------------

interface CommentsPanelProps {
  tripId: string
  data: TripCommentsResponse
  loginHref: string
  onChanged: () => Promise<void>
  onLoadedMore: (data: TripCommentsResponse) => void
}

function CommentsPanel({ tripId, data, loginHref, onChanged, onLoadedMore }: CommentsPanelProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!content.trim()) {
      setError('Scrivi il testo del commento')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Impossibile pubblicare il commento'))
        return
      }
      setContent('')
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (comment: TripCommentItem) => {
    if (!window.confirm('Vuoi eliminare questo commento? L\'operazione non si può annullare.')) return
    setError(null)
    const response = await fetch(`/api/trips/${tripId}/comments/${comment.id}`, { method: 'DELETE' })
    if (!response.ok) {
      setError(await readError(response, 'Impossibile eliminare il commento'))
      return
    }
    await onChanged()
  }

  const handleLoadMore = async () => {
    if (!data.nextCursor) return
    setLoadingMore(true)
    setError(null)
    try {
      const response = await fetch(`/api/trips/${tripId}/comments?cursor=${encodeURIComponent(data.nextCursor)}`, { cache: 'no-store' })
      if (!response.ok) {
        setError(await readError(response, 'Impossibile caricare altri commenti'))
        return
      }
      const next: TripCommentsResponse = await response.json()
      onLoadedMore({ ...next, comments: [...data.comments, ...next.comments] })
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      {data.viewer.canComment ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-gray-200 p-4">
          <label htmlFor="trip-comment-content" className="block text-sm font-medium text-gray-700 mb-1">
            Scrivi un commento
          </label>
          <textarea
            id="trip-comment-content"
            value={content}
            onChange={event => setContent(event.target.value)}
            maxLength={COMMUNITY_TEXT_MAX_LENGTH}
            rows={3}
            disabled={saving}
            placeholder="Consigli, aggiornamenti sulle strade, domande…"
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{content.length}/{COMMUNITY_TEXT_MAX_LENGTH} caratteri</p>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Pubblicazione…' : 'Pubblica commento'}
          </button>
        </form>
      ) : (
        <p className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Link href={loginHref} className="font-medium underline">Accedi</Link> per partecipare alla discussione.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {data.comments.length === 0 ? (
        <p className="text-gray-600">Nessun commento ancora. Apri tu la discussione!</p>
      ) : (
        <ul className="space-y-3">
          {data.comments.map(comment => (
            <li key={comment.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{comment.author.name}</span>
                  {comment.isTripAuthor && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      Autore del viaggio
                    </span>
                  )}
                </div>
                {comment.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment)}
                    className="text-sm text-gray-500 hover:text-red-700 underline"
                    aria-label={`Elimina il commento di ${comment.author.name}`}
                  >
                    Elimina
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(comment.createdAt)}</p>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      {data.nextCursor && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-60"
        >
          {loadingMore ? 'Caricamento…' : 'Mostra altri'}
        </button>
      )}
    </div>
  )
}
