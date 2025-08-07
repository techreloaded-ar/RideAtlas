import { Tag } from 'lucide-react';

interface TripInfoProps {
  departureLocation?: string;
  arrivalLocation?: string;
  description: string;
  tags?: string[];
  characteristics?: string[];
}

export function TripInfo({ 
  departureLocation, 
  arrivalLocation, 
  description, 
  tags = [], 
  characteristics = [] 
}: TripInfoProps) {
  return (
    <div className="space-y-6">
      {/* Departure/Arrival Info */}
      {(departureLocation || arrivalLocation) && (
        <div className="space-y-2">
          {departureLocation && (
            <p className="mb-2">
              <strong>Località di partenza:</strong> {departureLocation}
            </p>
          )}
          {arrivalLocation && (
            <p>
              <strong>Località di arrivo:</strong> {arrivalLocation}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <p className="leading-relaxed text-[14px] mb-4">
          {description}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Tag</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Characteristics */}
      {characteristics.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Caratteristiche</h3>
          <div className="flex flex-wrap gap-2">
            {characteristics.map((characteristic: string) => (
              <span key={characteristic} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {characteristic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}