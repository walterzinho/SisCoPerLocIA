'use client';

import { create } from 'zustand';
import type { Locale } from './i18n';
import { t as getTranslations } from './i18n';

export interface VoiceProfile {
  id: string;
  profileName: string;
  announcerName: string;
  voice: string;
  audioProfile: string;
  style: string;
  pace: string;
  temperature: number;
  scene: string;
  sampleContext: string;
  tag: string;
  createdAt: string;
}

interface AppState {
  // Language
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Form state
  formData: Omit<VoiceProfile, 'id' | 'createdAt'>;
  setFormField: <K extends keyof Omit<VoiceProfile, 'id' | 'createdAt'>>(field: K, value: Omit<VoiceProfile, 'id' | 'createdAt'>[K]) => void;
  resetForm: () => void;

  // Generated profile text
  generatedText: string;
  setGeneratedText: (text: string) => void;

  // History (local storage)
  savedProfiles: VoiceProfile[];
  loadProfiles: () => void;
  saveProfile: (profile: VoiceProfile) => void;
  deleteProfile: (id: string) => void;
  loadProfileIntoForm: (profile: VoiceProfile) => void;

  // Notion config
  notionApiKey: string;
  setNotionApiKey: (key: string) => void;
  notionParentPageId: string;
  setNotionParentPageId: (id: string) => void;
  notionDatabaseName: string;
  setNotionDatabaseName: (name: string) => void;
  notionDatabaseId: string;
  setNotionDatabaseId: (id: string) => void;
  loadNotionConfig: () => void;

  // Google AI
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;
  loadGoogleConfig: () => void;

  // Active tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Toast
  toastMessage: string | null;
  toastType: 'success' | 'error' | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  clearToast: () => void;

  // Helper
  t: () => ReturnType<typeof getTranslations>;
}

const emptyForm: Omit<VoiceProfile, 'id' | 'createdAt'> = {
  profileName: '',
  announcerName: '',
  voice: '',
  audioProfile: '',
  style: '',
  pace: 'moderate',
  temperature: 0.5,
  scene: '',
  sampleContext: '',
  tag: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  locale: 'es',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem('vps-locale', locale);
    set({ locale });
  },

  formData: { ...emptyForm },
  setFormField: (field, value) => set((s) => ({ formData: { ...s.formData, [field]: value } })),
  resetForm: () => set({ formData: { ...emptyForm }, generatedText: '' }),

  generatedText: '',
  setGeneratedText: (text) => set({ generatedText: text }),

  savedProfiles: [],
  loadProfiles: () => {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem('vps-profiles');
      if (data) set({ savedProfiles: JSON.parse(data) });
    } catch { /* ignore */ }
  },
  saveProfile: (profile) => {
    const updated = [profile, ...get().savedProfiles.filter(p => p.id !== profile.id)];
    if (typeof window !== 'undefined') localStorage.setItem('vps-profiles', JSON.stringify(updated));
    set({ savedProfiles: updated });
  },
  deleteProfile: (id) => {
    const updated = get().savedProfiles.filter(p => p.id !== id);
    if (typeof window !== 'undefined') localStorage.setItem('vps-profiles', JSON.stringify(updated));
    set({ savedProfiles: updated });
  },
  loadProfileIntoForm: (profile) => {
    set({
      formData: {
        profileName: profile.profileName,
        announcerName: profile.announcerName,
        voice: profile.voice,
        audioProfile: profile.audioProfile,
        style: profile.style,
        pace: profile.pace,
        temperature: profile.temperature,
        scene: profile.scene,
        sampleContext: profile.sampleContext,
        tag: profile.tag,
      },
      activeTab: 'create',
    });
  },

  notionApiKey: '',
  setNotionApiKey: (key) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-key', key); set({ notionApiKey: key }); },
  notionParentPageId: '',
  setNotionParentPageId: (id) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-parent', id); set({ notionParentPageId: id }); },
  notionDatabaseName: 'Perfiles de Locutores',
  setNotionDatabaseName: (name) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-dbname', name); set({ notionDatabaseName: name }); },
  notionDatabaseId: '',
  setNotionDatabaseId: (id) => { if (typeof window !== 'undefined') localStorage.setItem('vps-notion-db-id', id); set({ notionDatabaseId: id }); },
  loadNotionConfig: () => {
    if (typeof window === 'undefined') return;
    set({
      notionApiKey: localStorage.getItem('vps-notion-key') || '',
      notionParentPageId: localStorage.getItem('vps-notion-parent') || '',
      notionDatabaseName: localStorage.getItem('vps-notion-dbname') || 'Perfiles de Locutores',
      notionDatabaseId: localStorage.getItem('vps-notion-db-id') || '',
    });
  },

  googleApiKey: '',
  setGoogleApiKey: (key) => { if (typeof window !== 'undefined') localStorage.setItem('vps-google-key', key); set({ googleApiKey: key }); },
  loadGoogleConfig: () => {
    if (typeof window === 'undefined') return;
    set({ googleApiKey: localStorage.getItem('vps-google-key') || '' });
  },

  activeTab: 'create',
  setActiveTab: (tab) => set({ activeTab: tab }),

  toastMessage: null,
  toastType: null,
  showToast: (message, type) => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => set({ toastMessage: null, toastType: null }), 3500);
  },
  clearToast: () => set({ toastMessage: null, toastType: null }),

  t: () => getTranslations(get().locale),
}));

export function generateProfileText(profile: Omit<VoiceProfile, 'id' | 'createdAt'>, voiceName: string, voiceTrait: string): string {
  const lines = [
    `${profile.profileName} - ${profile.announcerName}`,
    '',
    `Audio Profile: ${profile.audioProfile}`,
    `Style: ${profile.style}`,
    `Pace: ${profile.pace}`,
    `Temperatura: ${profile.temperature}`,
    `Scene: ${profile.scene}`,
    `Sample Context: ${profile.sampleContext}`,
    `Etiqueta: ${profile.tag}`,
    `Voz: ${voiceName}${voiceTrait && voiceTrait !== '—' ? ` (${voiceTrait})` : ''}.`,
  ];
  return lines.join('\n');
}
