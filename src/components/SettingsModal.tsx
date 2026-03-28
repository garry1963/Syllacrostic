import React from 'react';
import { X, Palette, Gauge, Wifi } from 'lucide-react';

export interface Settings {
  theme: string;
  difficulty: string;
  showApiStatus?: boolean;
  placementMethod?: 'drag' | 'click';
  sortSyllables?: boolean;
}

interface Props {
  settings: Settings;
  onUpdate: (newSettings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdate, onClose }: Props) {
  const themes = [
    { id: 'theme-blue', name: 'Ocean Blue', color: 'bg-blue-500' },
    { id: 'theme-emerald', name: 'Emerald Forest', color: 'bg-emerald-500' },
    { id: 'theme-violet', name: 'Deep Violet', color: 'bg-violet-500' },
    { id: 'theme-rose', name: 'Rose Petal', color: 'bg-rose-500' },
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Settings
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Color Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => onUpdate({ ...settings, theme: t.id })}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    settings.theme === t.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${t.color} shadow-sm`} />
                  <span className="font-medium text-slate-700 text-sm">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Default Difficulty
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {difficulties.map(d => (
                <button
                  key={d}
                  onClick={() => onUpdate({ ...settings, difficulty: d })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    settings.difficulty === d
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Applies to Daily Challenges and Custom Puzzles.
            </p>
          </div>

          {/* Gameplay Preferences */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Gameplay Preferences
            </h3>
            
            <div className="space-y-4">
              {/* Placement Method */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="mb-3">
                  <span className="font-bold text-slate-700 block">Placement Method</span>
                  <span className="text-xs text-slate-500">How do you want to move syllables?</span>
                </div>
                <div className="flex bg-slate-200 p-1 rounded-lg">
                  <button
                    onClick={() => onUpdate({ ...settings, placementMethod: 'drag' })}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                      (!settings.placementMethod || settings.placementMethod === 'drag')
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Drag & Drop
                  </button>
                  <button
                    onClick={() => onUpdate({ ...settings, placementMethod: 'click' })}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                      settings.placementMethod === 'click'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Click to Move
                  </button>
                </div>
              </div>

              {/* Sort Syllables */}
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-slate-700 block">Sort Syllable Bank</span>
                  <span className="text-xs text-slate-500">Alphabetize syllables in the bank</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.sortSyllables ? 'bg-primary-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.sortSyllables ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={!!settings.sortSyllables}
                  onChange={(e) => onUpdate({ ...settings, sortSyllables: e.target.checked })}
                />
              </label>
            </div>
          </div>

          {/* API Connection Status Toggle */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Advanced
            </h3>
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-bold text-slate-700 block">Show API Connection State</span>
                <span className="text-xs text-slate-500">Display Gemini API status in the header</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.showApiStatus ? 'bg-primary-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showApiStatus ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={!!settings.showApiStatus}
                onChange={(e) => onUpdate({ ...settings, showApiStatus: e.target.checked })}
              />
            </label>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
