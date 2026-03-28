import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

interface Props {
  key?: React.Key;
  id: string;
  children?: React.ReactNode;
  messageIndex?: number;
  isCorrect?: boolean;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export function DroppableSlot({ id, children, messageIndex, isCorrect, onClick, isHighlighted }: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center min-w-[4rem] h-12 border-2 border-dashed rounded-lg transition-colors",
        isOver ? "border-primary-500 bg-primary-50" : "border-slate-300 bg-slate-100/50",
        isCorrect && "border-green-500/50 bg-green-50/50",
        children && !isOver && !isCorrect && "border-transparent bg-transparent",
        isHighlighted && "cursor-pointer hover:border-primary-400 hover:bg-primary-50/50",
        onClick && !children && "cursor-pointer"
      )}
    >
      {messageIndex && (
        <span className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center bg-slate-800 text-white text-[10px] font-bold rounded-full z-10 shadow-sm">
          {messageIndex}
        </span>
      )}
      {children}
    </div>
  );
}
