'use client';

import { useAppStore, generateProfileText } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { getVoiceById } from '@/lib/voices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Trash2, Upload, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function ProfileHistory() {
  const { savedProfiles, deleteProfile, loadProfileIntoForm, locale, showToast, notionApiKey, notionDatabaseId, setActiveTab } = useAppStore();
  const tr = getT(locale);

  const exportToNotion = async (profile: typeof savedProfiles[0]) => {
    if (!notionApiKey || !notionDatabaseId) {
      setActiveTab('settings');
      showToast(locale === 'es' ? 'Configura Notion primero' : 'Configure Notion first', 'error');
      return;
    }
    const voice = getVoiceById(profile.voice);
    const text = generateProfileText(profile, voice?.name || '', locale === 'es' ? voice?.trait : voice?.traitEn);
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export-profile', apiKey: notionApiKey, databaseId: notionDatabaseId, profile: { ...profile, generatedText: text } }),
      });
      const data = await res.json();
      if (data.success) showToast(tr.notion.exportSuccess, 'success');
      else showToast(data.error || tr.notion.exportFail, 'error');
    } catch { showToast(tr.notion.exportFail, 'error'); }
  };

  const exportAllToNotion = async () => {
    if (!notionApiKey || !notionDatabaseId) {
      setActiveTab('settings');
      showToast(locale === 'es' ? 'Configura Notion primero' : 'Configure Notion first', 'error');
      return;
    }
    let errors = 0;
    for (const profile of savedProfiles) {
      const voice = getVoiceById(profile.voice);
      const text = generateProfileText(profile, voice?.name || '', locale === 'es' ? voice?.trait : voice?.traitEn);
      try {
        const res = await fetch('/api/notion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'export-profile', apiKey: notionApiKey, databaseId: notionDatabaseId, profile: { ...profile, generatedText: text } }),
        });
        const data = await res.json();
        if (!data.success) errors++;
      } catch { errors++; }
    }
    if (errors === 0) showToast(tr.notion.allExported, 'success');
    else showToast(`${errors}/${savedProfiles.length} ${locale === 'es' ? 'errores' : 'errors'}`, 'error');
  };

  if (savedProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Clock className="h-12 w-12 mb-4 text-gray-700" />
        <p>{tr.history.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{tr.history.title}</h2>
        {notionApiKey && notionDatabaseId && (
          <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={exportAllToNotion}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {tr.history.exportAll}
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[600px]">
        <div className="space-y-3 pr-4">
          {savedProfiles.map((profile) => {
            const voice = getVoiceById(profile.voice);
            return (
              <Card key={profile.id} className="bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{profile.profileName}</h3>
                        {voice && (
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 shrink-0">
                            {voice.name}
                          </Badge>
                        )}
                      </div>
                      {profile.announcerName && (
                        <p className="text-xs text-gray-500 mb-1">{profile.announcerName}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="bg-zinc-800 text-gray-400 text-xs">{profile.style}</Badge>
                        <Badge className="bg-zinc-800 text-gray-400 text-xs">{profile.pace}</Badge>
                        <Badge className="bg-zinc-800 text-gray-400 text-xs">T:{profile.temperature}</Badge>
                        {profile.tag && (
                          <code className="text-xs text-red-400/70">{profile.tag}</code>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{new Date(profile.createdAt).toLocaleString(locale === 'es' ? 'es-CO' : 'en-US')}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" title={tr.history.load} onClick={() => loadProfileIntoForm(profile)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400" title={tr.form.exportNotion} onClick={() => exportToNotion(profile)}>
                        <Upload className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">{tr.history.confirmDelete}</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">{profile.profileName}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-gray-300">{tr.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteProfile(profile.id)}>{tr.common.confirm}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
