import { render, screen, waitFor } from '../setup/test-utils';
import userEvent from '@testing-library/user-event';
import { useSession, signOut, getProviders } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import SignIn from '@/app/auth/signin/page';
import { UserRole } from '@/types/profile';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  getProviders: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockGetProviders = getProviders as jest.MockedFunction<typeof getProviders>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockPush = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

describe('Logout Redirect Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);
    
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as any);
    mockGetProviders.mockResolvedValue({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google',
      },
    });
    
    // Reset window.location.href
    window.location.href = '';
  });

  const mockAuthenticatedSession = {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.Explorer,
      image: null,
    },
  };

  describe('Complete logout flow', () => {
    it('successfully logs out and redirects to signin with success message', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated session
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      });
      
      // Mock successful signOut
      mockSignOut.mockResolvedValue(undefined);

      render(<Navbar />);

      // Open user menu and click logout
      const userMenuButton = screen.getByRole('button', { name: /TU/i });
      await user.click(userMenuButton);

      const logoutButton = screen.getByRole('button', { name: /esci/i });
      await user.click(logoutButton);

      // Verify signOut was called with correct parameters
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/auth/signin?message=logout-success',
          redirect: true,
        });
      });
    });

    it('handles logout failure with fallback redirect', async () => {
      const user = userEvent.setup();
      
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      });
      
      // Mock signOut failure
      mockSignOut.mockRejectedValue(new Error('Network error'));

      render(<Navbar />);

      // Open user menu and click logout
      const userMenuButton = screen.getByRole('button', { name: /TU/i });
      await user.click(userMenuButton);

      const logoutButton = screen.getByRole('button', { name: /esci/i });
      await user.click(logoutButton);

      // Verify fallback redirect was used
      await waitFor(() => {
        expect(window.location.href).toBe('/auth/signin?message=logout-success');
      });
    });
  });

  describe('SignIn page after logout', () => {
    it('displays logout success message when redirected from logout', () => {
      // Mock search params to simulate redirect from logout
      const mockSearchParams = new URLSearchParams('message=logout-success');
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      render(<SignIn />);

      // Verify logout success message is displayed
      expect(screen.getByText(/logout completato con successo/i)).toBeInTheDocument();
      
      // Verify it has success styling (green)
      const messageText = screen.getByText(/logout completato con successo/i);
      const messageContainer = messageText.closest('div');
      const outerContainer = messageContainer?.parentElement;
      expect(outerContainer).toHaveClass('bg-green-50', 'border-green-200');
    });
  });

  describe('Cross-page logout consistency', () => {
    it('logout works from different authenticated states', async () => {
      const user = userEvent.setup();
      
      // Test with different user roles
      const sentinelSession = {
        ...mockAuthenticatedSession,
        user: {
          ...mockAuthenticatedSession.user,
          role: UserRole.Sentinel,
        },
      };

      mockUseSession.mockReturnValue({
        data: sentinelSession,
        status: 'authenticated',
        update: jest.fn(),
      });
      
      mockSignOut.mockResolvedValue(undefined);

      render(<Navbar />);

      // Verify Sentinel user sees admin link
      const userMenuButton = screen.getByRole('button', { name: /TU/i });
      await user.click(userMenuButton);
      
      expect(screen.getByText(/amministrazione/i)).toBeInTheDocument();

      // Logout should still work the same way
      const logoutButton = screen.getByRole('button', { name: /esci/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/auth/signin?message=logout-success',
          redirect: true,
        });
      });
    });
  });

  describe('Mobile logout flow', () => {
    it('mobile logout works with same redirect behavior', async () => {
      const user = userEvent.setup();
      
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      });
      
      mockSignOut.mockResolvedValue(undefined);

      render(<Navbar />);

      // Open mobile menu
      const mobileMenuButton = screen.getByRole('button', { name: /apri menu principale/i });
      await user.click(mobileMenuButton);

      // Find and click mobile logout button
      const mobileLogoutButtons = screen.getAllByRole('button', { name: /esci/i });
      const mobileLogoutButton = mobileLogoutButtons.find(button => 
        button.className.includes('text-base')
      );
      
      expect(mobileLogoutButton).toBeDefined();
      await user.click(mobileLogoutButton!);

      // Verify same signOut behavior as desktop
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/auth/signin?message=logout-success',
          redirect: true,
        });
      });
    });
  });
});