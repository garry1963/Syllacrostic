import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Clock, Star, Target } from 'lucide-react';
import { Quest, getCurrentMonday } from '../lib/quests';

interface Props {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  onClose: () => void;
}

export function QuestsModal({ dailyQuests, weeklyQuests, onClose }: Props) {
  const [weeklyTimeLeft, setWeeklyTimeLeft] = useState('');
  const [dailyTimeLeft, setDailyTimeLeft] = useState('');

  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      
      // Daily reset (midnight)
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const dailyDiff = nextMidnight.getTime() - now.getTime();
      
      if (dailyDiff <= 0) {
        setDailyTimeLeft('Resetting soon...');
      } else {
        const h = Math.floor((dailyDiff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((dailyDiff / 1000 / 60) % 60);
        const s = Math.floor((dailyDiff / 1000) % 60);
        setDailyTimeLeft(`${h}h ${m}m ${s}s`);
      }

      // Weekly reset (next Monday midnight)
      const nextMonday = new Date(getCurrentMonday());
      nextMonday.setDate(nextMonday.getDate() + 7);
      nextMonday.setHours(0, 0, 0, 0);
      
      const weeklyDiff = nextMonday.getTime() - now.getTime();
      if (weeklyDiff <= 0) {
        setWeeklyTimeLeft('Resetting soon...');
      } else {
        const d = Math.floor(weeklyDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((weeklyDiff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((weeklyDiff / 1000 / 60) % 60);
        const s = Math.floor((weeklyDiff / 1000) % 60);
        setWeeklyTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderQuest = (quest: Quest) => {
    const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
    
    return (
      <div key={quest.id} className={`p-4 rounded-xl border ${quest.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'} shadow-sm mb-3`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {quest.completed ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <CheckSquare className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
            <h4 className={`font-semibold ${quest.completed ? 'text-green-800' : 'text-slate-800'}`}>
              {quest.description}
            </h4>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 shrink-0">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">{quest.reward}</span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className={quest.completed ? 'text-green-700' : 'text-slate-500'}>
              {quest.completed ? 'Completed' : 'Progress'}
            </span>
            <span className={quest.completed ? 'text-green-700' : 'text-slate-700'}>
              {quest.progress} / {quest.target}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${quest.completed ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-500" />
            Quests & Challenges
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Daily Quests</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Resets in {dailyTimeLeft}</span>
              </div>
            </div>
            <div className="space-y-3">
              {dailyQuests.length > 0 ? dailyQuests.map(renderQuest) : (
                <div className="text-center p-4 text-slate-500 text-sm">No daily quests available.</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Weekly Challenges</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Resets in {weeklyTimeLeft}</span>
              </div>
            </div>
            <div className="space-y-3">
              {weeklyQuests.length > 0 ? weeklyQuests.map(renderQuest) : (
                <div className="text-center p-4 text-slate-500 text-sm">No weekly challenges available.</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-white border-t border-slate-200 shrink-0">
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
