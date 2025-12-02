import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { FlashCard } from '../types';
import { Spinner } from './Spinner';

interface SelectionPopupProps {
  selection: {
    text: string;
    context: string;
    contextTranslation: string;
    rect: DOMRect;
  } | null;
  onClose: () => void;
  onSave: (card: FlashCard) => void;
}

const SelectionPopup: React.FC<SelectionPopupProps> = ({ selection, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ definition_cn: string; ipa: string } | null>(null);

  useEffect(() => {
    if (selection) {
      setLoading(true);
      setResult(null);

      geminiService.getWordDefinition(selection.text, selection.context)
        .then(data => {
          setResult(data);
        })
        .catch(e => {
          console.error("Error fetching definition:", e);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selection?.text, selection?.context]);

  if (!selection) return null;

  const handleSave = () => {
    if (result) {
      const newCard: FlashCard = {
        id: Date.now().toString(),
        word: selection.text,
        context: selection.context, // Original context
        definition_cn: result.definition_cn,
        ipa: result.ipa,
        example_original: selection.context, // Use audio sentence
        example_cn: selection.contextTranslation // Use audio translation
      };
      onSave(newCard);
      onClose();
    }
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: selection.rect.left + selection.rect.width / 2,
    top: selection.rect.top + window.scrollY - 10,
    transform: 'translate(-50%, -100%)',
    zIndex: 50,
  };

  return (
    <div 
      style={style} 
      className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 flex flex-col gap-3 transition-all duration-200 ease-out z-50"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="pr-4">
          <h3 className="font-bold text-lg text-slate-800 break-words leading-tight">
            {selection.text}
          </h3>
          {result && (
            <span className="text-indigo-500 font-mono text-sm font-medium block mt-0.5">
              {result.ipa}
            </span>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-600 p-1 -mr-2 -mt-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {loading && (
        <div className="py-4 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
           <Spinner />
           <span>Consulting Gemini...</span>
        </div>
      )}

      {!loading && !result && (
        <div className="text-red-500 text-sm py-2">
          Could not load definition.
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          {/* Brief Definition */}
          <div className="text-slate-700 text-base leading-snug">
            {result.definition_cn}
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Create Flashcard
          </button>
        </div>
      )}
      
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white border-b border-r border-slate-200"></div>
    </div>
  );
};

export default SelectionPopup;
