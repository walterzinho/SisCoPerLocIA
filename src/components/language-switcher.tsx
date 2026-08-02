'use client';

import { Globe } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { t as getT, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { locale, setLocale } = useAppStore();
  const tr = getT(locale);

  const toggle = () => {
    const next: Locale = locale === 'es' ? 'en' : 'es';
    setLocale(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
    >
      <Globe className="h-4 w-4" />
      {locale === 'es' ? tr.common.english : tr.common.spanish}
    </Button>
  );
}
