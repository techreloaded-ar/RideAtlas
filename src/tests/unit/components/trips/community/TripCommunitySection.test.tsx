/**
 * Blocco «Opinioni dei motociclisti» nella scheda viaggio
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripCommunitySection } from '@/components/trips/community/TripCommunitySection';
import type { TripCommentsResponse, TripReviewsResponse } from '@/types/trip-community';

jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

const emptyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function reviewsResponse(overrides: Partial<TripReviewsResponse> = {}): TripReviewsResponse {
  return {
    summary: { average: 4.5, count: 2, distribution: { ...emptyDistribution, 4: 1, 5: 1 } },
    reviews: [
      { id: 'r-1', rating: 5, content: 'Tracce perfette', createdAt: '2026-11-03T10:00:00Z', updatedAt: '2026-11-03T10:00:00Z', author: { id: 'u-1', name: 'Marco B.' }, canDelete: false },
      { id: 'r-2', rating: 4, content: null, createdAt: '2026-10-21T10:00:00Z', updatedAt: '2026-10-21T10:00:00Z', author: { id: 'u-3', name: 'Luca F.' }, canDelete: false },
    ],
    viewer: { isAuthenticated: false, canReview: false, ownReview: null },
    ...overrides,
  };
}

function commentsResponse(overrides: Partial<TripCommentsResponse> = {}): TripCommentsResponse {
  return {
    comments: [
      { id: 'c-1', content: 'Passo Giau chiuso', createdAt: '2026-11-20T10:00:00Z', author: { id: 'u-2', name: 'Paolo M.' }, isTripAuthor: false, canDelete: false },
      { id: 'c-2', content: 'Grazie Paolo!', createdAt: '2026-11-21T10:00:00Z', author: { id: 'ranger-1', name: 'Giulia Rossi' }, isTripAuthor: true, canDelete: false },
    ],
    total: 2,
    nextCursor: null,
    viewer: { isAuthenticated: false, canComment: false },
    ...overrides,
  };
}

function mockApi(reviews: TripReviewsResponse, comments: TripCommentsResponse) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || 'GET';
    if (url.endsWith('/reviews') && method === 'GET') return new Response(JSON.stringify(reviews), { status: 200 });
    if (url.includes('/comments') && method === 'GET') return new Response(JSON.stringify(comments), { status: 200 });
    if (url.endsWith('/reviews') && method === 'POST') return new Response(JSON.stringify({ id: 'r-new', created: true }), { status: 201 });
    if (url.endsWith('/comments') && method === 'POST') return new Response(JSON.stringify({ id: 'c-new' }), { status: 201 });
    if (method === 'DELETE') return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
    return new Response('{}', { status: 404 });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('TripCommunitySection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mostra le linguette con conteggi e media, con Recensioni selezionata', async () => {
    mockApi(reviewsResponse(), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    expect(screen.getByRole('heading', { name: 'Opinioni dei motociclisti' })).toBeInTheDocument();
    const reviewsTab = await screen.findByRole('tab', { name: 'Recensioni (2) · ★ 4,5' });
    expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Commenti (2)' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('4,5 su 5 · 2 recensioni')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Acquisto verificato')).toHaveLength(2);
  });

  it('spiega a chi non ha acquistato che le recensioni sono riservate agli acquirenti', async () => {
    mockApi(reviewsResponse({ viewer: { isAuthenticated: true, canReview: false, ownReview: null } }), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    expect(await screen.findByText(/Le recensioni possono essere lasciate solo da chi ha acquistato questo viaggio/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pubblica recensione' })).not.toBeInTheDocument();
  });

  it('permette a chi ha acquistato di pubblicare una recensione con voto e testo', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi(reviewsResponse({ viewer: { isAuthenticated: true, canReview: true, ownReview: null } }), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    expect(await screen.findByText('Hai acquistato questo viaggio')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pubblica recensione' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Seleziona un voto da 1 a 5 stelle');

    await user.click(screen.getByLabelText('4 stelle'));
    expect(screen.getByText('4 su 5')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Racconta la tua esperienza (facoltativo)'), 'Tappa 3 lunga');
    await user.click(screen.getByRole('button', { name: 'Pubblica recensione' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/trips/trip-1/reviews', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rating: 4, content: 'Tappa 3 lunga' }),
    })));
    expect(await screen.findByText('Recensione pubblicata. Grazie!')).toBeInTheDocument();
  });

  it('precompila il modulo con la recensione esistente', async () => {
    mockApi(reviewsResponse({ viewer: { isAuthenticated: true, canReview: true, ownReview: { id: 'r-1', rating: 5, content: 'Tracce perfette' } } }), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    expect(await screen.findByRole('heading', { name: 'Modifica la tua recensione' })).toBeInTheDocument();
    expect(screen.getByLabelText('5 stelle')).toBeChecked();
    expect(screen.getByLabelText('Racconta la tua esperienza (facoltativo)')).toHaveValue('Tracce perfette');
    expect(screen.getByRole('button', { name: 'Aggiorna recensione' })).toBeInTheDocument();
  });

  it('mostra i commenti con il badge dell\'autore del viaggio e invita ad accedere', async () => {
    const user = userEvent.setup();
    mockApi(reviewsResponse(), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    await user.click(await screen.findByRole('tab', { name: 'Commenti (2)' }));
    const panel = screen.getByRole('tabpanel', { name: 'Commenti (2)' });
    expect(within(panel).getByText('Passo Giau chiuso')).toBeInTheDocument();
    expect(within(panel).getByText('Autore del viaggio')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Accedi' })).toHaveAttribute('href', '/auth/signin?callbackUrl=%2Ftrips%2Fdolomiti');
  });

  it('permette a un utente autenticato di commentare', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi(reviewsResponse(), commentsResponse({ viewer: { isAuthenticated: true, canComment: true } }));
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    await user.click(await screen.findByRole('tab', { name: 'Commenti (2)' }));
    await user.type(screen.getByLabelText('Scrivi un commento'), 'Ottimo itinerario');
    await user.click(screen.getByRole('button', { name: 'Pubblica commento' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/trips/trip-1/comments', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ content: 'Ottimo itinerario' }),
    })));
    expect(screen.getByLabelText('Scrivi un commento')).toHaveValue('');
  });

  it('elimina un commento dopo conferma solo se permesso', async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = mockApi(reviewsResponse(), commentsResponse({
      comments: [{ id: 'c-1', content: 'Mio commento', createdAt: '2026-11-20T10:00:00Z', author: { id: 'u-2', name: 'Paolo M.' }, isTripAuthor: false, canDelete: true }],
      total: 1,
      viewer: { isAuthenticated: true, canComment: true },
    }));
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    await user.click(await screen.findByRole('tab', { name: 'Commenti (1)' }));
    await user.click(screen.getByRole('button', { name: 'Elimina il commento di Paolo M.' }));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/trips/trip-1/comments/c-1', { method: 'DELETE' }));
  });

  it('cambia linguetta con le frecce della tastiera', async () => {
    const user = userEvent.setup();
    mockApi(reviewsResponse(), commentsResponse());
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    const reviewsTab = await screen.findByRole('tab', { name: 'Recensioni (2) · ★ 4,5' });
    reviewsTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Commenti (2)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Commenti (2)' })).toHaveFocus();
  });

  it('mostra «Mostra altri» quando ci sono più commenti', async () => {
    const user = userEvent.setup();
    mockApi(reviewsResponse(), commentsResponse({ total: 25, nextCursor: 'c-2' }));
    render(<TripCommunitySection tripId="trip-1" tripSlug="dolomiti" />);

    await user.click(await screen.findByRole('tab', { name: 'Commenti (25)' }));
    expect(screen.getByRole('button', { name: 'Mostra altri' })).toBeInTheDocument();
  });
});
