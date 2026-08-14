'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { t as getT, type Locale } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/error-boundary';
import { Header } from '@/components/header';
import { AiProfileCreator } from '@/components/ai-profile-creator';
import { NotionProfiles } from '@/components/notion-profiles';
import { TagGuide } from '@/components/tag-guide';
import { NotionSettings } from '@/components/notion-settings';
import { Sparkles, Database, Tags, Settings, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const {
    locale, setLocale,
    loadNotionConfig, loadGoogleConfig,
    activeTab, setActiveTab,
    toastMessage, toastType, clearToast,
  } = useAppStore();
  const tr = getT(locale);

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('vps-locale') : null) as Locale | null;
    if (saved) setLocale(saved);
    loadNotionConfig();
    loadGoogleConfig();
  }, []);

  // Auto-test connections after server config loads
  // (intentionally empty - values pre-load from server env via loadNotionConfig)

  useEffect(() => {
    if (toastMessage && toastType) {
      if (toastType === 'success') toast.success(toastMessage);
      else toast.error(toastMessage);
      clearToast();
    }
  }, [toastMessage, toastType]);

  const tabs = [
    { id: 'create', label: tr.nav.create, icon: Sparkles },
    { id: 'profiles', label: tr.nav.profiles, icon: Database },
    { id: 'tagGuide', label: tr.nav.tagGuide, icon: Tags },
    { id: 'settings', label: tr.nav.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.06_0.005_300)]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Banner */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-purple-950/30 border border-red-900/20 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 rounded-lg bg-red-500/10 items-center justify-center shrink-0">
              <Radio className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">{tr.app.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === 'es' ? 'Genera perfiles con IA' : 'AI-powered profiles'} &middot; {locale === 'es' ? 'Guardar en Notion' : 'Save to Notion'} &middot; 30 {locale === 'es' ? 'voces Gemini TTS' : 'Gemini TTS voices'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-zinc-800/50 border border-transparent'
                  }`
                }
 >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        {activeTab === 'create' && <ErrorBoundary><AiProfileCreator /></ErrorBoundary>}
        {activeTab === 'profiles' && <ErrorBoundary><NotionProfiles /></ErrorBoundary>}
        {activeTab === 'tagGuide' && <ErrorBoundary><TagGuide /></ErrorBoundary>}
        {activeTab === 'settings' && <ErrorBoundary><NotionSettings /></ErrorBoundary>}
      </main>

      <footer className="border-t border-zinc-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-600">
          <span>SisCoPerLocIA &middot; Gemini TTS</span>
          <span>Voces Campesinas &middot; <span className="text-gray-500 font-mono">v4.1</span></span>
        </div>
      </footer>
    </div>
  );
}
