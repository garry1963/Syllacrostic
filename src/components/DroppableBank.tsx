import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

interface Props {
  id: string;
  children: React.ReactNode;
}

export function DroppableBank({ id, children }: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-wrap gap-3 p-6 min-h-[200px] border-2 rounded-xl transition-colors",
        isOver ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-slate-50"
      )}
    >
      {children}
    </div>
  );
}
