import { User, Calendar } from 'lucide-react';

interface TripMetaProps {
  author: string;
  publishDate: string;
}

export function TripMeta({ author, publishDate }: TripMetaProps) {
  return (
    <div className="flex gap-6 text-sm text-gray-500 mb-6">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4" />
        <span>Creato da: <span className="text-gray-700">{author}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>Pubblicato il: <span className="text-gray-700">{publishDate}</span></span>
      </div>
    </div>
  );
}