import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Edit3, Save, ChevronDown, Check } from 'lucide-react';

interface GetCenteredCardProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const GetCenteredCard: React.FC<GetCenteredCardProps> = ({ isOpen, onClose, children }) => {
  const [showMantra, setShowMantra] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMantra, setCurrentMantra] = useState('');
  const [isNewMantra, setIsNewMantra] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState(0);
  const [journalEntry, setJournalEntry] = useState('');
  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [historicalEntries, setHistoricalEntries] = useState<string[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Professional meditation options
  const meditationOptions = [
    {
      title: "Morning Sacred Geometry",
      duration: "10 min",
      description: "Connect with divine patterns of creation",
      type: "Focus",
      audioUrl: "/audio/sacred-geometry-meditation.mp3"
    },
    {
      title: "Flower of Life Journey",
      duration: "15 min",
      description: "Deep meditation on interconnectedness",
      type: "Spiritual",
      audioUrl: "/audio/flower-of-life-meditation.mp3"
    },
    {
      title: "Golden Ratio Breathing",
      duration: "8 min",
      description: "Harmonize breath with universal rhythm",
      type: "Breathing",
      audioUrl: "/audio/golden-ratio-breathing.mp3"
    },
    {
      title: "Centering Presence",
      duration: "12 min",
      description: "Ground yourself in the present moment",
      type: "Mindfulness",
      audioUrl: "/audio/centering-presence.mp3"
    },
    {
      title: "Stress Release Flow",
      duration: "20 min",
      description: "Release tension and find inner peace",
      type: "Healing",
      audioUrl: "/audio/stress-release.mp3"
    },
    {
      title: "Deep Focus Session",
      duration: "25 min",
      description: "Extended concentration and clarity practice",
      type: "Focus",
      audioUrl: "/audio/deep-focus.mp3"
    }
  ];

  // Daily mantras - authentic and meaningful
  const mantras = [
    "I am centered, calm, and present in this moment",
    "I breathe in peace, I breathe out love",
    "I trust the journey and embrace each step with grace",
    "I am grounded in my truth and open to growth",
    "I choose peace over worry, love over fear",
    "I am exactly where I need to be right now",
    "My heart is open and my mind is clear",
    "I radiate compassion and kindness to all beings",
    "I find strength in stillness and wisdom in silence",
    "I am grateful for this moment and all it offers"
  ];

  // Check for new mantra (6am daily)
  useEffect(() => {
    const checkForNewMantra = () => {
      const today = new Date().toDateString();
      const lastMantraDate = localStorage.getItem('lastMantraDate');

      if (lastMantraDate !== today) {
        // New day - generate new mantra
        const randomMantra = mantras[Math.floor(Math.random() * mantras.length)];
        setCurrentMantra(randomMantra);
        setIsNewMantra(true);
        localStorage.setItem('lastMantraDate', today);
        localStorage.setItem('currentMantra', randomMantra);
      } else {
        // Same day - use stored mantra
        const storedMantra = localStorage.getItem('currentMantra') || mantras[0];
        setCurrentMantra(storedMantra);
        setIsNewMantra(false);
      }
    };

    if (isOpen) {
      checkForNewMantra();
    }
  }, [isOpen]);

  const handleFlipCard = () => {
    setShowMantra(!showMantra);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Here you would integrate with actual audio player
  };

  const handleSaveJournal = () => {
    try {
      const today = new Date().toDateString();
      const trimmedEntry = journalEntry.trim();

      if (trimmedEntry) {
        localStorage.setItem(`journal_${today}`, trimmedEntry);
        console.log('Journal entry saved successfully for:', today);

        // Update historical entries if this is a new entry
        if (!historicalEntries.includes(today)) {
          const updatedEntries = [today, ...historicalEntries].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          setHistoricalEntries(updatedEntries);
        }
      } else {
        // If empty, remove the entry
        localStorage.removeItem(`journal_${today}`);
        setHistoricalEntries(prev => prev.filter(date => date !== today));
        console.log('Empty journal entry removed for:', today);
      }

      setIsEditingJournal(false);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // Keep editing mode active if save fails
    }
  };

  // Load all journal entries and set today as default
  useEffect(() => {
    if (isOpen) {
      try {
        const today = new Date().toDateString();

        // Get all journal entries from localStorage
        const allEntries: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('journal_')) {
            const date = key.replace('journal_', '');
            allEntries.push(date);
          }
        }

        // Sort dates chronologically (newest first)
        const sortedEntries = allEntries.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setHistoricalEntries(sortedEntries);

        // Load today's entry
        const savedEntry = localStorage.getItem(`journal_${today}`) || '';
        setJournalEntry(savedEntry);
        setSelectedDate(today);
        setIsViewingHistory(false);

        console.log('Journal entries loaded:', sortedEntries.length, 'entries found');
      } catch (error) {
        console.error('Failed to load journal entries:', error);
        setJournalEntry('');
        setHistoricalEntries([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* ATMO Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative w-[600px] h-[700px] bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 112, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle ATMO overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 via-transparent to-orange-500/5" />

          {/* ATMO-style close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-center group z-20"
          >
            <X size={18} className="text-white/60 group-hover:text-white" />
          </button>

          {/* Content */}
          <div className="relative p-6 h-full flex flex-col z-10">
            {/* Enhanced ATMO header with dynamic orange */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center relative overflow-hidden group">
                <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="text-white text-xl font-medium tracking-wide">Center</h3>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent mx-auto mt-3" />
            </div>

            {/* ATMO Content Layout */}
            <div className="flex-1 flex flex-col space-y-6">

              {/* ATMO Meditation Section */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-sm bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm shadow-orange-500/50" />
                  <h4 className="text-white text-sm font-medium tracking-wider uppercase opacity-80">Meditation</h4>
                </div>

                {/* ATMO Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/40 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <h5 className="text-white text-sm font-normal">{meditationOptions[selectedMeditation].title}</h5>
                      <p className="text-white/50 text-xs mt-1">{meditationOptions[selectedMeditation].duration} • {meditationOptions[selectedMeditation].type}</p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-white/60 group-hover:text-orange-400/80 transition-all duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* ATMO Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl rounded-xl border border-white/15 shadow-xl z-50 max-h-60 overflow-y-auto">
                      {meditationOptions.map((meditation, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedMeditation(index);
                            setDropdownOpen(false);
                          }}
                          className="w-full p-3 text-left hover:bg-white/5 transition-colors duration-200 border-b border-white/5 last:border-b-0 flex items-center justify-between"
                        >
                          <div>
                            <h6 className="text-white text-sm font-normal">{meditation.title}</h6>
                            <p className="text-white/50 text-xs mt-1">{meditation.duration} • {meditation.type}</p>
                          </div>
                          {selectedMeditation === index && (
                            <Check size={12} className="text-orange-500 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ATMO Player Controls */}
                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-white/60 text-sm leading-relaxed">{meditationOptions[selectedMeditation].description}</p>
                    </div>
                    <button
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 flex items-center justify-center transition-all duration-200 ml-4 shadow-lg shadow-orange-500/30 hover:shadow-orange-400/40 hover:scale-105 active:scale-95"
                    >
                      {isPlaying ?
                        <Pause size={16} className="text-white" /> :
                        <Play size={16} className="text-white ml-0.5" />
                      }
                    </button>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: isPlaying ? '60%' : '0%',
                        boxShadow: isPlaying ? '0 0 8px rgba(249, 115, 22, 0.6)' : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ATMO Daily Mantra */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-2 h-2 rounded-sm ${isNewMantra ? 'bg-gradient-to-r from-orange-500 to-orange-600 animate-pulse shadow-sm shadow-orange-500/50' : 'bg-orange-500/60'}`} />
                  <h4 className="text-orange-500 text-sm font-medium tracking-wider uppercase opacity-90">Daily Mantra</h4>
                  {isNewMantra && <span className="text-xs text-orange-500 animate-pulse font-normal bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">New</span>}
                </div>

                <div
                  className="relative h-20 cursor-pointer group"
                  onClick={handleFlipCard}
                >
                  <div
                    className={`absolute inset-0 w-full h-full transition-transform duration-700 preserve-3d ${showMantra ? 'rotate-y-180' : ''}`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* ATMO Front card */}
                    <div
                      className="absolute inset-0 w-full h-full bg-white/5 border border-white/15 rounded-xl flex items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-center px-4">
                        <div className="w-6 h-6 mx-auto mb-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center">
                          <RotateCcw size={12} className="text-orange-500 group-hover:rotate-180 transition-transform duration-500 group-hover:text-orange-400" />
                        </div>
                        <p className="text-white/70 text-xs font-normal group-hover:text-white/90 transition-colors duration-300">Tap for your daily mantra</p>
                      </div>
                    </div>

                    {/* ATMO Back card */}
                    <div
                      className="absolute inset-0 w-full h-full bg-gradient-to-br from-orange-500/15 to-orange-600/10 border border-orange-500/30 rounded-xl flex items-center justify-center p-4 rotate-y-180 backface-hidden"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <p className="text-white text-xs text-center leading-relaxed font-light relative">
                        "{currentMantra}"
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-500/30 rounded-full animate-pulse" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATMO Journal Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-sm bg-white/60" />
                    <h4 className="text-white/60 text-sm font-medium tracking-wider uppercase">Journal</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ATMO Date Selector */}
                    {historicalEntries.length > 0 && (
                      <div className="relative">
                        <select
                          value={selectedDate}
                          onChange={(e) => {
                            const date = e.target.value;
                            const today = new Date().toDateString();
                            setSelectedDate(date);
                            setIsViewingHistory(date !== today);

                            if (date === today) {
                              // Load today's entry for editing
                              const todayEntry = localStorage.getItem(`journal_${today}`) || '';
                              setJournalEntry(todayEntry);
                            } else {
                              // Load historical entry (read-only)
                              const historicalEntry = localStorage.getItem(`journal_${date}`) || '';
                              setJournalEntry(historicalEntry);
                            }
                            setIsEditingJournal(false);
                          }}
                          className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white hover:border-orange-500/30 transition-all duration-200 focus:outline-none focus:border-orange-500/50"
                        >
                          <option value={new Date().toDateString()}>Today</option>
                          {historicalEntries.filter(date => date !== new Date().toDateString()).map(date => (
                            <option key={date} value={date}>
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* ATMO Edit/Save Button */}
                    {!isViewingHistory && (
                      <button
                        onClick={() => isEditingJournal ? handleSaveJournal() : setIsEditingJournal(true)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/10 border border-white/15 hover:border-orange-500/40 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20"
                      >
                        {isEditingJournal ?
                          <Save size={14} className="text-white" /> :
                          <Edit3 size={14} className="text-white/70" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 min-h-0">
                  {isEditingJournal && !isViewingHistory ? (
                    <textarea
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                      placeholder="What's on your mind today? Share your thoughts, feelings, or reflections..."
                      className="w-full h-full bg-transparent text-white placeholder-white/40 text-sm leading-relaxed resize-none focus:outline-none font-normal"
                      autoFocus
                    />
                  ) : (
                    <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-gray-600/40">
                      {journalEntry ? (
                        <div>
                          {isViewingHistory && (
                            <div className="mb-2 text-xs text-slate-400 italic">
                              {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                            {journalEntry}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-white/30 text-sm text-center font-light">
                            {isViewingHistory
                              ? "No journal entry for this date"
                              : "Click the edit button to add your thoughts for today"
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced ATMO accent */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

export default GetCenteredCard;