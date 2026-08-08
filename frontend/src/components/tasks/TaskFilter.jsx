import React from 'react';
import { Search, Filter } from 'lucide-react';

const TaskFilter = ({
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
}) => {
  const filterOptions = ['All', 'Pending', 'In Progress', 'Completed'];

  return (
    <div className="glass-card rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
      {/* Search Box */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="task-search-input"
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider hidden sm:inline-flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          Filter:
        </span>
        {filterOptions.map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              id={`filter-btn-${status.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onStatusChange(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TaskFilter;
