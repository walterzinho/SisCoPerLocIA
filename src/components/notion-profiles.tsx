'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { voices, getVoiceById } from '@/lib/voices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, RefreshCw, Upload, Pencil, ExternalLink, AlertCircle, Loader2, LayoutTemplate } from 'lucide-react';

export function NotionProfiles() {
  const {
    notionToken, notionDatabaseId, notionDbTitle, setNotionDbTitle,
    notionProfiles, setNotionProfiles,
    loadingProfiles, setLoadingProfiles,
    locale, showToast, activeTab, setActiveTab,
    setAiInput, setAiGenerated, setProfileName, setGeneratedText, setEditingPageId, setShowEditor,
    aiInput,
  } = useAppStore();
  const tr = getT(locale);

  const loadProfiles = useCallback(async () => {
    if (!notionToken || !notionDatabaseId) return;
    setLoadingProfiles(true);
    try {
      const res = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query-profiles', token: notionToken, databaseId: notionDatabaseId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotionProfiles(data.profiles);
        showToast(`${data.profiles.length} ${tr.profiles.profileCount}`, 'success');
      } else {
        showToast(data.error || tr.notion.queryFail, 'error');
      }
    } catch {
      showToast(tr.notion.queryFail, 'error');
    }
    setLoadingProfiles(false);
  }, [notionToken, notionDatabaseId]);

  useEffect(() => {
    if (activeTab === 'profiles' && notionToken && notionDatabaseId) {
      loadProfiles();
    }
  }, [activeTab, notionToken, notionDatabaseId]);

  const loadAsTemplate = (profile: typeof notionProfiles[0]) => {
    setAiInput('name', profile.announcerName || '');
    setAiGenerated({
      voice: profile.voice?.toLowerCase() || '',
      audioProfile: profile.audioProfile || '',
      style: profile.style || '',
      pace: profile.pace || 'moderate',
      temperature: parseFloat(profile.temperature) || 0.5,
      scene: profile.scene || '',
      sampleContext: profile.sampleContext || '',
      tag: profile.tag || '',
      suggestedTags: [],
      voiceRationale: '',
    });
    setProfileName(profile.profileName || '');
    const voice = getVoiceById(profile.voice?.toLowerCase() || '');
    const trait = voice ? (locale === 'es' ? voice.trait : voice.traitEn) : '';
    if (profile.fullConfig) setGeneratedText(profile.fullConfig);
    else {
      import('@/lib/store').then(({ buildProfileText }) => {
        setGeneratedText(buildProfileText(
          profile.profileName, profile.announcerName,
          { voice: profile.voice, audioProfile: profile.audioProfile, style: profile.style, pace: profile.pace, temperature: parseFloat(profile.temperature) || 0.5, scene: profile.scene, sampleContext: profile.sampleContext, tag: profile.tag },
          voice?.name || '', trait,
        ));
      });
    }
    setEditingPageId(profile.pageId);
    setShowEditor(true);
    setActiveTab('create');
  };

  if (!notionToken || !notionDatabaseId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4 text-gray-700" />
        <p className="text-center mb-1">{tr.profiles.notConnected}</p>
        <Button variant="outline" size="sm" className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setActiveTab('settings')}>
          {tr.nav.settings}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{tr.profiles.title}</h2>
          {notionDbTitle && (
            <p className="text-xs text-gray-500 mt-1">{tr.profiles.dbName} <span className="text-gray-300">{notionDbTitle}</span></p>
          )}
        </div>
        <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={loadProfiles} disabled={loadingProfiles}>
          {loadingProfiles ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
          {tr.profiles.refresh}
        </Button>
      </div>

      {loadingProfiles ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-8 w-8 mb-3 animate-spin text-red-400" />
          <p>{tr.profiles.loading}</p>
        </div>
      ) : notionProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Database className="h-12 w-12 mb-4 text-gray-700" />
          <p>{tr.profiles.empty}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3 pr-4">
            {notionProfiles.map((profile) => {
              const voice = getVoiceById(profile.voice?.toLowerCase() || '');
              return (
                <Card key={profile.pageId} className="bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate">{profile.profileName || 'Sin nombre'}</h3>
                          {voice && <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 shrink-0">{voice.name}</Badge>}
                        </div>
                        {profile.announcerName && <p className="text-xs text-gray-500 mb-1">{profile.announcerName}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {profile.style && <Badge className="bg-zinc-800 text-gray-400 text-xs">{profile.style}</Badge>}
                          {profile.pace && <Badge className="bg-zinc-800 text-gray-400 text-xs">{profile.pace}</Badge>}
                          {profile.language && <Badge className="bg-sky-500/15 text-sky-400 text-xs border border-sky-500/20">{profile.language}</Badge>}
                          {profile.tag && <code className="text-xs text-red-400/70">{profile.tag}</code>}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{new Date(profile.createdAt).toLocaleString(locale === 'es' ? 'es-CO' : 'en-US')}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" title={tr.profiles.loadAsTemplate} onClick={() => loadAsTemplate(profile)}>
                          <LayoutTemplate className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" title={tr.profiles.edit} onClick={() => loadAsTemplate(profile)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <a href={profile.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
