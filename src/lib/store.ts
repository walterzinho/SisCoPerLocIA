'use client';

import { create } from 'zustand';
import type { Locale } from './i18n';

export interface NotionProfile {
  pageId: string;
  url: string;
  profileName: string;
  announcerName: string;
  voice: string;
  audioProfile: string;
  style: string;
  pace: string;
  temperature: string;
  scene: string;
  sampleContext: string;
  tag: string;
  fullConfig: string;
  createdAt: string;
}

interface AiGenerated {
  voice: string;
  audioProfile: string;
  style: string;
  pace: string;
  temperature: number;
  scene: string;
  sampleContext: string;
  tag: string;
  suggestedTags: string[];
  voiceRationale: string;
}

interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // AI input (simple form)
  aiInput: {
    name: string;
    age: string;
    gender: string;
    profileType: string;
    region: string;
    scenario: string;
    additional: string;
  };
  setAiInput: (field: string, value: string) => void;
  resetAiInput: () => void;

  // AI generation state
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  aiGenerated: AiGenerated | null;
  setAiGenerated: (data: AiGenerated | null) => void;

  // Editable profile (after AI generation or loading from Notion)
  profileName: string;
  setProfileName: (v: string) => void;
  editField: <K extends keyof AiGenerated>(field: K, value: AiGenerated[K]) => void;

  // Generated text for preview
  generatedText: string;
  setGeneratedText: (text: string) => void;

  // Notion
  notionToken: string;
  setNotionToken: (v: string) => void;
  notionDatabaseId: string;
  setNotionDatabaseId: (v: string) => void;
  notionDbTitle: string;
  setNotionDbTitle: (v: string) => void;
  loadNotionConfig: () => Promise<void>;

  // Notion profiles
  notionProfiles: NotionProfile[];
  setNotionProfiles: (p: NotionProfile[]) => void;
  loadingProfiles: boolean;
  setLoadingProfiles: (v: boolean) => void;

  // Editing existing Notion profile
  editingPageId: string | null;
  setEditingPageId: (id: string | null) => void;

  // Google AI
  googleApiKey: string;
  setGoogleApiKey: (v: string) => void;
  loadGoogleConfig: () => void;

  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showEditor: boolean;
  setShowEditor: (v: boolean) => void;

  // Toast
  toastMessage: string | null;
  toastType: 'success' | 'error' | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  clearToast: () => void;
}

const emptyAiInput = {
  name: '', age: '', gender: '', profileType: '', region: '', scenario: '', additional: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  locale: 'es',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem('vps-locale', locale);
    set({ locale });
  },

  aiInput: { ...emptyAiInput },
  setAiInput: (field, value) => set((s) => ({ aiInput: { ...s.aiInput, [field]: value } })),
  resetAiInput: () => set({ aiInput: { ...emptyAiInput }, aiGenerated: null, generatedText: '', profileName: '', showEditor: false, editingPageId: null }),

  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  aiGenerated: null,
  setAiGenerated: (data) => set({ aiGenerated: data, showEditor: true }),

  profileName: '',
  setProfileName: (v) => set({ profileName: v }),
  editField: (field, value) => {
    const current = get().aiGenerated;
    if (!current) return;
    set({ aiGenerated: { ...current, [field]: value } });
  },

  generatedText: '',
  setGeneratedText: (text) => set({ generatedText: text }),

  notionToken: '',
  setNotionToken: (v) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-token', v); set({ notionToken: v }); },
  notionDatabaseId: '',
  setNotionDatabaseId: (v) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-db-id', v); set({ notionDatabaseId: v }); },
  notionDbTitle: '',
  setNotionDbTitle: (v) => set({ notionDbTitle: v }),
  loadNotionConfig: async () => {
    if (typeof window === 'undefined') return;
    const localToken = localStorage.getItem('vps-notion-token') || '';
    const localDbId = localStorage.getItem('vps-notion-db-id') || '';
    // If both are already in localStorage, use them
    if (localToken && localDbId) {
      set({ notionToken: localToken, notionDatabaseId: localDbId });
      return;
    }
    // Otherwise, try to load from server env vars
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      const token = localToken || data.notionToken || '';
      const dbId = localDbId || data.notionDatabaseId || '';
      if (token) localStorage.setItem('vps-notion-token', token);
      if (dbId) localStorage.setItem('vps-notion-db-id', dbId);
      if (data.googleApiKey) localStorage.setItem('vps-google-key', data.googleApiKey);
      set({
        notionToken: token,
        notionDatabaseId: dbId,
        googleApiKey: data.googleApiKey || get().googleApiKey || localStorage.getItem('vps-google-key') || '',
      });
    } catch {
      set({ notionToken: localToken, notionDatabaseId: localDbId });
    }
  },

  notionProfiles: [],
  setNotionProfiles: (p) => set({ notionProfiles: p }),
  loadingProfiles: false,
  setLoadingProfiles: (v) => set({ loadingProfiles: v }),

  editingPageId: null,
  setEditingPageId: (id) => set({ editingPageId: id }),

  googleApiKey: '',
  setGoogleApiKey: (v) => { if (typeof window !== 'undefined') localStorage.setItem('vps-google-key', v); set({ googleApiKey: v }); },
  loadGoogleConfig: () => {
    if (typeof window === 'undefined') return;
    const local = localStorage.getItem('vps-google-key') || '';
    if (local) set({ googleApiKey: local });
  },

  activeTab: 'create',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showEditor: false,
  setShowEditor: (v) => set({ showEditor: v }),

  toastMessage: null,
  toastType: null,
  showToast: (message, type) => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => set({ toastMessage: null, toastType: null }), 3500);
  },
  clearToast: () => set({ toastMessage: null, toastType: null }),
}));

export function buildProfileText(
  profileName: string,
  announcerName: string,
  data: { voice: string; audioProfile: string; style: string; pace: string; temperature: number; scene: string; sampleContext: string; tag: string },
  voiceName: string,
  voiceTrait: string,
): string {
  const lines = [
    `${profileName} - ${announcerName}`,
    '',
    `Audio Profile: ${data.audioProfile}`,
    `Style: ${data.style}`,
    `Pace: ${data.pace}`,
    `Temperatura: ${data.temperature}`,
    `Scene: ${data.scene}`,
    `Sample Context: ${data.sampleContext}`,
    `Etiqueta: ${data.tag}`,
    `Voz: ${voiceName}${voiceTrait && voiceTrait !== '—' ? ` (${voiceTrait})` : ''}.`,
  ];
  return lines.join('\n');
}
