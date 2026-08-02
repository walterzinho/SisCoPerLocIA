'use client';

import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { templates, getTemplateName, getTemplateDescription } from '@/lib/templates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { getVoiceById } from '@/lib/voices';

export function TemplateSelector() {
  const { locale, setFormField, resetForm, showToast, setActiveTab } = useAppStore();
  const tr = getT(locale);

  const applyTemplate = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    const voice = getVoiceById(tmpl.voice);
    resetForm();
    setFormField('audioProfile', tmpl.audioProfile);
    setFormField('style', tmpl.style);
    setFormField('pace', tmpl.pace);
    setFormField('temperature', tmpl.temperature);
    setFormField('scene', tmpl.scene);
    setFormField('sampleContext', tmpl.sampleContext);
    setFormField('tag', tmpl.tag);
    setFormField('voice', tmpl.voice);
    setFormField('profileName', getTemplateName(tmpl, locale));
    setFormField('announcerName', '');
    setActiveTab('create');
    showToast(locale === 'es' ? `Plantilla "${getTemplateName(tmpl, locale)}" aplicada` : `Template "${getTemplateName(tmpl, locale)}" applied`, 'success');
  };

  const templateIcons: Record<string, string> = {
    news: '📡',
    magazine: '🎙️',
    cultural: '🎭',
    sports: '⚽',
    morning: '🌅',
    night: '🌙',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">{tr.templates.title}</h2>
        <p className="text-sm text-gray-400">{tr.templates.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl) => {
          const voice = getVoiceById(tmpl.voice);
          return (
            <Card key={tmpl.id} className="bg-zinc-900/60 border-zinc-800/50 hover:border-red-500/30 transition-all group">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{templateIcons[tmpl.id]}</span>
                  <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {voice?.name || ''}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                    {getTemplateName(tmpl, locale)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTemplateDescription(tmpl, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge className="bg-zinc-800 text-gray-400 border-zinc-700 text-xs">
                    {tmpl.style}
                  </Badge>
                  <Badge className="bg-zinc-800 text-gray-400 border-zinc-700 text-xs">
                    {tmpl.pace}
                  </Badge>
                  <span className="text-gray-600">T:{tmpl.temperature}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => applyTemplate(tmpl.id)}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {tr.templates.apply}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
