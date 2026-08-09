import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
} from 'lucide-react';

const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date';

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between group shadow-lg hover:shadow-indigo-500/5">
      <div>
        {/* Header with Title and Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-white text-base line-clamp-2 leading-snug">
            {task.title}
          </h3>
          <div className="shrink-0">{getStatusBadge(task.status)}</div>
        </div>

        {/* Description */}
        {task.description ? (
          <p className="text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed">
            {task.description}
          </p>
        ) : (
          <p className="text-slate-600 text-xs italic mb-4">No description provided</p>
        )}
      </div>

      {/* Card Footer Actions & Info */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formattedDueDate}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline Status Toggle Dropdown */}
          <select
            id={`status-select-${task.id}`}
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-800 transition-colors"
            title="Inline Status Change"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Edit Button */}
          <button
            id={`edit-task-${task.id}`}
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            id={`delete-task-${task.id}`}
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
