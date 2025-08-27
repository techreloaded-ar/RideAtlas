import { Snowflake, Flower2, Sun, Leaf } from 'lucide-react';
import { RecommendedSeason } from '@/types/trip';

interface SeasonIconProps {
  season: RecommendedSeason;
  size?: string;
}

/**
 * Componente per visualizzare l'icona appropriata per una stagione specifica
 * @param season - Stagione tipizzata (RecommendedSeason enum)
 * @param size - Classe CSS per la dimensione (default: "w-4 h-4")
 */
export const SeasonIcon = ({ season, size = "w-4 h-4" }: SeasonIconProps) => {
  switch (season) {
    case RecommendedSeason.Inverno:
      return <Snowflake className={size} />;
    case RecommendedSeason.Primavera:
      return <Flower2 className={size} />;
    case RecommendedSeason.Estate:
      return <Sun className={size} />;
    case RecommendedSeason.Autunno:
      return <Leaf className={size} />;
    default:
      return <Sun className={size} />;
  }
};