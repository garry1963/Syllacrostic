import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onGuess: (guess: string) => void;
  error?: string;
}

export function GuessModal({ onClose, onGuess, error }: Props) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            Guess Hidden Message
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Think you know the hidden message? Guess it now for 50 extra bonus points!
          </p>
          
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase font-bold text-center tracking-wider"
            autoFocus
          />
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="mt-6 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!guess.trim()}
              className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Submit Guess
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
