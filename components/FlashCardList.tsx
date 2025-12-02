import React, { useState } from 'react';
import { FlashCard } from '../types';

interface FlashCardListProps {
  cards: FlashCard[];
  onDelete: (id: string) => void;
  onBack: () => void;
}

const FlashCardItem: React.FC<{ card: FlashCard; onDelete: (id: string) => void }> = ({ card, onDelete }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative h-64 w-full perspective-1000 group cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
           style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        
        {/* Front: Chinese Definition & Example */}
        <div className="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow overflow-hidden"
             style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
             <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">{card.definition_cn}</h3>
             <div className="relative w-full text-center">
               <p className="text-slate-500 text-sm italic">"{card.example_cn}"</p>
             </div>
          </div>
          <div className="mt-4 text-xs text-indigo-400 font-semibold uppercase tracking-wider flex-shrink-0">Tap to reveal</div>
        </div>

        {/* Back: Original, IPA, Example */}
        <div className="absolute w-full h-full backface-hidden bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center rotate-y-180 overflow-hidden"
             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
             <h3 className="text-xl md:text-2xl font-bold text-indigo-700 mb-2 text-center">{card.word}</h3>
             <span className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-sm font-mono mb-4">{card.ipa}</span>
             <p className="text-slate-700 text-sm italic text-center">"{card.example_original}"</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-500"
            title="Delete Card"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const FlashCardList: React.FC<FlashCardListProps> = ({ cards, onDelete, onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">My Flashcards ({cards.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-lg font-medium">No Flashcards Yet</p>
            <p className="text-sm">Select text in Shadowing or Dictation mode to create cards.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto pb-20">
            {cards.map(card => (
              <FlashCardItem key={card.id} card={card} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashCardList;