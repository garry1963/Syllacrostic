export type QuestAction = 'play' | 'win' | 'win_easy' | 'win_medium' | 'win_hard' | 'daily_challenge' | 'no_hints' | 'guess_message' | 'win_hard_under_3m';

export interface Quest {
  id: string;
  description: string;
  action: QuestAction;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
}

export const DAILY_QUEST_TEMPLATES: Omit<Quest, 'progress' | 'completed'>[] = [
  { id: 'd1', description: 'Play 3 puzzles', action: 'play', target: 3, reward: 50 },
  { id: 'd2', description: 'Win the Daily Challenge', action: 'daily_challenge', target: 1, reward: 100 },
  { id: 'd3', description: 'Win a puzzle without hints', action: 'no_hints', target: 1, reward: 75 },
  { id: 'd4', description: 'Guess a hidden message', action: 'guess_message', target: 1, reward: 50 },
  { id: 'd5', description: 'Win 2 puzzles', action: 'win', target: 2, reward: 60 },
  { id: 'd6', description: 'Win 1 Hard puzzle in under 3 minutes', action: 'win_hard_under_3m', target: 1, reward: 150 },
];

export const WEEKLY_QUEST_TEMPLATES: Omit<Quest, 'progress' | 'completed'>[] = [
  { id: 'w1', description: 'Play 20 puzzles', action: 'play', target: 20, reward: 300 },
  { id: 'w2', description: 'Win 5 Easy puzzles', action: 'win_easy', target: 5, reward: 200 },
  { id: 'w3', description: 'Win 5 Medium puzzles', action: 'win_medium', target: 5, reward: 300 },
  { id: 'w4', description: 'Win 3 Hard puzzles', action: 'win_hard', target: 3, reward: 400 },
  { id: 'w5', description: 'Guess 5 hidden messages', action: 'guess_message', target: 5, reward: 250 },
  { id: 'w6', description: 'Win 5 puzzles without hints', action: 'no_hints', target: 5, reward: 350 },
];

export function getCurrentMonday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getRandomQuests(templates: Omit<Quest, 'progress' | 'completed'>[], count: number): Quest[] {
  const shuffled = [...templates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(t => ({
    ...t,
    progress: 0,
    completed: false
  }));
}
