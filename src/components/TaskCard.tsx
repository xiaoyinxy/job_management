'use client';

import React from 'react';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, onDelete, onDragStart, onDragEnd }) => {
  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
    >
      <h3 className="font-medium text-foreground">{task.company}</h3>
      <p className="text-sm text-foreground/70">{task.position}</p>
      {task.deadline && (
        <p className="text-xs text-foreground/60 mt-2">重要日期: {new Date(task.deadline).toLocaleDateString()}</p>
      )}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => onDelete(task.id)}
          className="btn btn-danger text-xs py-1 px-3"
        >
          删除
        </button>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;