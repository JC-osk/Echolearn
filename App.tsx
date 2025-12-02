import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geminiService } from './services/geminiService';
import { SegmentState, AppView, PracticeMode, PlaybackSpeed, FlashCard, AudioSession } from './types';
import FileUpload from './components/FileUpload';
import { Spinner } from './components/Spinner';
import DiffViewer from './components/DiffViewer';
import SelectionPopup from './components/SelectionPopup';
import FlashCardList from './components/FlashCardList';
import { PLAYBACK_SPEEDS } from './constants';

interface ShadowingViewProps {
  session: AudioSession;
  activeIndex: number;
  isPlaying: boolean;
  showOriginal: boolean;
  showTranslation: boolean;
  onPlaySegment: (index: number) => void;
  onTextMouseUp: (e: React.MouseEvent, text: string, trans: string) => void;
  activeSegmentRef: React.RefObject<HTMLDivElement>;
  segmentsRef: React.RefObject<HTMLDivElement>;
}

const ShadowingView: React.FC<ShadowingViewProps> = ({
  session, activeIndex, isPlaying, showOriginal, showTranslation,
  onPlaySegment, onTextMouseUp, activeSegmentRef, segmentsRef
}) => {
  // Added pr-24 to prevent text from being hidden behind the floating player
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative pr-24" ref={segmentsRef}>
      <div className="max-w-3xl mx-auto space-y-4 pb-24">
        {session.segments.map((segment, index) => {
          const isActive = index === activeIndex;
          return (
            <div 
              key={segment.id}
              ref={isActive ? activeSegmentRef : null}
              onClick={() => onPlaySegment(index)}
              className={`
                p-4 rounded-xl border transition-all cursor-pointer group
                ${isActive 
                  ? 'bg-white border-indigo-400 shadow-md ring-1 ring-indigo-400' 
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  #{index + 1}
                </span>
                {isActive && isPlaying && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p 
                  onMouseUp={(e) => onTextMouseUp(e, segment.text, segment.translation)}
                  className={`text-lg md:text-xl font-medium leading-relaxed transition-opacity duration-300 ${showOriginal ? 'text-slate-800' : 'text-transparent bg-slate-100 rounded select-none'}`}
                >
                  {showOriginal ? segment.text : 'Original text hidden'}
                </p>
                <p className={`text-base text-slate-500 leading-relaxed transition-opacity duration-300 ${showTranslation ? 'opacity-100' : 'opacity-0 select-none'}`}>
                  {segment.translation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DictationViewProps {
  session: AudioSession;
  activeIndex: number;
  savedFeedbackSegmentId: number | null;
  isPlaying: boolean;
  showOriginal: boolean;
  showTranslation: boolean;
  showCheck: boolean;
  onPlaySegment: (index: number) => void;
  onAddSentenceCard: (segment: SegmentState) => void;
  onDictationInput: (id: number, text: string) => void;
  onTextMouseUp: (e: React.MouseEvent, text: string, trans: string) => void;
  onToggleCheck: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const DictationView: React.FC<DictationViewProps> = ({
  session, activeIndex, savedFeedbackSegmentId, isPlaying,
  showOriginal, showTranslation, showCheck,
  onPlaySegment, onAddSentenceCard, onDictationInput, onTextMouseUp, onToggleCheck, inputRef
}) => {
  const currentSegment = session.segments[activeIndex];
  const isSaved = currentSegment ? (savedFeedbackSegmentId === currentSegment.id) : false;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left Sidebar: Navigation Rail */}
      <div className="w-20 md:w-24 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col items-center py-4 gap-3 z-10 flex-shrink-0">
         {session.segments.map((seg, idx) => (
           <button
             key={seg.id}
             onClick={() => onPlaySegment(idx)}
             className={`
               w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all
               ${idx === activeIndex
                 ? 'bg-indigo-600 text-white shadow-md scale-110'
                 : seg.userInput.trim()
                   ? 'bg-green-100 text-green-700 border border-green-200'
                   : 'bg-slate-100 text-slate-500 hover:bg-slate-100 hover:scale-105'
               }
             `}
             title={`Segment #${idx + 1}`}
           >
             {idx + 1}
           </button>
         ))}
      </div>

      {/* Right Content: Active Workspace */}
      {/* Added pr-24 to ensure the floating player doesn't cover content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col items-center relative pr-24">
         {activeIndex === -1 || !currentSegment ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="p-4 bg-white rounded-full shadow-sm">
                 <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </div>
              <p>Select a segment to start dictation</p>
              <button 
                onClick={() => onPlaySegment(0)} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start from #1
              </button>
           </div>
         ) : (
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-4 md:mt-12 transition-all">
              {/* Header inside card */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-mono px-2 py-1 rounded">Segment #{activeIndex + 1}</span>
                    {isPlaying && (
                       <span className="flex h-2 w-2 relative">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                       </span>
                     )}
                 </div>
                 
                 <button 
                    onClick={() => onAddSentenceCard(currentSegment)}
                    disabled={isSaved}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isSaved ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-800'}`}
                    title="Create flashcard from this sentence"
                 >
                    {isSaved ? (
                       <>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         Saved
                       </>
                    ) : (
                       <>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                         Add Flashcard
                       </>
                    )}
                 </button>
              </div>

              {/* Input Area */}
              <div className="relative mb-6">
                 <textarea
                   ref={inputRef}
                   value={currentSegment.userInput}
                   onChange={(e) => onDictationInput(currentSegment.id, e.target.value)}
                   className="w-full p-6 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 outline-none resize-none text-xl leading-relaxed text-slate-800 transition-all shadow-inner"
                   rows={4}
                   placeholder="Type what you hear..."
                 />
              </div>

              {/* Original Text (Hidden/Revealed) */}
              {showOriginal && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p 
                     onMouseUp={(e) => onTextMouseUp(e, currentSegment.text, currentSegment.translation)}
                     className="text-lg text-slate-800 font-medium"
                   >
                     {currentSegment.text}
                   </p>
                </div>
              )}

              {/* Translation (Hidden/Revealed) */}
              <div className={`transition-all duration-300 ${showTranslation ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <p className="text-slate-500 text-base italic border-l-4 border-indigo-200 pl-3">
                   {currentSegment.translation}
                </p>
              </div>

              {/* Diff Viewer */}
              {showCheck && (
                <div className="mt-6 pt-6 border-t border-slate-100 animate-fadeIn">
                   <DiffViewer original={currentSegment.text} input={currentSegment.userInput} />
                </div>
              )}
           </div>
         )}
         
         {/* Bottom Spacer for scrolling */}
         <div className="h-24"></div>
      </div>
    </div>
  );
};

export function App() {
  // --- Global Data State ---
  const [sessions, setSessions] = useState<AudioSession[]>([]);
  const [flashcards, setFlashcards] = useState<FlashCard[]>(() => {
    try {
      const saved = localStorage.getItem('echolearn_flashcards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse flashcards from localStorage", e);
      return [];
    }
  });
  
  // --- Navigation State ---
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // --- Practice State (Active Session) ---
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('shadowing');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [isLoading, setIsLoading] = useState(false);

  // View Settings
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [dictationShowOriginal, setDictationShowOriginal] = useState(false);
  const [dictationShowTranslation, setDictationShowTranslation] = useState(true);
  const [showCheck, setShowCheck] = useState(false);

  // Selection
  const [selection, setSelection] = useState<{ text: string; context: string; contextTranslation: string; rect: DOMRect } | null>(null);

  // Feedback State
  const [savedFeedbackSegmentId, setSavedFeedbackSegmentId] = useState<number | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentsRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const dictationInputRef = useRef<HTMLTextAreaElement>(null);

  // --- Derived State ---
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('echolearn_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  // --- Handlers: Dashboard & Sessions ---

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const result = await geminiService.analyzeAudio(file);
      
      const newSession: AudioSession = {
        id: Date.now().toString(),
        fileName: file.name,
        createdAt: Date.now(),
        segments: result.segments.map(s => ({ ...s, userInput: '' })),
        audioUrl: url,
        language: result.language
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setCurrentView('practice');
      setPracticeMode('shadowing');
    } catch (error) {
      alert("Failed to analyze audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openSession = (id: string) => {
    setActiveSessionId(id);
    setCurrentView('practice');
    setPracticeMode('shadowing');
    setActiveIndex(-1);
    setIsPlaying(false);
  };

  const updateSessionSegments = (sessionId: string, newSegments: SegmentState[]) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, segments: newSegments } : s));
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  // --- Handlers: Practice Mode ---

  const handleTimeUpdate = () => {
    if (!audioRef.current || !activeSession) return;
    const currentTime = audioRef.current.currentTime;

    // Dictation Mode Logic: Stop at end of segment
    if (practiceMode === 'dictation' && activeIndex !== -1) {
      const currentSeg = activeSession.segments[activeIndex];
      if (currentSeg && currentTime >= currentSeg.end) {
        // Pause if we've reached the end of the segment
        if (!audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return; // Don't update index to next segment
      }
    }

    const index = activeSession.segments.findIndex(
      seg => currentTime >= seg.start && currentTime < seg.end
    );

    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const playSegment = (index: number) => {
    if (!audioRef.current || !activeSession || index < 0 || index >= activeSession.segments.length) return;
    
    const segment = activeSession.segments[index];
    if (!isFinite(segment.start)) return;

    // Small buffer to ensure we catch the start
    audioRef.current.currentTime = segment.start;
    audioRef.current.play().catch(e => console.error(e));
    setActiveIndex(index);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      // If in dictation mode and at the end of the segment, replay current segment
      if (practiceMode === 'dictation' && activeIndex !== -1 && activeSession) {
        const currentSeg = activeSession.segments[activeIndex];
        if (currentSeg && audioRef.current.currentTime >= currentSeg.end - 0.1) {
          playSegment(activeIndex);
          return;
        }
      }
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  };

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) playSegment(activeIndex - 1);
    else playSegment(0);
  }, [activeIndex, activeSession]);

  const handleNext = useCallback(() => {
    if (activeSession && activeIndex < activeSession.segments.length - 1) {
      playSegment(activeIndex + 1);
    }
  }, [activeIndex, activeSession]);

  const handleRepeat = useCallback(() => {
    if (activeIndex >= 0) playSegment(activeIndex);
  }, [activeIndex]);

  const changeSpeed = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleDictationInput = (segmentId: number, text: string) => {
    if (!activeSession) return;
    const updatedSegments = activeSession.segments.map(s => 
      s.id === segmentId ? { ...s, userInput: text } : s
    );
    updateSessionSegments(activeSession.id, updatedSegments);
  };

  const handleAddSentenceCard = (segment: SegmentState) => {
    const newCard: FlashCard = {
      id: Date.now().toString(),
      word: segment.text, // Back: Original Text
      context: segment.text,
      definition_cn: segment.translation, // Front: Translation
      ipa: "Full Sentence",
      example_original: segment.text,
      example_cn: segment.translation
    };
    saveFlashCard(newCard);
    setSavedFeedbackSegmentId(segment.id);
    setTimeout(() => setSavedFeedbackSegmentId(null), 2000);
  };

  // --- Handlers: Flashcards & Selection ---

  const handleTextMouseUp = (e: React.MouseEvent, contextText: string, contextTranslation: string) => {
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.isCollapsed) return;

    const text = windowSelection.toString().trim();
    if (text.length > 0 && windowSelection.rangeCount > 0) {
      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        context: contextText,
        contextTranslation,
        rect
      });
    }
  };

  const saveFlashCard = (card: FlashCard) => {
    setFlashcards(prev => [...prev, card]);
  };

  const deleteFlashCard = (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id));
  };

  // --- Effects ---

  // Keyboard controls
  useEffect(() => {
    if (currentView !== 'practice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow defaults if typing in input, but still capture arrows if needed.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); handlePrev(); break;
        case 'ArrowRight': e.preventDefault(); handleNext(); break;
        case 'ArrowDown': e.preventDefault(); handleRepeat(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, activeIndex, activeSession, practiceMode]);

  // Auto-scroll for shadowing mode
  useEffect(() => {
    if (practiceMode === 'shadowing' && activeSegmentRef.current && segmentsRef.current) {
      activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, practiceMode]);

  // Sync play state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [activeSession]);

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold text-slate-800">EchoLearn</h1>
           <button 
             onClick={() => setCurrentView('flashcards')}
             className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             My Flashcards ({flashcards.length})
           </button>
        </div>

        {/* Upload Section */}
        <div className="mb-10">
          {isLoading ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
              <Spinner />
              <p className="mt-4 text-slate-500">Analyzing audio with Gemini AI...</p>
            </div>
          ) : (
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}
        </div>

        {/* Session List */}
        <div>
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Recent Practice
          </h2>
          {sessions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
              No audio files uploaded yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3-2 3-2zm0 0v-6.2" /></svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{session.fileName}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(session.createdAt).toLocaleDateString()} • {session.language} • {session.segments.length} segments
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Session"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPractice = () => {
    if (!activeSession) return <div>Session not found</div>;

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm z-20 sticky top-0 flex-shrink-0">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setCurrentView('dashboard')}
               className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
               title="Back to Dashboard"
             >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-800 truncate max-w-[150px] md:max-w-xs">{activeSession.fileName}</h1>
                <p className="text-xs text-slate-500 hidden sm:block">EchoLearn Practice</p>
             </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setPracticeMode('shadowing')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${practiceMode === 'shadowing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
            >
              Shadowing
            </button>
            <button 
              onClick={() => setPracticeMode('dictation')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${practiceMode === 'dictation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
            >
              Dictation
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
              {PLAYBACK_SPEEDS.map(speed => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  className={`px-2 py-1 text-xs font-medium rounded ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Practice Options Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-center gap-6 text-sm flex-wrap flex-shrink-0">
          {practiceMode === 'shadowing' && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={showOriginal} onChange={(e) => setShowOriginal(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-slate-700">Show Original</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-slate-700">Show Translation</span>
              </label>
            </>
          )}
          {practiceMode === 'dictation' && (
             <>
               <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={dictationShowOriginal} onChange={(e) => setDictationShowOriginal(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-slate-700">Show Original</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={dictationShowTranslation} onChange={(e) => setDictationShowTranslation(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-slate-700">Show Translation</span>
              </label>
               <div className="w-px h-4 bg-slate-300 mx-2 hidden sm:block"></div>
               <button 
                 onClick={() => setShowCheck(!showCheck)}
                 className={`px-3 py-0.5 rounded-full border text-xs font-medium transition-colors ${showCheck ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
               >
                 {showCheck ? 'Hide Corrections' : 'Check Answers'}
               </button>
             </>
          )}
        </div>

        {/* Main Content Area */}
        {practiceMode === 'shadowing' ? (
          <ShadowingView
            session={activeSession}
            activeIndex={activeIndex}
            isPlaying={isPlaying}
            showOriginal={showOriginal}
            showTranslation={showTranslation}
            onPlaySegment={playSegment}
            onTextMouseUp={handleTextMouseUp}
            activeSegmentRef={activeSegmentRef}
            segmentsRef={segmentsRef}
          />
        ) : (
          <DictationView
            session={activeSession}
            activeIndex={activeIndex}
            savedFeedbackSegmentId={savedFeedbackSegmentId}
            isPlaying={isPlaying}
            showOriginal={dictationShowOriginal}
            showTranslation={dictationShowTranslation}
            showCheck={showCheck}
            onPlaySegment={playSegment}
            onAddSentenceCard={handleAddSentenceCard}
            onDictationInput={handleDictationInput}
            onTextMouseUp={handleTextMouseUp}
            onToggleCheck={() => setShowCheck(!showCheck)}
            inputRef={dictationInputRef}
          />
        )}

        {/* Floating Controls - Right Side Vertical "Shadow" Player */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl shadow-indigo-900/40 rounded-full py-6 px-3 z-40 transition-all hover:scale-105">
          <button onClick={handlePrev} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Previous (Up Arrow)">
            {/* Chevron Up */}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          
          <button onClick={togglePlay} className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 shadow-lg shadow-indigo-600/50 transform hover:scale-110 transition-all group" title="Play/Pause (Space)">
             {/* Play/Pause Icons */}
             {isPlaying ? (
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             ) : (
                <svg className="w-7 h-7 pl-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
             )}
          </button>

          <button onClick={handleNext} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Next (Down Arrow)">
            {/* Chevron Down */}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          <div className="w-8 h-px bg-slate-700 my-1"></div>

          <button onClick={handleRepeat} className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-full transition-colors" title="Repeat Current (Down Arrow)">
             {/* Loop Icon */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {activeSession.audioUrl && (
          <audio
            ref={audioRef}
            src={activeSession.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-50 relative">
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'practice' && renderPractice()}
      {currentView === 'flashcards' && (
        <FlashCardList 
          cards={flashcards} 
          onDelete={deleteFlashCard} 
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Text Selection Popup */}
      {selection && (
        <SelectionPopup 
          selection={selection} 
          onClose={() => setSelection(null)} 
          onSave={saveFlashCard}
        />
      )}
    </div>
  );
}