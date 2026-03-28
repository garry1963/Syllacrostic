import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

interface Props {
  key?: React.Key;
  id: string;
  text: string;
  isPlaced: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function DraggableSyllable({ id, text, isPlaced, isCorrect, isWrong, onClick, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: disabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center px-4 py-2 bg-white border-2 rounded-lg shadow-sm select-none text-lg font-bold transition-colors touch-none",
        !disabled && "cursor-grab active:cursor-grabbing",
        disabled && onClick && "cursor-pointer hover:scale-105",
        isDragging && "opacity-80 shadow-lg scale-105 z-50",
        isPlaced && !isCorrect && !isWrong && "border-slate-300 text-slate-700",
        !isPlaced && "border-primary-400 text-primary-800 hover:border-primary-500 hover:bg-primary-50",
        isCorrect && "border-green-500 bg-green-50 text-green-700",
        isWrong && "border-red-400 bg-red-50 text-red-600"
      )}
    >
      {text}
    </div>
  );
}
