import React from 'react';
import { X, Play, Trash2, Library } from 'lucide-react';
import { PuzzleDef } from '../data';

interface Props {
  puzzles: PuzzleDef[];
  onSelect: (puzzle: PuzzleDef) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PuzzleLibraryModal({ puzzles, onSelect, onDelete, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Library className="w-5 h-5 text-primary-600" />
            Puzzle Library
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {puzzles.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No saved puzzles yet.</p>
              <p className="text-sm text-slate-400 mt-1">Generate a daily, random, or custom puzzle to save it here.</p>
            </div>
          ) : (
            puzzles.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all">
                <div>
                  <h3 className="font-bold text-slate-800">{p.theme}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {p.clues.length} clues • {p.hiddenMessage.length} letter message
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onSelect(p)} 
                    className="flex items-center gap-1 px-3 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)} 
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Puzzle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
