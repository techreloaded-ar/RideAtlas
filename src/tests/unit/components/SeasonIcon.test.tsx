// src/tests/unit/components/SeasonIcon.test.tsx
import { render } from '../../setup/test-utils';
import { SeasonIcon } from '@/components/ui/SeasonIcon';
import { RecommendedSeason } from '@/types/trip';

describe('SeasonIcon', () => {
  describe('renders correct icon for each season', () => {
    it('renders Snowflake icon for Inverno', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Inverno} />);
      const snowflakeIcon = container.querySelector('.lucide-snowflake');
      expect(snowflakeIcon).toBeInTheDocument();
      expect(snowflakeIcon).toHaveClass('w-4', 'h-4');
    });

    it('renders Flower2 icon for Primavera', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Primavera} />);
      const flowerIcon = container.querySelector('.lucide-flower-2');
      expect(flowerIcon).toBeInTheDocument();
      expect(flowerIcon).toHaveClass('w-4', 'h-4');
    });

    it('renders Sun icon for Estate', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Estate} />);
      const sunIcon = container.querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();
      expect(sunIcon).toHaveClass('w-4', 'h-4');
    });

    it('renders Leaf icon for Autunno', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Autunno} />);
      const leafIcon = container.querySelector('.lucide-leaf');
      expect(leafIcon).toBeInTheDocument();
      expect(leafIcon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('size prop', () => {
    it('applies default size class w-4 h-4', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Estate} />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('applies custom size class', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Estate} size="w-6 h-6" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-6', 'h-6');
    });

    it('applies custom size class for small icons', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Inverno} size="w-3 h-3" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('w-3', 'h-3');
    });
  });

  describe('fallback behavior', () => {
    it('renders Sun icon as fallback for invalid season value', () => {
      // Cast per testare il fallback con valore non gestito
      const invalidSeason = 'InvalidSeason' as RecommendedSeason;
      const { container } = render(<SeasonIcon season={invalidSeason} />);
      const sunIcon = container.querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();
      expect(sunIcon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('icon accessibility', () => {
    it('renders svg element with proper structure', () => {
      const { container } = render(<SeasonIcon season={RecommendedSeason.Primavera} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('maintains consistent icon structure across seasons', () => {
      const seasons = [
        RecommendedSeason.Inverno,
        RecommendedSeason.Primavera,
        RecommendedSeason.Estate,
        RecommendedSeason.Autunno
      ];

      seasons.forEach(season => {
        const { container } = render(<SeasonIcon season={season} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      });
    });
  });
});