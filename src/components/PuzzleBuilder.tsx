import React, { useState } from 'react';
import { PuzzleDef } from '../data';
import { Wand2, Loader2, AlertCircle, X, Plus, Trash2, Check, BookOpen, Upload, Database } from 'lucide-react';
import { generatePuzzle } from '../lib/puzzleGenerator';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Props {
  onPuzzleCreated: (puzzle: PuzzleDef) => void;
  onCancel: () => void;
  wordPool: { clue: string; syllables: string }[];
  setWordPool: (pool: { clue: string; syllables: string }[]) => void;
}

export function PuzzleBuilder({ onPuzzleCreated, onCancel, wordPool, setWordPool }: Props) {
  const [mode, setMode] = useState<'ai' | 'manual' | 'bulk'>('ai');
  const [theme, setTheme] = useState('');
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [settings] = useLocalStorage('syllacrostic-settings', { theme: 'blue', difficulty: 'Medium' });

  // Manual Builder State
  const [clues, setClues] = useState<{ text: string; syllables: string }[]>([
    { text: '', syllables: '' },
    { text: '', syllables: '' },
    { text: '', syllables: '' },
  ]);

  // Bulk Upload State
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const handleGenerateAI = async () => {
    if (!theme) {
      setError('Theme is required.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const data = await generatePuzzle(theme, hiddenMessage, instructions, settings.difficulty);
      onPuzzleCreated(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate puzzle. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleBuildManual = () => {
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
            messageIndex: undefined
          }))
        };
      });

      let finalHiddenMessage = hiddenMessage.trim().toUpperCase();
      if (finalHiddenMessage) {
        const messageChars = finalHiddenMessage.replace(/\s/g, '').split('');
        let charIndex = 0;
        
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

  const handleBulkUpload = () => {
    setBulkError('');
    setBulkSuccess('');
    
    if (!bulkText.trim()) {
      setBulkError('Please enter some text.');
      return;
    }

    const lines = bulkText.split('\n');
    const newItems: { clue: string; syllables: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const separatorRegex = /[,|\t]/;
      if (separatorRegex.test(line)) {
        const parts = line.split(separatorRegex);
        const syllables = parts.pop()?.trim().toUpperCase().replace(/\s+/g, '') || '';
        const clue = parts.join(',').trim();
        
        if (clue && syllables.includes('-')) {
          newItems.push({ clue, syllables });
          continue;
        }
      }
      
      const spaceParts = line.split(' ');
      const lastPart = spaceParts.pop()?.trim().toUpperCase() || '';
      if (lastPart.includes('-')) {
        const clue = spaceParts.join(' ').trim();
        if (clue) {
          newItems.push({ clue, syllables: lastPart });
          continue;
        }
      }
      
      setBulkError(`Could not parse line ${i + 1}: "${line}". Format should be: Clue, SYL-LA-BLES`);
      return;
    }
    
    if (newItems.length === 0) {
      setBulkError('No valid clue/syllable pairs found.');
      return;
    }
    
    setWordPool([...wordPool, ...newItems]);
    setBulkSuccess(`Successfully added ${newItems.length} pairs to the word pool!`);
    setBulkText('');
  };

  const handleClearPool = () => {
    if (confirm('Are you sure you want to clear your entire word pool?')) {
      setWordPool([]);
      setBulkSuccess('Word pool cleared.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Custom Puzzle Builder</h2>
          <p className="text-slate-500 mt-1">Create your own puzzle or use AI to generate one.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => { setMode('ai'); setError(''); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'ai' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          AI Generator
        </button>
        <button
          onClick={() => { setMode('manual'); setError(''); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => { setMode('bulk'); setError(''); setBulkError(''); setBulkSuccess(''); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'bulk' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Bulk Upload
        </button>
      </div>

      <div className="space-y-5">
        {mode !== 'bulk' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Theme</label>
              <input 
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., 80s Sci-Fi Movies"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hidden Message</label>
              <input 
                type="text" 
                value={hiddenMessage}
                onChange={(e) => setHiddenMessage(e.target.value)}
                placeholder="e.g., I AM YOUR FATHER (Optional)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase"
              />
            </div>
          </div>
        )}

        {mode === 'ai' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Additional Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide specific clues and answers you want included, or leave blank to let AI generate everything."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>
        )}
        
        {mode === 'manual' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mt-2">
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
        )}

        {mode === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                <Database className="w-4 h-4" />
                Offline Word Pool ({wordPool.length} pairs)
              </h3>
              <p className="text-sm text-blue-700">
                Upload a list of clue/syllable pairs to your local pool. You can then use the <strong>"Random from Pool"</strong> button on the main screen to instantly generate puzzles offline!
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Paste Clue/Syllable Pairs
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Format: <code>Clue, SYL-LA-BLES</code> (one per line). You can also use tabs or pipes as separators.
              </p>
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="A large body of water, O-CEAN&#10;To walk slowly, AM-BLE"
                rows={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono text-sm resize-none"
              />
            </div>

            {bulkError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">{bulkError}</p>
              </div>
            )}

            {bulkSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-green-700">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">{bulkSuccess}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleClearPool}
                disabled={wordPool.length === 0}
                className="px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Clear Pool
              </button>
              <div className="flex-1"></div>
              <button 
                onClick={handleBulkUpload}
                disabled={!bulkText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Add to Pool
              </button>
            </div>
          </div>
        )}

        {error && mode !== 'bulk' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button 
            onClick={onCancel}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {mode === 'bulk' ? 'Close' : 'Cancel'}
          </button>
          
          {mode === 'ai' && (
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating || !theme}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Puzzle...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate with AI
                </>
              )}
            </button>
          )}
          
          {mode === 'manual' && (
            <button 
              onClick={handleBuildManual}
              disabled={!theme}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              Save & Play Puzzle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
