'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export type ViewMode = 'list' | 'box';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const { t } = useLanguage();

  return (
    <div className="flex bg-slate-100 rounded-full p-1 shadow-inner">
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          viewMode === 'list'
            ? 'bg-white text-primary-700 shadow-md'
            : 'text-slate-600 hover:text-slate-800'
        }`}
        title={t('view.list')}
      >
        <List size={16} />
        <span className="hidden sm:inline">{t('view.list')}</span>
      </button>
      <button
        onClick={() => onViewChange('box')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          viewMode === 'box'
            ? 'bg-white text-primary-700 shadow-md'
            : 'text-slate-600 hover:text-slate-800'
        }`}
        title={t('view.box')}
      >
        <LayoutGrid size={16} />
        <span className="hidden sm:inline">{t('view.box')}</span>
      </button>
    </div>
  );
}
