'use client';

import { useAppStore, generateProfileText } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { voices, getVoiceById } from '@/lib/voices';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  User,
  AudioLines,
  Palette,
  Gauge,
  Thermometer,
  Theater,
  FileText,
  Tag,
  Save,
  Copy,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function VoiceProfileForm() {
  const {
    formData, setFormField, resetForm,
    generatedText, setGeneratedText,
    locale, showToast,
    saveProfile, notionApiKey, notionDatabaseId,
  } = useAppStore();
  const tr = getT(locale);

  const selectedVoice = getVoiceById(formData.voice);
  const voiceTrait = selectedVoice ? (locale === 'es' ? selectedVoice.trait : selectedVoice.traitEn) : '';

  const handleGenerate = () => {
    if (!formData.profileName) {
      showToast(locale === 'es' ? 'Ingresa el nombre del perfil' : 'Enter profile name', 'error');
      return;
    }
    const voiceName = selectedVoice?.name || '';
    const text = generateProfileText(formData, voiceName, voiceTrait);
    setGeneratedText(text);
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      showToast(tr.preview.copied, 'success');
    } catch {
      showToast(tr.preview.copyFail, 'error');
    }
  };

  const handleSaveLocal = () => {
    if (!generatedText) {
      showToast(locale === 'es' ? 'Genera el perfil primero' : 'Generate profile first', 'error');
      return;
    }
    const profile = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    showToast(locale === 'es' ? 'Perfil guardado' : 'Profile saved', 'success');
  };

  const handleExportNotion = async () => {
    if (!generatedText) {
      showToast(locale === 'es' ? 'Genera el perfil primero' : 'Generate profile first', 'error');
      return;
    }
    if (!notionApiKey || !notionDatabaseId) {
      showToast(locale === 'es' ? 'Configura Notion en Configuración' : 'Configure Notion in Settings', 'error');
      return;
    }
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-profile',
          apiKey: notionApiKey,
          databaseId: notionDatabaseId,
          profile: { ...formData, generatedText },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(tr.notion.exportSuccess, 'success');
        // Also save locally
        const profile = { id: crypto.randomUUID(), ...formData, createdAt: new Date().toISOString() };
        saveProfile(profile);
      } else {
        showToast(data.error || tr.notion.exportFail, 'error');
      }
    } catch {
      showToast(tr.notion.exportFail, 'error');
    }
  };

  const paces = ['very-slow', 'slow', 'moderate', 'fast', 'very-fast', 'rapid-fire'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form - 3 columns */}
      <div className="lg:col-span-3 space-y-5">
        {/* Profile Name + Announcer Name */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-red-400" />
                {tr.form.profileName} *
              </Label>
              <Input
                value={formData.profileName}
                onChange={(e) => setFormField('profileName', e.target.value)}
                placeholder={tr.form.profileNamePlaceholder}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-red-400/70" />
                {tr.form.announcerName}
              </Label>
              <Input
                value={formData.announcerName}
                onChange={(e) => setFormField('announcerName', e.target.value)}
                placeholder={tr.form.announcerNamePlaceholder}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Selection */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <Label className="text-gray-300 text-sm flex items-center gap-2">
              <Mic className="h-3.5 w-3.5 text-red-400" />
              {tr.form.voice}
            </Label>
            <Select value={formData.voice} onValueChange={(v) => setFormField('voice', v)}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue placeholder={tr.form.voicePlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 max-h-80">
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id} className="text-gray-200 focus:bg-red-500/10 focus:text-red-300">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-gray-500">
                        ({locale === 'es' ? voice.trait : voice.traitEn})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-500/30 text-red-400">
                  {selectedVoice.name}
                </Badge>
                <span className="text-xs text-gray-500">{voiceTrait}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Profile */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <Label className="text-gray-300 text-sm flex items-center gap-2">
              <AudioLines className="h-3.5 w-3.5 text-red-400" />
              {tr.form.audioProfile}
            </Label>
            <Textarea
              value={formData.audioProfile}
              onChange={(e) => setFormField('audioProfile', e.target.value)}
              placeholder={tr.form.audioProfilePlaceholder}
              rows={4}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none"
            />
          </CardContent>
        </Card>

        {/* Style + Pace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-5 space-y-3">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-red-400" />
                {tr.form.style}
              </Label>
              <Input
                value={formData.style}
                onChange={(e) => setFormField('style', e.target.value)}
                placeholder={tr.form.stylePlaceholder}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
              />
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-5 space-y-3">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-red-400" />
                {tr.form.pace}
              </Label>
              <Select value={formData.pace} onValueChange={(v) => setFormField('pace', v)}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue placeholder={tr.form.pacePlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {paces.map((pace) => (
                    <SelectItem key={pace} value={pace} className="text-gray-200 focus:bg-red-500/10 focus:text-red-300">
                      {tr.form.paces[pace]} ({pace})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Temperature */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Thermometer className="h-3.5 w-3.5 text-red-400" />
                {tr.form.temperature}
              </Label>
              <span className="text-lg font-mono text-red-400 font-bold">{formData.temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[formData.temperature]}
              onValueChange={([v]) => setFormField('temperature', v)}
              min={0}
              max={1}
              step={0.01}
              className="[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-400"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>0.0 {locale === 'es' ? '(Preciso)' : '(Precise)'}</span>
              <span>1.0 {locale === 'es' ? '(Creativo)' : '(Creative)'}</span>
            </div>
            <p className="text-xs text-gray-600">{tr.form.temperatureHelp}</p>
          </CardContent>
        </Card>

        {/* Scene */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <Label className="text-gray-300 text-sm flex items-center gap-2">
              <Theater className="h-3.5 w-3.5 text-red-400" />
              {tr.form.scene}
            </Label>
            <Textarea
              value={formData.scene}
              onChange={(e) => setFormField('scene', e.target.value)}
              placeholder={tr.form.scenePlaceholder}
              rows={3}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none"
            />
          </CardContent>
        </Card>

        {/* Sample Context */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <Label className="text-gray-300 text-sm flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-red-400" />
              {tr.form.sampleContext}
            </Label>
            <Textarea
              value={formData.sampleContext}
              onChange={(e) => setFormField('sampleContext', e.target.value)}
              placeholder={tr.form.sampleContextPlaceholder}
              rows={4}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none"
            />
          </CardContent>
        </Card>

        {/* Tag */}
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-5 space-y-3">
            <Label className="text-gray-300 text-sm flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-red-400" />
              {tr.form.tag}
            </Label>
            <Input
              value={formData.tag}
              onChange={(e) => setFormField('tag', e.target.value)}
              placeholder={tr.form.tagPlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono"
            />
            <p className="text-xs text-gray-600">{tr.form.tagHelp}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGenerate}
            className="bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {tr.form.generate}
          </Button>
          <Button variant="outline" onClick={resetForm} className="border-zinc-700 text-gray-400 hover:text-white hover:bg-zinc-800">
            <RotateCcw className="h-4 w-4 mr-2" />
            {tr.form.clear}
          </Button>
        </div>
      </div>

      {/* Preview - 2 columns */}
      <div className="lg:col-span-2">
        <Card className="bg-zinc-900/60 border-zinc-800/50 lg:sticky lg:top-20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{tr.preview.title}</h2>
            </div>

            {generatedText ? (
              <>
                <pre className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                  {generatedText}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {tr.form.copy}
                  </Button>
                  <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={handleSaveLocal}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {tr.form.saveLocal}
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10" onClick={handleExportNotion}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {tr.form.exportNotion}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <AudioLines className="h-10 w-10 mb-3 text-zinc-700" />
                <p className="text-sm text-center">{tr.preview.noProfile}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
