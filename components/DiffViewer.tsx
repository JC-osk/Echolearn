import React from 'react';

interface DiffViewerProps {
  original: string;
  input: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ original, input }) => {
  // Simple diff logic: exact match check for demo purposes.
  // Ideally, one would use a library like 'diff' or 'diff-match-patch',
  // but we are sticking to pure React implementation without complex external deps if possible.
  
  // Normalizing for comparison (ignore case, punctuation spacing)
  const normOriginal = original.trim();
  const normInput = input.trim();

  const isPerfectMatch = normOriginal.toLowerCase() === normInput.toLowerCase();

  if (isPerfectMatch) {
    return <div className="text-green-600 font-medium mt-1">✓ Perfect Match</div>;
  }

  return (
    <div className="mt-2 text-sm bg-red-50 p-2 rounded border border-red-100">
      <div className="flex gap-2 mb-1">
        <span className="font-semibold text-gray-500 w-16">Correct:</span>
        <span className="text-green-700">{original}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-semibold text-gray-500 w-16">Yours:</span>
        <span className="text-red-600 line-through decoration-red-400">{input || "(Empty)"}</span>
      </div>
    </div>
  );
};

export default DiffViewer;
