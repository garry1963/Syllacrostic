import React from 'react';
import { X, Trophy, Flame, Clock, Target, Star } from 'lucide-react';

interface Stats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  bestTime: number | null;
  completionTimes?: number[];
  totalScore?: number;
  bestScores?: Record<string, number>;
}

interface Props {
  stats: Stats;
  onClose: () => void;
}

export function StatsModal({ stats, onClose }: Props) {
  const formatTime = (s: number) => {
    if (s === null || s === undefined) return '--:--';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  const calculateAverageTime = () => {
    if (!stats.completionTimes || stats.completionTimes.length === 0) return null;
    const sum = stats.completionTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / stats.completionTimes.length);
  };

  const calculateMedianTime = () => {
    if (!stats.completionTimes || stats.completionTimes.length === 0) return null;
    const sorted = [...stats.completionTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const avgTime = calculateAverageTime();
  const medTime = calculateMedianTime();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-500" />
            Your Statistics
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-800">{stats.played}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Played</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-800">{winRate}%</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Win Rate</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-orange-50 text-orange-900 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">Current Streak</span>
              </div>
              <span className="text-xl font-bold">{stats.currentStreak}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-slate-400" />
                <span className="font-semibold">Max Streak</span>
              </div>
              <span className="text-xl font-bold">{stats.maxStreak}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary-50 text-primary-900 rounded-xl border border-primary-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-semibold">Best Time</span>
              </div>
              <span className="text-xl font-bold">{formatTime(stats.bestTime || 0)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="font-semibold">Average Time</span>
              </div>
              <span className="text-xl font-bold">{avgTime !== null ? formatTime(avgTime) : '--:--'}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="font-semibold">Median Time</span>
              </div>
              <span className="text-xl font-bold">{medTime !== null ? formatTime(medTime) : '--:--'}</span>
            </div>

            {stats.bestScores && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Best Scores
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <span className="block text-xs font-semibold text-green-700 uppercase mb-1">Easy</span>
                    <span className="text-lg font-bold text-green-800">{stats.bestScores.Easy || 0}</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                    <span className="block text-xs font-semibold text-blue-700 uppercase mb-1">Medium</span>
                    <span className="text-lg font-bold text-blue-800">{stats.bestScores.Medium || 0}</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-center">
                    <span className="block text-xs font-semibold text-purple-700 uppercase mb-1">Hard</span>
                    <span className="text-lg font-bold text-purple-800">{stats.bestScores.Hard || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
