'use client';

import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'card' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
      <button
        onClick={() => onViewModeChange('card')}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          viewMode === 'card'
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Card view"
      >
        <LayoutGrid size={18} />
        <span>Cards</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          viewMode === 'list'
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="List view"
      >
        <List size={18} />
        <span>List</span>
      </button>
    </div>
  );
}
