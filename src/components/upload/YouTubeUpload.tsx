"use client";

interface YouTubeUploadProps {
  youtubeUrl: string;
  isUploading: boolean;
  onUrlChange: (url: string) => void;
  onAdd: () => void;
}

export const YouTubeUpload = ({
  youtubeUrl,
  isUploading,
  onUrlChange,
  onAdd
}: YouTubeUploadProps) => {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Aggiungi Video YouTube</h4>
      <div className="flex gap-2">
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={isUploading}
          aria-label="URL video YouTube"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={isUploading || !youtubeUrl.trim()}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Aggiungi
        </button>
      </div>
    </div>
  );
};