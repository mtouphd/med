'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, localeNames, Locale } from '@/lib/language-context';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const locales: Locale[] = ['en', 'fr', 'ar'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 end-6 z-50" ref={menuRef}>
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-full end-0 mb-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden min-w-[160px] animate-fade-in">
            <div className="p-2">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLanguage(loc)}
                  className={`w-full px-4 py-3 text-sm text-start rounded-xl transition-all ${
                    locale === loc
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-midnight-700 hover:bg-slate-50'
                  }`}
                >
                  {localeNames[loc]}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-all ${
            isOpen
              ? 'bg-primary-500 text-white shadow-primary-500/30'
              : 'bg-white text-midnight-700 hover:bg-slate-50 shadow-slate-200/50'
          }`}
        >
          <Globe size={20} strokeWidth={1.5} />
          <span className="text-sm font-medium">{localeNames[locale]}</span>
        </button>
      </div>
    </div>
  );
}
