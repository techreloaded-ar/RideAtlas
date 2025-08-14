import { User, Calendar } from 'lucide-react';

interface TripMetaProps {
  author: string;
  travelDate?: Date | null;
}

// Funzione per formattare la data
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export function TripMeta({ author, travelDate }: TripMetaProps) {
  return (
    <div className="flex gap-6 text-sm text-gray-500 mb-6">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4" />
        <span>Creato da: <span className="text-gray-700">{author}</span></span>
      </div>
      {travelDate && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Viaggio del: <span className="text-gray-700">{formatDate(travelDate)}</span></span>
        </div>
      )}
    </div>
  );
}