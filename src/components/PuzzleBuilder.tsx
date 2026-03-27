import React, { useState } from 'react';
import { PuzzleDef } from '../data';
import { Wand2, Loader2, AlertCircle, X } from 'lucide-react';
import { generatePuzzle } from '../lib/puzzleGenerator';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Props {
  onPuzzleCreated: (puzzle: PuzzleDef) => void;
  onCancel: () => void;
}

export function PuzzleBuilder({ onPuzzleCreated, onCancel }: Props) {
  const [theme, setTheme] = useState('');
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [settings] = useLocalStorage('syllacrostic-settings', { theme: 'blue', difficulty: 'Medium' });

  const handleGenerate = async () => {
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

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Custom Puzzle Builder</h2>
          <p className="text-slate-500 mt-1">Use AI to generate a custom Syllacrostic+ puzzle.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Theme</label>
          <input 
            type="text" 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., 80s Sci-Fi Movies, European Capitals"
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
          <p className="text-xs text-slate-500 mt-1">The message revealed by the first letters of specific syllables.</p>
        </div>

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

        {error && (
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
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
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
        </div>
      </div>
    </div>
  );
}
