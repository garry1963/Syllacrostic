import { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { PUZZLE, SyllableDef, PuzzleDef } from './data';
import { DroppableBank } from './components/DroppableBank';
import { DroppableSlot } from './components/DroppableSlot';
import { DraggableSyllable } from './components/DraggableSyllable';
import { Lightbulb, RotateCcw, Trophy, Wand2, Settings, BarChart2, Calendar, Play, MessageSquareText, Wifi, WifiOff, Loader2, Library, Dices, Flame, Database, CheckSquare } from 'lucide-react';
import { cn } from './lib/utils';
import { PuzzleBuilder } from './components/PuzzleBuilder';
import { SettingsModal, Settings as AppSettings } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { GuessModal } from './components/GuessModal';
import { PuzzleLibraryModal } from './components/PuzzleLibraryModal';
import { QuestsModal } from './components/QuestsModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generatePuzzle, checkApiConnection } from './lib/puzzleGenerator';
import { Quest, QuestAction, DAILY_QUEST_TEMPLATES, WEEKLY_QUEST_TEMPLATES, getCurrentMonday, getRandomQuests } from './lib/quests';

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function App() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('syllacrostic-settings', { theme: 'theme-blue', difficulty: 'Medium', showApiStatus: false });
  const [stats, setStats] = useLocalStorage('syllacrostic-stats', {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null as number | null,
    lastPlayedDate: null as string | null,
    completionTimes: [] as number[],
    totalScore: 0,
    bestScores: {
      Easy: 0,
      Medium: 0,
      Hard: 0
    } as Record<string, number>,
    bestTimesByDifficulty: {
      Easy: null as number | null,
      Medium: null as number | null,
      Hard: null as number | null
    } as Record<string, number | null>,
    completionTimesByDifficulty: {
      Easy: [] as number[],
      Medium: [] as number[],
      Hard: [] as number[]
    } as Record<string, number[]>
  });

  const [activePuzzle, setActivePuzzle] = useLocalStorage<PuzzleDef>('syllacrostic-puzzle', PUZZLE);
  const [puzzleDb, setPuzzleDb] = useLocalStorage<PuzzleDef[]>('syllacrostic-puzzle-db', [PUZZLE]);
  const [wordPool, setWordPool] = useLocalStorage<{clue: string, syllables: string}[]>('syllacrostic-word-pool', []);
  const [mode, setMode] = useState<'play' | 'build'>('play');
  const [isDaily, setIsDaily] = useLocalStorage('syllacrostic-is-daily', false);

  const [locations, setLocations] = useLocalStorage<Record<string, string>>('syllacrostic-locations', {});
  const [hintsUsed, setHintsUsed] = useLocalStorage('syllacrostic-hints', 0);
  const [isWon, setIsWon] = useLocalStorage('syllacrostic-won', false);
  const [isMessageGuessed, setIsMessageGuessed] = useLocalStorage('syllacrostic-message-guessed', false);

  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [guessError, setGuessError] = useState('');

  const [questsData, setQuestsData] = useLocalStorage('syllacrostic-quests', {
    daily: [] as Quest[],
    weekly: [] as Quest[],
    lastDailyReset: null as string | null,
    lastWeeklyReset: null as string | null
  });

  // Quest reset logic
  useEffect(() => {
    const today = new Date().toDateString();
    const currentMonday = getCurrentMonday().toDateString();
    
    let needsUpdate = false;
    let newDaily = [...questsData.daily];
    let newWeekly = [...questsData.weekly];
    let newLastDaily = questsData.lastDailyReset;
    let newLastWeekly = questsData.lastWeeklyReset;

    if (questsData.lastDailyReset !== today) {
      newDaily = getRandomQuests(DAILY_QUEST_TEMPLATES, 3);
      newLastDaily = today;
      needsUpdate = true;
    }

    if (questsData.lastWeeklyReset !== currentMonday) {
      newWeekly = getRandomQuests(WEEKLY_QUEST_TEMPLATES, 4);
      newLastWeekly = currentMonday;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setQuestsData({
        daily: newDaily,
        weekly: newWeekly,
        lastDailyReset: newLastDaily,
        lastWeeklyReset: newLastWeekly
      });
    }
  }, [questsData.lastDailyReset, questsData.lastWeeklyReset, setQuestsData]);

  const updateQuests = useCallback((action: QuestAction, amount: number = 1) => {
    setQuestsData(prev => {
      let pointsEarned = 0;
      let updated = false;

      const updateList = (list: Quest[]) => {
        return list.map(q => {
          if (!q.completed && q.action === action) {
            const newProgress = Math.min(q.target, q.progress + amount);
            const completed = newProgress >= q.target;
            if (completed && !q.completed) {
              pointsEarned += q.reward;
            }
            updated = true;
            return { ...q, progress: newProgress, completed };
          }
          return q;
        });
      };

      const newDaily = updateList(prev.daily);
      const newWeekly = updateList(prev.weekly);

      if (pointsEarned > 0) {
        setStats(s => ({ ...s, totalScore: (s.totalScore || 0) + pointsEarned }));
      }

      if (updated) {
        return { ...prev, daily: newDaily, weekly: newWeekly };
      }
      return prev;
    });
  }, [setQuestsData, setStats]);

  const [timeElapsed, setTimeElapsed] = useLocalStorage('syllacrostic-time', 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const [apiState, setApiState] = useState<'checking' | 'connected' | 'error' | 'missing_key'>('checking');
  const [isPreloadingRandom, setIsPreloadingRandom] = useState(false);
  const [preloadedRandom, setPreloadedRandom] = useState<PuzzleDef | null>(null);

  const [selectedSyllable, setSelectedSyllable] = useState<string | null>(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  // Check API Connection
  useEffect(() => {
    setApiState('checking');
    checkApiConnection().then(setApiState);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (isTimerRunning && !isWon) {
      interval = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isWon]);

  const formatTime = (s: number) => {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // Flatten all syllables from the puzzle
  const allSyllables = useMemo(() => {
    const syllables: SyllableDef[] = [];
    activePuzzle.clues.forEach(clue => {
      syllables.push(...clue.syllables);
    });
    
    if (settings.sortSyllables) {
      return syllables.sort((a, b) => a.text.localeCompare(b.text));
    }
    
    return shuffle(syllables);
  }, [activePuzzle, settings.sortSyllables]);

  // Initialize locations to 'bank' when puzzle changes
  useEffect(() => {
    // Check if the current locations match the current puzzle's syllables
    const currentSyllableIds = allSyllables.map(s => s.id);
    const locationSyllableIds = Object.keys(locations);
    
    // If locations is empty or has different syllables, reset it
    const needsReset = locationSyllableIds.length === 0 || 
      locationSyllableIds.length !== currentSyllableIds.length ||
      !currentSyllableIds.every(id => locationSyllableIds.includes(id));

    if (needsReset) {
      const initialLocations: Record<string, string> = {};
      allSyllables.forEach(s => {
        initialLocations[s.id] = 'bank';
      });
      setLocations(initialLocations);
      setHintsUsed(0);
      setIsWon(false);
      setTimeElapsed(0);
      setIsMessageGuessed(false);
      setIsTimerRunning(true);
      updateQuests('play');
    } else {
      setIsTimerRunning(!isWon);
    }
  }, [allSyllables, activePuzzle.id, updateQuests]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (settings.placementMethod === 'click') return;
    
    const { active, over } = event;
    if (!over) return;

    const syllableId = active.id as string;
    const targetLocation = over.id as string;

    setLocations(prev => {
      const newLocations = { ...prev };
      
      // If moving to a slot, check if it's occupied
      if (targetLocation.startsWith('slot_')) {
        const occupantId = Object.keys(newLocations).find(id => newLocations[id] === targetLocation);
        
        if (occupantId && occupantId !== syllableId) {
          // Swap: move occupant to the dragged syllable's old location
          newLocations[occupantId] = prev[syllableId];
        }
      }
      
      newLocations[syllableId] = targetLocation;
      return newLocations;
    });
  };

  const handleSyllableClick = (syllableId: string, currentLocation: string) => {
    if (settings.placementMethod !== 'click') return;

    if (currentLocation === 'bank') {
      // If clicking in bank, select it
      setSelectedSyllable(syllableId === selectedSyllable ? null : syllableId);
    } else {
      // If clicking in a slot, move it back to bank
      setLocations(prev => {
        const newLocs = { ...prev };
        newLocs[syllableId] = 'bank';
        return newLocs;
      });
      setSelectedSyllable(null);
    }
  };

  const handleSlotClick = (slotId: string) => {
    if (settings.placementMethod !== 'click' || !selectedSyllable) return;

    setLocations(prev => {
      const newLocs = { ...prev };
      
      // Check if slot is occupied
      const occupantId = Object.keys(newLocs).find(id => newLocs[id] === slotId);
      
      if (occupantId && occupantId !== selectedSyllable) {
        // Swap
        newLocs[occupantId] = prev[selectedSyllable];
      }
      
      newLocs[selectedSyllable] = slotId;
      return newLocs;
    });
    
    setSelectedSyllable(null);
  };

  const useHint = () => {
    for (const clue of activePuzzle.clues) {
      for (let i = 0; i < clue.syllables.length; i++) {
        const slotId = `slot_${clue.id}_${i}`;
        const expectedText = clue.syllables[i].text;
        
        const occupantId = Object.keys(locations).find(id => locations[id] === slotId);
        const occupantText = occupantId ? allSyllables.find(s => s.id === occupantId)?.text : null;
        
        if (occupantText !== expectedText) {
          // Find a syllable with expectedText that is NOT currently in a correct slot
          const candidateIds = allSyllables.filter(s => s.text === expectedText).map(s => s.id);
          
          let syllableToMove = null;
          for (const cid of candidateIds) {
            const loc = locations[cid];
            if (loc === 'bank') {
              syllableToMove = cid;
              break;
            }
            if (loc.startsWith('slot_')) {
              const [_, clueIdStr, slotIdxStr] = loc.split('_');
              const cId = parseInt(clueIdStr);
              const sIdx = parseInt(slotIdxStr);
              const c = activePuzzle.clues.find(c => c.id === cId);
              if (c && c.syllables[sIdx].text !== expectedText) {
                syllableToMove = cid;
                break;
              }
            }
          }
          
          if (syllableToMove) {
            setLocations(prev => {
              const newLocs = { ...prev };
              if (occupantId) {
                newLocs[occupantId] = 'bank';
              }
              newLocs[syllableToMove] = slotId;
              return newLocs;
            });
            setHintsUsed(h => h + 1);
            return;
          }
        }
      }
    }
  };

  const resetPuzzle = useCallback(() => {
    const initialLocations: Record<string, string> = {};
    allSyllables.forEach(s => {
      initialLocations[s.id] = 'bank';
    });
    setLocations(initialLocations);
    setHintsUsed(0);
    setIsWon(false);
    setTimeElapsed(0);
    setIsTimerRunning(true);
    setIsMessageGuessed(false);
    updateQuests('play');
  }, [allSyllables, setLocations, setHintsUsed, setIsWon, setTimeElapsed, setIsMessageGuessed, updateQuests]);

  // Calculate score and check win condition
  let correctSyllablesCount = 0;
  let correctCluesCount = 0;
  let isHiddenMessageCorrect = true;

  activePuzzle.clues.forEach(clue => {
    let isClueCorrect = true;
    clue.syllables.forEach((expectedSyllable, i) => {
      const slotId = `slot_${clue.id}_${i}`;
      const occupantId = Object.keys(locations).find(id => locations[id] === slotId);
      const occupantText = occupantId ? allSyllables.find(s => s.id === occupantId)?.text : null;
      
      if (occupantText === expectedSyllable.text) {
        correctSyllablesCount++;
      } else {
        isClueCorrect = false;
        if (expectedSyllable.messageIndex) {
          isHiddenMessageCorrect = false;
        }
      }
    });
    if (isClueCorrect) {
      correctCluesCount++;
    }
  });

  const allCluesCorrect = correctCluesCount === activePuzzle.clues.length;
  
  let currentScore = (correctSyllablesCount * 10) + (correctCluesCount * 25) + (allCluesCorrect ? 100 : 0) - (hintsUsed * 15);
  if (isMessageGuessed) {
     const remainingSyllables = allSyllables.length - correctSyllablesCount;
     const remainingClues = activePuzzle.clues.length - correctCluesCount;
     currentScore += (remainingSyllables * 10) + (remainingClues * 25) + (!allCluesCorrect ? 100 : 0) + 50;
  }
  currentScore = Math.max(0, currentScore);

  if ((allCluesCorrect || isMessageGuessed) && !isWon) {
    setIsWon(true);
    setIsTimerRunning(false);
    
    updateQuests('win');
    if (isDaily) updateQuests('daily_challenge');
    if (hintsUsed === 0) updateQuests('no_hints');
    if (activePuzzle.clues.length === 4) updateQuests('win_easy');
    if (activePuzzle.clues.length === 6) updateQuests('win_medium');
    if (activePuzzle.clues.length === 9) updateQuests('win_hard');
    
    // Update stats
    setStats(prev => {
      const today = new Date().toDateString();
      let newCurrentStreak = prev.currentStreak;
      let newMaxStreak = prev.maxStreak;
      
      if (isDaily) {
        if (prev.lastPlayedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (prev.lastPlayedDate === yesterday.toDateString()) {
            newCurrentStreak += 1;
          } else {
            newCurrentStreak = 1;
          }
          newMaxStreak = Math.max(newMaxStreak, newCurrentStreak);
        }
      }

      let newBestScores = { ...(prev.bestScores || { Easy: 0, Medium: 0, Hard: 0 }) };
      let newBestTimesByDifficulty = { ...(prev.bestTimesByDifficulty || { Easy: null, Medium: null, Hard: null }) };
      let newCompletionTimesByDifficulty = { ...(prev.completionTimesByDifficulty || { Easy: [], Medium: [], Hard: [] }) };
      const clueCount = activePuzzle.clues.length;
      let diffKey = '';
      if (clueCount === 4) diffKey = 'Easy';
      else if (clueCount === 6) diffKey = 'Medium';
      else if (clueCount === 9) diffKey = 'Hard';
      
      if (diffKey) {
        newBestScores[diffKey] = Math.max(newBestScores[diffKey] || 0, currentScore);
        
        const prevBestTime = newBestTimesByDifficulty[diffKey];
        newBestTimesByDifficulty[diffKey] = prevBestTime === null ? timeElapsed : Math.min(prevBestTime, timeElapsed);
        
        newCompletionTimesByDifficulty[diffKey] = [...(newCompletionTimesByDifficulty[diffKey] || []), timeElapsed];
      }

      return {
        ...prev,
        played: prev.played + 1,
        won: prev.won + 1,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        bestTime: prev.bestTime === null ? timeElapsed : Math.min(prev.bestTime, timeElapsed),
        lastPlayedDate: isDaily ? today : prev.lastPlayedDate,
        completionTimes: [...(prev.completionTimes || []), timeElapsed],
        totalScore: (prev.totalScore || 0) + currentScore,
        bestScores: newBestScores,
        bestTimesByDifficulty: newBestTimesByDifficulty,
        completionTimesByDifficulty: newCompletionTimesByDifficulty,
      };
    });
  }

  const handleGuessMessage = (guess: string) => {
    const normalizedGuess = guess.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const normalizedActual = activePuzzle.hiddenMessage.replace(/[^a-zA-Z]/g, '').toUpperCase();
    
    if (normalizedGuess === normalizedActual) {
      setIsMessageGuessed(true);
      setShowGuessModal(false);
      setGuessError('');
      updateQuests('guess_message');
    } else {
      setGuessError('Incorrect guess. Keep trying!');
    }
  };

  const renderHiddenMessage = () => {
    let charIndex = 1;
    return (
      <div className="relative flex flex-wrap gap-2 justify-center mt-8 p-6 bg-slate-800 rounded-xl shadow-inner">
        {!isMessageGuessed && !isWon && (
           <button 
             onClick={() => {
               setGuessError('');
               setShowGuessModal(true);
             }} 
             className="absolute -top-4 right-4 flex items-center gap-1 text-xs font-bold bg-primary-500 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-primary-400 hover:-translate-y-0.5 transition-all"
           >
             <MessageSquareText className="w-3 h-3" />
             Guess Message
           </button>
        )}
        {activePuzzle.hiddenMessage.split('').map((char, i) => {
          if (char === ' ') {
            return <div key={i} className="w-4" />;
          }
          
          const currentIndex = charIndex++;
          let letter = '';
          let isCorrect = false;
          
          if (isMessageGuessed) {
            letter = char;
            isCorrect = true;
          } else {
            for (const clue of activePuzzle.clues) {
              for (let sIdx = 0; sIdx < clue.syllables.length; sIdx++) {
                if (clue.syllables[sIdx].messageIndex === currentIndex) {
                  const slotId = `slot_${clue.id}_${sIdx}`;
                  const syllableIdInSlot = Object.keys(locations).find(id => locations[id] === slotId);
                  if (syllableIdInSlot) {
                    const text = allSyllables.find(s => s.id === syllableIdInSlot)?.text;
                    if (text) {
                      letter = text.charAt(0);
                      isCorrect = text === clue.syllables[sIdx].text;
                    }
                  }
                }
              }
            }
          }
          
          return (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold mb-1">{currentIndex}</span>
              <div className={cn(
                "w-8 h-10 border-b-2 flex items-center justify-center text-xl font-bold uppercase transition-colors duration-300",
                letter ? (isCorrect ? "border-green-400 text-green-400" : "border-white text-white") : "border-slate-600"
              )}>
                {letter}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const saveToDb = useCallback((puzzle: PuzzleDef) => {
    setPuzzleDb(prev => {
      if (prev.find(p => p.id === puzzle.id)) return prev;
      return [puzzle, ...prev];
    });
  }, [setPuzzleDb]);

  const generateFromPool = useCallback((themePrefix: string): PuzzleDef => {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    let targetClues = 6;
    let minHiddenLen = 4;
    let maxHiddenLen = 6;
    
    if (randomDifficulty === 'Easy') {
      targetClues = 4;
      minHiddenLen = 4;
      maxHiddenLen = 4;
    } else if (randomDifficulty === 'Hard') {
      targetClues = 9;
      minHiddenLen = 6;
      maxHiddenLen = 9;
    } else {
      targetClues = 6;
      minHiddenLen = 5;
      maxHiddenLen = 6;
    }
    
    let selected: {clue: string, syllables: string}[] = [];
    let finalHiddenMessage = "";
    
    // Try to create a puzzle with a hidden message
    const validHiddenWords = wordPool.filter(p => {
      const ans = p.syllables.replace(/[^a-zA-Z]/g, '');
      return ans.length >= minHiddenLen && ans.length <= maxHiddenLen;
    });
    
    let success = false;
    
    if (validHiddenWords.length > 0) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const hiddenItem = validHiddenWords[Math.floor(Math.random() * validHiddenWords.length)];
        const candidateMessage = hiddenItem.syllables.replace(/[^a-zA-Z]/g, '').toUpperCase();
        const messageChars = candidateMessage.split('');
        
        let tempSelected: {clue: string, syllables: string}[] = [];
        let charIndex = 0;
        let availablePool: {clue: string, syllables: string}[] = shuffle(wordPool.filter(p => p.clue !== hiddenItem.clue));
        
        while (tempSelected.length < targetClues && charIndex < messageChars.length && availablePool.length > 0) {
          let bestWordIdx = -1;
          let maxMatches = 0;
          
          for (let i = 0; i < availablePool.length; i++) {
            const item = availablePool[i];
            const syllables = item.syllables.split('-').map(s => s.trim().toUpperCase());
            let tempCharIdx = charIndex;
            let matches = 0;
            for (const syl of syllables) {
              if (tempCharIdx < messageChars.length && syl.startsWith(messageChars[tempCharIdx])) {
                matches++;
                tempCharIdx++;
              }
            }
            if (matches > maxMatches) {
              maxMatches = matches;
              bestWordIdx = i;
            }
          }
          
          if (bestWordIdx !== -1) {
            tempSelected.push(availablePool[bestWordIdx]);
            charIndex += maxMatches;
            availablePool.splice(bestWordIdx, 1);
          } else {
            break;
          }
        }
        
        if (charIndex === messageChars.length) {
          while (tempSelected.length < targetClues && availablePool.length > 0) {
            tempSelected.push(availablePool.pop()!);
          }
          if (tempSelected.length === targetClues) {
            selected = tempSelected;
            finalHiddenMessage = candidateMessage;
            success = true;
            break;
          }
        }
      }
    }
    
    if (!success) {
      // Fallback to random without hidden message
      const count = Math.min(wordPool.length, targetClues);
      const shuffled = shuffle([...wordPool]);
      selected = shuffled.slice(0, count);
      finalHiddenMessage = "";
    }
    
    const puzzleId = `pool-${Date.now()}`;
    const formattedClues = selected.map((item, index) => {
      const syllableParts = item.syllables.split('-').map(s => s.trim().toUpperCase());
      const answer = syllableParts.join('');
      return {
        id: index + 1,
        text: item.clue.trim(),
        answer,
        syllables: syllableParts.map((text, sIndex) => ({
          id: `${puzzleId}-c${index + 1}-s${sIndex + 1}`,
          text,
          messageIndex: undefined as number | undefined
        }))
      };
    });

    if (finalHiddenMessage) {
      let charIndex = 0;
      const messageChars = finalHiddenMessage.split('');
      for (const clue of formattedClues) {
        for (const syllable of clue.syllables) {
          if (charIndex < messageChars.length && syllable.text.startsWith(messageChars[charIndex])) {
            syllable.messageIndex = charIndex + 1;
            charIndex++;
          }
        }
      }
    }

    return {
      id: puzzleId,
      theme: `${themePrefix} (${randomDifficulty})`,
      hiddenMessage: finalHiddenMessage,
      clues: formattedClues
    };
  }, [wordPool]);

  // Preload Daily Challenge
  useEffect(() => {
    if (apiState === 'checking') return;
    const today = new Date().toDateString();
    const dailyTheme = `Daily Challenge: ${today}`;
    const existingDaily = puzzleDb.find(p => p.theme.startsWith(dailyTheme));
    
    if (!existingDaily) {
      if (apiState === 'connected') {
        generatePuzzle(dailyTheme, "", "Make it a general knowledge puzzle.", settings.difficulty)
          .then(puzzle => saveToDb(puzzle))
          .catch(err => {
            console.error("Background daily generation failed:", err);
            if (wordPool.length >= 9) {
              saveToDb(generateFromPool(dailyTheme));
            }
          });
      } else if (apiState === 'error' || apiState === 'missing_key') {
        if (wordPool.length >= 9) {
          saveToDb(generateFromPool(dailyTheme));
        }
      }
    }
  }, [apiState, puzzleDb, settings.difficulty, saveToDb, wordPool, generateFromPool]);

  // Preload Random Puzzle
  useEffect(() => {
    if (apiState !== 'connected' || preloadedRandom || isPreloadingRandom) return;
    
    setIsPreloadingRandom(true);
    generatePuzzle("Random Trivia", "", "Make it a mix of different fun topics.", settings.difficulty)
      .then(puzzle => setPreloadedRandom(puzzle))
      .catch(err => console.error("Background random generation failed:", err))
      .finally(() => setIsPreloadingRandom(false));
  }, [apiState, preloadedRandom, isPreloadingRandom, settings.difficulty]);

  // Clear preloaded random if difficulty changes
  useEffect(() => {
    setPreloadedRandom(null);
  }, [settings.difficulty]);

  const loadDailyChallenge = async () => {
    const today = new Date().toDateString();
    const dailyTheme = `Daily Challenge: ${today}`;
    
    const existingDaily = puzzleDb.find(p => p.theme.startsWith(dailyTheme));
    if (existingDaily) {
      setActivePuzzle(existingDaily);
      setIsDaily(true);
      setMode('play');
      return;
    }

    setIsGeneratingDaily(true);
    try {
      if (apiState !== 'connected') {
        throw new Error("API not connected");
      }
      const puzzle = await generatePuzzle(dailyTheme, "", "Make it a general knowledge puzzle.", settings.difficulty);
      saveToDb(puzzle);
      setActivePuzzle(puzzle);
      setIsDaily(true);
      setMode('play');
    } catch (err) {
      console.error("Failed to load daily challenge", err);
      if (wordPool.length >= 9) {
        const puzzle = generateFromPool(dailyTheme);
        saveToDb(puzzle);
        setActivePuzzle(puzzle);
        setIsDaily(true);
        setMode('play');
      } else {
        alert("Failed to load daily challenge. Please try again.");
      }
    } finally {
      setIsGeneratingDaily(false);
    }
  };

  const loadRandomPuzzle = async () => {
    if (preloadedRandom) {
      saveToDb(preloadedRandom);
      setActivePuzzle(preloadedRandom);
      setIsDaily(false);
      setMode('play');
      setPreloadedRandom(null); // Trigger next preload
      return;
    }

    setIsGeneratingRandom(true);
    try {
      const puzzle = await generatePuzzle("Random Trivia", "", "Make it a mix of different fun topics.", settings.difficulty);
      saveToDb(puzzle);
      setActivePuzzle(puzzle);
      setIsDaily(false);
      setMode('play');
    } catch (err) {
      console.error("Failed to generate random puzzle", err);
      alert("Failed to generate random puzzle. Please try again.");
    } finally {
      setIsGeneratingRandom(false);
    }
  };

  const loadRandomFromLibrary = () => {
    if (puzzleDb.length === 0) {
      alert("Your library is empty!");
      return;
    }
    const randomPuzzle = puzzleDb[Math.floor(Math.random() * puzzleDb.length)];
    setActivePuzzle(randomPuzzle);
    setIsDaily(false);
    setMode('play');
  };

  const loadFromPool = () => {
    if (wordPool.length < 9) {
      alert("Your word pool needs at least 9 clue/syllable pairs to generate a puzzle. Add more in the Custom Builder.");
      return;
    }
    
    const puzzle = generateFromPool("Offline Pool");
    saveToDb(puzzle);
    setActivePuzzle(puzzle);
    setIsDaily(false);
    setMode('play');
  };

  const renderApiStatus = () => {
    if (!settings.showApiStatus) return null;

    let icon = <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
    let text = "Checking API...";
    let colorClass = "bg-slate-100 text-slate-600 border-slate-200";

    if (apiState === 'connected') {
      icon = <Wifi className="w-4 h-4 text-emerald-500" />;
      text = "API Connected";
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (apiState === 'error') {
      icon = <WifiOff className="w-4 h-4 text-red-500" />;
      text = "API Error";
      colorClass = "bg-red-50 text-red-700 border-red-200";
    } else if (apiState === 'missing_key') {
      icon = <WifiOff className="w-4 h-4 text-amber-500" />;
      text = "API Key Missing";
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${colorClass}`}>
        {icon}
        <span className="hidden sm:inline">{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-12 transition-colors duration-300">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              S+
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Syllacrostic+</h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {renderApiStatus()}
            <button 
              onClick={() => setShowLibrary(true)}
              className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              title="Puzzle Library"
            >
              <Library className="w-5 h-5" />
            </button>
            {mode === 'play' && (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Time</span>
                  <span className="text-lg sm:text-xl font-bold text-slate-700 font-mono">{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Total</span>
                  <span className="text-lg sm:text-xl font-bold text-primary-600">{stats.totalScore || 0}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">Score</span>
                  <span className="text-lg sm:text-xl font-bold text-primary-600">{currentScore}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowQuests(true)}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
                title="Quests & Challenges"
              >
                <CheckSquare className="w-5 h-5" />
                {questsData.daily.some(q => q.completed && !q.completed) && ( // We auto collect, so no uncollected state, but we can show a dot if there are incomplete quests
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setShowStats(true)}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                title="Statistics"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {mode === 'build' ? (
          <PuzzleBuilder 
            wordPool={wordPool}
            setWordPool={setWordPool}
            onPuzzleCreated={(newPuzzle) => {
              saveToDb(newPuzzle);
              setActivePuzzle(newPuzzle);
              setIsDaily(false);
              setMode('play');
            }}
            onCancel={() => setMode('play')}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
              <div className="flex items-stretch shadow-sm rounded-lg hover:shadow-md transition-all">
                <button 
                  onClick={loadDailyChallenge}
                  disabled={isGeneratingDaily || isGeneratingRandom}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-l-lg font-medium disabled:opacity-70"
                >
                  <Calendar className="w-4 h-4" />
                  {isGeneratingDaily ? 'Loading...' : 'Daily Challenge'}
                </button>
                <div className="flex items-center gap-1 px-3 bg-orange-50 text-orange-600 border border-l-0 border-orange-200 rounded-r-lg font-bold" title="Daily Win Streak">
                  <Flame className="w-4 h-4 fill-orange-500" />
                  <span>{stats.currentStreak}</span>
                </div>
              </div>
              <button 
                onClick={loadRandomPuzzle}
                disabled={isGeneratingDaily || isGeneratingRandom}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-all disabled:opacity-70"
              >
                <Dices className="w-4 h-4" />
                {isGeneratingRandom ? 'Loading...' : 'Random Puzzle'}
              </button>
              <button 
                onClick={loadRandomFromLibrary}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-all"
              >
                <Library className="w-4 h-4" />
                Random from Library
              </button>
              <button 
                onClick={loadFromPool}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-all"
              >
                <Database className="w-4 h-4" />
                Random from Pool
              </button>
              <button 
                onClick={() => setMode('build')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-all"
              >
                <Wand2 className="w-4 h-4" />
                Build Custom
              </button>
              <button 
                onClick={resetPuzzle}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>
              <button 
                onClick={useHint}
                disabled={allCluesCorrect}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium shadow-sm hover:bg-amber-200 transition-all disabled:opacity-50"
              >
                <Lightbulb className="w-4 h-4" />
                Hint (-15)
              </button>
            </div>

            {isWon && (
              <div className="mb-8 p-6 bg-green-100 border-2 border-green-500 rounded-xl flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4">
                <Trophy className="w-12 h-12 text-green-600 mb-2" />
                <h2 className="text-2xl font-bold text-green-800 mb-1">Puzzle Solved!</h2>
                <p className="text-green-700">
                  {isMessageGuessed ? "You guessed the hidden message!" : "You revealed the hidden message!"} 
                  <br />Score: {currentScore} | Time: {formatTime(timeElapsed)}
                  <br />Total Points: {stats.totalScore || 0}
                </p>
              </div>
            )}

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Clues Section */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                      <span>Clues</span>
                      <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Theme: {activePuzzle.theme}</span>
                    </h2>
                    
                    <div className="space-y-4">
                      {activePuzzle.clues.map((clue, index) => {
                        // Check if this specific clue is fully correct
                        let isClueCorrect = true;
                        let isClueFull = true;
                        
                        clue.syllables.forEach((expectedSyllable, i) => {
                          const slotId = `slot_${clue.id}_${i}`;
                          const occupantId = Object.keys(locations).find(id => locations[id] === slotId);
                          const occupantText = occupantId ? allSyllables.find(s => s.id === occupantId)?.text : null;
                          
                          if (!occupantText) {
                            isClueFull = false;
                            isClueCorrect = false;
                          } else if (occupantText !== expectedSyllable.text) {
                            isClueCorrect = false;
                          }
                        });

                        return (
                          <div key={clue.id} className={cn(
                            "flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg transition-colors",
                            isClueCorrect ? "bg-green-50/50" : (isClueFull ? "bg-red-50/50" : "hover:bg-slate-50")
                          )}>
                            <div className="flex-1">
                              <span className="font-bold text-slate-400 mr-2">{index + 1}.</span>
                              <span className={cn("font-medium", isClueCorrect ? "text-green-800" : "text-slate-700")}>
                                {clue.text}
                              </span>
                              <span className="text-xs text-slate-400 ml-2">({clue.syllables.length} syl)</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {clue.syllables.map((expectedSyllable, i) => {
                                const slotId = `slot_${clue.id}_${i}`;
                                const occupantId = Object.keys(locations).find(id => locations[id] === slotId);
                                const occupant = occupantId ? allSyllables.find(s => s.id === occupantId) : null;
                                
                                const isSlotCorrect = occupant?.text === expectedSyllable.text;
                                const isSlotWrong = occupant && !isSlotCorrect && isClueFull;

                                return (
                                  <DroppableSlot 
                                    key={slotId} 
                                    id={slotId} 
                                    messageIndex={expectedSyllable.messageIndex}
                                    isCorrect={isSlotCorrect}
                                    onClick={() => handleSlotClick(slotId)}
                                    isHighlighted={settings.placementMethod === 'click' && selectedSyllable !== null}
                                  >
                                    {occupant && (
                                      <DraggableSyllable 
                                        id={occupant.id} 
                                        text={occupant.text} 
                                        isPlaced={true}
                                        isCorrect={isSlotCorrect}
                                        isWrong={isSlotWrong}
                                        disabled={settings.placementMethod === 'click'}
                                        onClick={() => handleSyllableClick(occupant.id, slotId)}
                                      />
                                    )}
                                  </DroppableSlot>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Syllable Bank Section */}
                <div className="lg:col-span-5">
                  <div className="sticky top-24 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                      <span>Syllable Bank</span>
                      <span className="text-sm font-normal text-slate-500">
                        {Object.values(locations).filter(l => l === 'bank').length} remaining
                      </span>
                    </h2>
                    
                    <DroppableBank id="bank">
                      {allSyllables.map(syllable => {
                        if (locations[syllable.id] === 'bank') {
                          return (
                            <div key={syllable.id} className="relative">
                              <DraggableSyllable 
                                id={syllable.id} 
                                text={syllable.text} 
                                isPlaced={false}
                                disabled={settings.placementMethod === 'click'}
                                onClick={() => handleSyllableClick(syllable.id, 'bank')}
                              />
                              {settings.placementMethod === 'click' && selectedSyllable === syllable.id && (
                                <div className="absolute inset-0 border-4 border-primary-500 rounded-lg pointer-events-none animate-pulse" />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}
                      {Object.values(locations).filter(l => l === 'bank').length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic py-8">
                          Bank is empty
                        </div>
                      )}
                    </DroppableBank>
                  </div>
                </div>

              </div>
            </DndContext>

            {activePuzzle.hiddenMessage && (
              <div className="mt-12">
                <h2 className="text-center text-lg font-bold text-slate-700 mb-2">Hidden Message</h2>
                <p className="text-center text-sm text-slate-500 mb-4">First letters of numbered syllables reveal the quote</p>
                {renderHiddenMessage()}
              </div>
            )}
          </>
        )}
      </main>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={setSettings} 
          onClose={() => setShowSettings(false)} 
          wordPool={wordPool}
          setWordPool={setWordPool}
          stats={stats}
          setStats={setStats}
        />
      )}

      {showQuests && (
        <QuestsModal 
          dailyQuests={questsData.daily}
          weeklyQuests={questsData.weekly}
          onClose={() => setShowQuests(false)} 
        />
      )}

      {showStats && (
        <StatsModal 
          stats={stats} 
          onClose={() => setShowStats(false)} 
        />
      )}

      {showGuessModal && (
        <GuessModal 
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuessMessage}
          error={guessError}
        />
      )}

      {showLibrary && (
        <PuzzleLibraryModal
          puzzles={puzzleDb}
          onSelect={(p) => {
            setActivePuzzle(p);
            setIsDaily(false);
            setMode('play');
            setShowLibrary(false);
          }}
          onDelete={(id) => {
            setPuzzleDb(prev => prev.filter(p => p.id !== id));
            if (activePuzzle.id === id && puzzleDb.length > 1) {
              const nextPuzzle = puzzleDb.find(p => p.id !== id);
              if (nextPuzzle) setActivePuzzle(nextPuzzle);
            }
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

