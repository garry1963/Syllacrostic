import React, { useState } from 'react';
import { PuzzleDef } from '../data';
import { Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  onPuzzleCreated: (puzzle: PuzzleDef) => void;
  onCancel: () => void;
}

export function ManualPuzzleBuilder({ onPuzzleCreated, onCancel }: Props) {
  const [theme, setTheme] = useState('');
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [clues, setClues] = useState<{ text: string; syllables: string }[]>([
    { text: '', syllables: '' },
    { text: '', syllables: '' },
    { text: '', syllables: '' },
  ]);
  const [error, setError] = useState('');

  const handleAddClue = () => {
    setClues([...clues, { text: '', syllables: '' }]);
  };

  const handleRemoveClue = (index: number) => {
    setClues(clues.filter((_, i) => i !== index));
  };

  const handleClueChange = (index: number, field: 'text' | 'syllables', value: string) => {
    const newClues = [...clues];
    newClues[index][field] = value;
    setClues(newClues);
  };

  const handleBuild = () => {
    if (!theme.trim()) {
      setError('Theme is required.');
      return;
    }

    const validClues = clues.filter(c => c.text.trim() && c.syllables.trim());
    if (validClues.length < 3) {
      setError('Please provide at least 3 valid clues with syllables.');
      return;
    }

    // Validate syllables format (e.g., WA-TER)
    for (const clue of validClues) {
      if (!clue.syllables.includes('-') && clue.syllables.length > 4) {
        // Just a loose check, but we expect hyphens
      }
    }

    try {
      const puzzleId = `manual-${Date.now()}`;
      const formattedClues = validClues.map((clue, index) => {
        const syllableParts = clue.syllables.split('-').map(s => s.trim().toUpperCase());
        const answer = syllableParts.join('');
        
        return {
          id: index + 1,
          text: clue.text.trim(),
          answer,
          syllables: syllableParts.map((text, sIndex) => ({
            id: `${puzzleId}-c${index + 1}-s${sIndex + 1}`,
            text,
            messageIndex: undefined // We'll compute this if hidden message exists
          }))
        };
      });

      // Handle hidden message logic if provided
      let finalHiddenMessage = hiddenMessage.trim().toUpperCase();
      if (finalHiddenMessage) {
        const messageChars = finalHiddenMessage.replace(/\s/g, '').split('');
        let charIndex = 0;
        
        // Try to assign messageIndex to syllables whose first letter matches
        for (const clue of formattedClues) {
          for (const syllable of clue.syllables) {
            if (charIndex < messageChars.length && syllable.text.startsWith(messageChars[charIndex])) {
              syllable.messageIndex = charIndex + 1;
              charIndex++;
            }
          }
        }

        if (charIndex < messageChars.length) {
          setError(`Could not fit the hidden message "${finalHiddenMessage}". Make sure your syllables start with the required letters in order: ${messageChars.join(', ')}`);
          return;
        }
      }

      const puzzle: PuzzleDef = {
        id: puzzleId,
        theme: theme.trim(),
        hiddenMessage: finalHiddenMessage,
        clues: formattedClues
      };

      onPuzzleCreated(puzzle);
    } catch (err: any) {
      setError(err.message || 'Failed to build puzzle.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manual Puzzle Builder</h2>
          <p className="text-slate-500 mt-1">Create your own puzzle by entering clues and syllables.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Theme</label>
            <input 
              type="text" 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., My Family, Custom Trivia"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hidden Message (Optional)</label>
            <input 
              type="text" 
              value={hiddenMessage}
              onChange={(e) => setHiddenMessage(e.target.value)}
              placeholder="e.g., HAPPY BIRTHDAY"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">Clues & Syllables</label>
            <span className="text-xs text-slate-500">Format syllables with hyphens (e.g., WA-TER)</span>
          </div>
          
          {clues.map((clue, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={clue.text}
                  onChange={(e) => handleClueChange(index, 'text', e.target.value)}
                  placeholder={`Clue ${index + 1}`}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={clue.syllables}
                  onChange={(e) => handleClueChange(index, 'syllables', e.target.value)}
                  placeholder="Syllables (e.g., AN-SWER)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase"
                />
              </div>
              <button 
                onClick={() => handleRemoveClue(index)}
                disabled={clues.length <= 3}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button 
            onClick={handleAddClue}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Clue
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleBuild}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Check className="w-5 h-5" />
            Save & Play Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
