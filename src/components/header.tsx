'use client';

import { Radio } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';

export function Header() {
  const { locale } = useAppStore();
  const tr = getT(locale);

  return (
    <header className="border-b border-red-900/30 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-7 w-7 text-red-500" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tr.app.title}
            </h1>
            <p className="text-xs text-red-400/70 hidden sm:block">
              {tr.app.subtitle}
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
