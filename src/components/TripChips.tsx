import { Clock, MapPin, Mountain, Leaf, Sun } from 'lucide-react';

interface TripChipsProps {
  duration: string;
  location: string;
  terrain: string;
  seasons: string[];
}

export function TripChips({ duration, location, terrain, seasons }: TripChipsProps) {
  return (
    <div className="flex gap-3 items-center mb-4 flex-wrap">
      {/* Duration chip */}
      <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        <span>{duration}</span>
      </div>

      {/* Location chip */}
      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
        <MapPin className="w-4 h-4" />
        <span>{location}</span>
      </div>

      {/* Terrain chip */}
      <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
        <Mountain className="w-4 h-4" />
        <span>{terrain}</span>
      </div>

      {/* Season chips */}
      {seasons.map((season, index) => (
        <div 
          key={index}
          className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
        >
          {season === 'Autunno' ? <Leaf className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span>{season}</span>
        </div>
      ))}
    </div>
  );
}