/**
 * Integration Test: Ranger Profile Page
 *
 * Tests the complete profile page integration with mocked server actions
 *
 * Coverage:
 * - FR-001: Visualizzazione nome Ranger
 * - FR-002: Visualizzazione foto profilo
 * - FR-003: Visualizzazione biografia
 * - FR-004: Visualizzazione link social
 * - FR-006: Visualizzazione lista viaggi
 * - FR-008: Privacy email (CRITICAL)
 * - FR-012: Gestione errori 404
 * - FR-015: Empty state viaggi
 */

import { render, screen, waitFor } from '@testing-library/react';
import RangerProfilePage from '@/app/ranger/[username]/page';
import { getRangerProfile } from '@/lib/actions/ranger';
import type { RangerProfileResult } from '@/types/ranger';

// Mock the server action
jest.mock('@/lib/actions/ranger', () => ({
  getRangerProfile: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const mockGetRangerProfile = getRangerProfile as jest.MockedFunction<typeof getRangerProfile>;

describe('RangerProfilePage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful profile rendering', () => {
    it('should render complete profile with all sections', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-1',
            name: 'Marco Rossi',
            image: 'https://example.com/avatar.jpg',
            bio: 'Appassionato di viaggi in moto da 10 anni',
            socialLinks: {
              instagram: 'https://instagram.com/marcorossi',
              facebook: 'https://facebook.com/marcorossi',
            },
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [
            {
              id: 'trip-1',
              title: 'Viaggio attraverso le Dolomiti',
              slug: 'viaggio-dolomiti',
              thumbnailUrl: 'https://example.com/trip1.jpg',
              durationDays: 5,
              distanceKm: null,
            },
            {
              id: 'trip-2',
              title: 'Costa Amalfitana in moto',
              slug: 'costa-amalfitana',
              thumbnailUrl: null,
              durationDays: 3,
              distanceKm: null,
            },
          ],
          totalTripsCount: 2,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Marco Rossi' } });
      const { container } = render(page);

      // Assert - Profile Header
      expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
      expect(screen.getByText('Appassionato di viaggi in moto da 10 anni')).toBeInTheDocument();

      // Assert - Trips List
      expect(screen.getByText('Viaggi di Marco Rossi')).toBeInTheDocument();
      expect(screen.getByText('Viaggio attraverso le Dolomiti')).toBeInTheDocument();
      expect(screen.getByText('Costa Amalfitana in moto')).toBeInTheDocument();

      // Assert - Duration display
      expect(screen.getByText('5 giorni')).toBeInTheDocument();
      expect(screen.getByText('3 giorni')).toBeInTheDocument();

      // CRITICAL: FR-008 - Email MUST NOT be present in DOM
      expect(container.innerHTML).not.toContain('@');
      expect(container.innerHTML.toLowerCase()).not.toContain('email');
    });

    it('should handle profile with no bio (FR-013)', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-2',
            name: 'Lucia Bianchi',
            image: null,
            bio: null,
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Lucia Bianchi' } });
      render(page);

      // Assert - FR-013: Placeholder for null bio
      expect(screen.getByText('Nessuna informazione personale')).toBeInTheDocument();
    });

    it('should handle profile with no image (FR-014)', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-3',
            name: 'Giovanni Verdi',
            image: null,
            bio: 'Test bio',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Giovanni Verdi' } });
      const { container } = render(page);

      // Assert - FR-014: Generated avatar with initials
      const generatedAvatar = container.querySelector('[class*="rounded-full"]');
      expect(generatedAvatar).toBeInTheDocument();
      expect(generatedAvatar?.textContent).toMatch(/^[A-Z]{1,2}$/); // Initials
    });
  });

  describe('Empty states', () => {
    it('should handle Ranger with no published trips (FR-015)', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-4',
            name: 'Anna Neri',
            image: null,
            bio: 'Nuova ranger',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Anna Neri' } });
      render(page);

      // Assert - FR-015: Empty state message
      expect(screen.getByText(/nessun viaggio pubblicato/i)).toBeInTheDocument();
      expect(screen.getByText('Anna Neri')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle NOT_FOUND error (FR-012)', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Ranger non trovato',
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act & Assert
      const page = RangerProfilePage({ params: { username: 'non-existent' } });
      await expect(page).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('should handle INVALID_ROLE error', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: false,
        error: {
          type: 'INVALID_ROLE',
          message: 'Utente non è un Ranger',
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act & Assert
      const page = RangerProfilePage({ params: { username: 'explorer-user' } });
      await expect(page).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });

  describe('Data integrity', () => {
    it('should call getRangerProfile with correct username', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-5',
            name: 'Test User',
            image: null,
            bio: null,
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      await RangerProfilePage({ params: { username: 'Test User' } });

      // Assert
      expect(mockGetRangerProfile).toHaveBeenCalledWith('Test User');
      expect(mockGetRangerProfile).toHaveBeenCalledTimes(1);
    });

    it('CRITICAL: should NEVER expose email field (FR-008)', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-6',
            name: 'Privacy Test',
            image: null,
            bio: 'Testing privacy compliance',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Privacy Test' } });
      const { container } = render(page);

      // Assert - Multiple checks for email exposure
      expect(container.innerHTML).not.toContain('email');
      expect(container.innerHTML).not.toContain('@');
      expect(container.innerHTML).not.toContain('mailto:');

      // Verify ranger type doesn't have email property
      const rangerData = mockResult.success ? mockResult.data.ranger : null;
      expect(rangerData).toBeDefined();
      expect(rangerData).not.toHaveProperty('email');
    });
  });

  describe('Social links rendering', () => {
    it('should hide social section when socialLinks is null', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-7',
            name: 'No Social User',
            image: null,
            bio: 'No social links',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'No Social User' } });
      const { container } = render(page);

      // Assert - No social links should be rendered
      expect(container.querySelector('[aria-label*="profile"]')).not.toBeInTheDocument();
    });

    it('should render social links when provided', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-8',
            name: 'Social User',
            image: null,
            bio: 'Has social links',
            socialLinks: {
              instagram: 'https://instagram.com/socialuser',
              youtube: 'https://youtube.com/@socialuser',
            },
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Social User' } });
      render(page);

      // Assert - Social links should be rendered
      expect(screen.getByLabelText('instagram profile')).toBeInTheDocument();
      expect(screen.getByLabelText('youtube profile')).toBeInTheDocument();

      // Assert - Social links should have text labels (UX improvement)
      expect(screen.getByText('instagram')).toBeInTheDocument();
      expect(screen.getByText('youtube')).toBeInTheDocument();
    });
  });

  describe('UI/UX improvements', () => {
    it('should display "Ranger Verificato" badge', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-9',
            name: 'Badge Test',
            image: null,
            bio: 'Test for badge',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [],
          totalTripsCount: 0,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Badge Test' } });
      render(page);

      // Assert - Badge should be visible
      expect(screen.getByText('Ranger Verificato')).toBeInTheDocument();
    });

    it('should display trips count stat', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-10',
            name: 'Stats Test',
            image: null,
            bio: 'Test for stats',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [
            {
              id: 'trip-1',
              title: 'Trip 1',
              slug: 'trip-1',
              thumbnailUrl: null,
              durationDays: 5,
              distanceKm: null,
            },
            {
              id: 'trip-2',
              title: 'Trip 2',
              slug: 'trip-2',
              thumbnailUrl: null,
              durationDays: 3,
              distanceKm: null,
            },
            {
              id: 'trip-3',
              title: 'Trip 3',
              slug: 'trip-3',
              thumbnailUrl: null,
              durationDays: 7,
              distanceKm: null,
            },
          ],
          totalTripsCount: 3,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Stats Test' } });
      render(page);

      // Assert - Should display trip count (3 viaggi)
      expect(screen.getByText('3')).toBeInTheDocument();
      // Verifica che il numero e la parola "viaggi" siano presenti insieme nello stats
      const statsSection = screen.getByText('3').closest('div');
      expect(statsSection).toHaveTextContent(/3\s*viaggi/i);
    });

    it('should display singular "viaggio" for one trip', async () => {
      // Arrange
      const mockResult: RangerProfileResult = {
        success: true,
        data: {
          ranger: {
            id: 'ranger-11',
            name: 'Single Trip Test',
            image: null,
            bio: 'Test for singular',
            socialLinks: null,
            isActive: true,
            bikeDescription: null,
            bikePhotos: [],
          },
          trips: [
            {
              id: 'trip-1',
              title: 'Solo Trip',
              slug: 'solo-trip',
              thumbnailUrl: null,
              durationDays: 5,
              distanceKm: null,
            },
          ],
          totalTripsCount: 1,
        },
      };

      mockGetRangerProfile.mockResolvedValue(mockResult);

      // Act
      const page = await RangerProfilePage({ params: { username: 'Single Trip Test' } });
      render(page);

      // Assert - Should display singular form (1 viaggio)
      expect(screen.getByText('1')).toBeInTheDocument();
      // Verifica che il numero e la parola "viaggio" (singolare) siano presenti insieme
      const statsSection = screen.getByText('1').closest('div');
      expect(statsSection).toHaveTextContent(/1\s*viaggio/i);
    });
  });
});
