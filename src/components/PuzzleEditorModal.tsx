import React, { useState } from 'react';
import { PuzzleDef } from '../data';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  puzzle: PuzzleDef;
  onSave: (puzzle: PuzzleDef) => void;
  onClose: () => void;
}

export function PuzzleEditorModal({ puzzle, onSave, onClose }: Props) {
  const [theme, setTheme] = useState(puzzle.theme);
  const [hiddenMessage, setHiddenMessage] = useState(puzzle.hiddenMessage);
  const [clues, setClues] = useState<{ text: string; syllables: string }[]>(
    puzzle.clues.map(c => ({
      text: c.text,
      syllables: c.syllables.map(s => s.text).join('-')
    }))
  );
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

  const handleSave = () => {
    if (!theme.trim()) {
      setError('Theme is required.');
      return;
    }

    const validClues = clues.filter(c => c.text.trim() && c.syllables.trim());
    if (validClues.length < 3) {
      setError('Please provide at least 3 valid clues with syllables.');
      return;
    }

    try {
      const formattedClues = validClues.map((clue, index) => {
        const syllableParts = clue.syllables.split('-').map(s => s.trim().toUpperCase());
        const answer = syllableParts.join('');
        
        return {
          id: index + 1,
          text: clue.text.trim(),
          answer,
          syllables: syllableParts.map((text, sIndex) => ({
            id: `${puzzle.id}-c${index + 1}-s${sIndex + 1}`,
            text,
            messageIndex: undefined as number | undefined
          }))
        };
      });

      let finalHiddenMessage = hiddenMessage.trim().toUpperCase();
      if (finalHiddenMessage) {
        let charIndex = 0;
        const messageChars = finalHiddenMessage.replace(/[^A-Z]/g, '').split('');
        for (const clue of formattedClues) {
          for (const syllable of clue.syllables) {
            if (charIndex < messageChars.length && syllable.text.startsWith(messageChars[charIndex])) {
              syllable.messageIndex = charIndex + 1;
              charIndex++;
            }
          }
        }
      }

      const updatedPuzzle: PuzzleDef = {
        ...puzzle,
        theme: theme.trim(),
        hiddenMessage: finalHiddenMessage,
        clues: formattedClues
      };

      onSave(updatedPuzzle);
    } catch (err: any) {
      setError(err.message || 'Failed to save puzzle.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            Edit Puzzle
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Theme / Title</label>
              <input 
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hidden Message (Optional)</label>
              <input 
                type="text" 
                value={hiddenMessage}
                onChange={(e) => setHiddenMessage(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Clues & Syllables</label>
              <span className="text-xs text-slate-500">Format syllables with hyphens (e.g., AN-SWER)</span>
            </div>
            
            <div className="space-y-3">
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
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Clue
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
