import React, { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError("Please upload a valid audio file.");
        return;
      }
      // Limit to ~10MB for this demo to ensure reliable inline processing
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit for this demo.");
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
      <div className="mb-4 text-indigo-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">Upload Audio for Shadowing</h3>
      <p className="text-slate-500 mb-6 text-center max-w-md">
        Select an audio file (MP3, WAV, etc.) to automatically transcribe, translate, and segment using Gemini AI.
      </p>
      
      <label className={`relative cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <span>{isLoading ? 'Processing...' : 'Select Audio File'}</span>
        <input 
          type="file" 
          accept="audio/*" 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={isLoading}
        />
      </label>
      
      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default FileUpload;
