import { render, screen } from '@testing-library/react';
import { RangerProfileHeader } from '@/components/ranger/RangerProfileHeader';
import type { RangerProfile } from '@/types/ranger';

describe('RangerProfileHeader', () => {
  const mockRanger: RangerProfile = {
    id: 'ranger1',
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
    bio: 'Passionate motorcycle rider with 10 years experience.',
    socialLinks: {
      instagram: 'https://instagram.com/johndoe',
      facebook: 'https://facebook.com/johndoe',
    },
    isActive: true,
  };

  it('should render ranger name', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render bio when provided', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    expect(
      screen.getByText('Passionate motorcycle rider with 10 years experience.')
    ).toBeInTheDocument();
  });

  it('should show placeholder when bio is null (FR-013)', () => {
    const rangerWithoutBio = { ...mockRanger, bio: null };
    render(<RangerProfileHeader ranger={rangerWithoutBio} />);
    expect(screen.getByText('Biografia non disponibile.')).toBeInTheDocument();
  });

  it('should render avatar image when provided', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    const image = screen.getByAltText('John Doe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('avatar.jpg'));
  });

  it('should render generated avatar when image is null', () => {
    const rangerWithoutImage = { ...mockRanger, image: null };
    render(<RangerProfileHeader ranger={rangerWithoutImage} />);
    const generatedAvatar = screen.getByTestId('generated-avatar');
    expect(generatedAvatar).toBeInTheDocument();
    expect(generatedAvatar).toHaveTextContent('JD'); // Initials from "John Doe"
  });

  it('should render social links when provided', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    const socialSection = screen.getByTestId('social-links');
    expect(socialSection).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: /profile$/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://instagram.com/johndoe');
    expect(links[1]).toHaveAttribute('href', 'https://facebook.com/johndoe');
  });

  it('should hide social section when socialLinks is null', () => {
    const rangerWithoutSocial = { ...mockRanger, socialLinks: null };
    render(<RangerProfileHeader ranger={rangerWithoutSocial} />);
    expect(screen.queryByTestId('social-links')).not.toBeInTheDocument();
  });

  it('should hide social section when socialLinks is empty object', () => {
    const rangerWithEmptySocial = { ...mockRanger, socialLinks: {} };
    render(<RangerProfileHeader ranger={rangerWithEmptySocial} />);
    expect(screen.queryByTestId('social-links')).not.toBeInTheDocument();
  });

  it('CRITICAL: MUST NOT render or expose email anywhere (FR-008)', () => {
    const { container } = render(<RangerProfileHeader ranger={mockRanger} />);

    // Check text content does not contain @
    expect(container.textContent).not.toMatch(/@/);

    // Check HTML does not contain the word "email"
    expect(container.innerHTML.toLowerCase()).not.toContain('email');
  });

  it('should open social links in new tab', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    const links = screen.getAllByRole('link', { name: /profile$/i });

    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should generate correct initials for single name', () => {
    const rangerSingleName = { ...mockRanger, name: 'Madonna', image: null };
    render(<RangerProfileHeader ranger={rangerSingleName} />);
    const generatedAvatar = screen.getByTestId('generated-avatar');
    expect(generatedAvatar).toHaveTextContent('M'); // Single name = single initial
  });

  it('should generate correct initials for three names', () => {
    const rangerThreeNames = {
      ...mockRanger,
      name: 'John Paul Smith',
      image: null,
    };
    render(<RangerProfileHeader ranger={rangerThreeNames} />);
    const generatedAvatar = screen.getByTestId('generated-avatar');
    expect(generatedAvatar).toHaveTextContent('JP'); // First 2 letters only
  });

  it('should display accessible aria labels for social links', () => {
    render(<RangerProfileHeader ranger={mockRanger} />);
    expect(screen.getByLabelText('instagram profile')).toBeInTheDocument();
    expect(screen.getByLabelText('facebook profile')).toBeInTheDocument();
  });
});
