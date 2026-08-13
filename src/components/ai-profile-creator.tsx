'use client';

import { useState } from 'react';
import { useAppStore, buildProfileText } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { voices, getVoiceById } from '@/lib/voices';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Calendar, AudioLines, Palette, Gauge, Thermometer, Theater,
  FileText, Tag, Sparkles, Loader2, Copy, Upload, ArrowLeft, Lightbulb,
  MapPin, Radio, MessageSquare, Pencil,
} from 'lucide-react';

export function AiProfileCreator() {
  const {
    aiInput, setAiInput, resetAiInput,
    isGenerating, setIsGenerating, aiGenerated, setAiGenerated,
    profileName, setProfileName, editField,
    generatedText, setGeneratedText,
    locale, showToast, showEditor, setShowEditor,
    googleApiKey, notionToken, notionDatabaseId, editingPageId, setEditingPageId,
  } = useAppStore();
  const tr = getT(locale);

  const selectedVoice = aiGenerated ? getVoiceById(aiGenerated.voice) : null;
  const voiceTrait = selectedVoice ? (locale === 'es' ? selectedVoice.trait : selectedVoice.traitEn) : '';

  const handleGenerate = async () => {
    if (!aiInput.name && !aiInput.profileType && !aiInput.scenario) {
      showToast(locale === 'es' ? 'Ingresa al menos el nombre, tipo o escenario' : 'Enter at least name, type or scenario', 'error');
      return;
    }
    if (!googleApiKey) {
      showToast(locale === 'es' ? 'Configura tu API key de Google AI en Configuración' : 'Set your Google AI API key in Settings', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: googleApiKey, ...aiInput }),
      });
      const data = await res.json();
      if (data.success) {
        setAiGenerated(data.profile);
        setProfileName(aiInput.profileType ? `${locale === 'es' ? 'Voz' : 'Voice'} ${aiInput.profileType} - ${aiInput.name}` : aiInput.name);
        const voice = getVoiceById(data.profile.voice);
        const trait = voice ? (locale === 'es' ? voice.trait : voice.traitEn) : '';
        const text = buildProfileText(
          aiInput.profileType ? `${locale === 'es' ? 'Voz' : 'Voice'} ${aiInput.profileType} - ${aiInput.name}` : aiInput.name,
          aiInput.name, data.profile, voice?.name || '', trait,
        );
        setGeneratedText(text);
      } else {
        showToast(data.error || 'Error', 'error');
      }
    } catch {
      showToast(locale === 'es' ? 'Error de conexión con la IA' : 'AI connection error', 'error');
    }
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    try { await navigator.clipboard.writeText(generatedText); showToast(tr.preview.copied, 'success'); }
    catch { showToast(tr.preview.copyFail, 'error'); }
  };

  const [isTranslating, setIsTranslating] = useState(false);

  const handleSaveNotion = async () => {
    if (!aiGenerated || !generatedText) {
      showToast(locale === 'es' ? 'Genera un perfil primero' : 'Generate a profile first', 'error');
      return;
    }
    if (!notionToken || !notionDatabaseId) {
      showToast(locale === 'es' ? 'Configura Notion en Configuración' : 'Configure Notion in Settings', 'error');
      return;
    }

    const action = editingPageId ? 'update-profile' : 'export-profile';
    const body: Record<string, unknown> = {
      action, token: notionToken, databaseId: notionDatabaseId, profileName,
      profile: {
        announcerName: aiInput.name,
        voice: selectedVoice?.name || aiGenerated.voice,
        audioProfile: aiGenerated.audioProfile,
        style: aiGenerated.style,
        pace: aiGenerated.pace,
        temperature: aiGenerated.temperature,
        scene: aiGenerated.scene,
        sampleContext: aiGenerated.sampleContext,
        tag: aiGenerated.tag,
        generatedText,
      },
    };
    if (editingPageId) body.pageId = editingPageId;

    try {
      const res = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || tr.notion.exportFail, 'error');
        return;
      }

      const savedPageId = editingPageId || data.pageId;
      showToast(editingPageId ? tr.notion.updateSuccess : tr.notion.exportSuccess, 'success');
      setEditingPageId(null);

      // After saving, generate English instructions and update the same page
      if (googleApiKey) {
        setIsTranslating(true);
        showToast(tr.form.translating, 'success');
        try {
          const enRes = await fetch('/api/generate-en', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: googleApiKey, profile: aiGenerated, announcerName: aiInput.name }),
          });
          const enData = await enRes.json();
          if (enData.success && enData.text) {
            // Update the Notion page with English instructions
            await fetch('/api/notion', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update-profile',
                token: notionToken,
                databaseId: notionDatabaseId,
                pageId: savedPageId,
                profile: {
                  language: 'Español / English',
                  englishInstructions: enData.text,
                },
              }),
            });
            showToast(tr.form.translateDone, 'success');
          } else {
            showToast(tr.form.translateFail, 'error');
          }
        } catch {
          showToast(tr.form.translateFail, 'error');
        }
        setIsTranslating(false);
      }
    } catch {
      showToast(tr.notion.exportFail, 'error');
    }
  };

  const handleRegenerateText = () => {
    if (!aiGenerated) return;
    const voice = getVoiceById(aiGenerated.voice);
    const trait = voice ? (locale === 'es' ? voice.trait : voice.traitEn) : '';
    const text = buildProfileText(profileName, aiInput.name, aiGenerated, voice?.name || '', trait);
    setGeneratedText(text);
  };

  const paces = ['natural', 'rapid-fire', 'the-drift', 'staccato'] as const;
  const styles = ['vocal-smile', 'newscaster', 'whisper', 'empathetic', 'promo-hype', 'deadpan'] as const;

  // AI Input Form
  if (!showEditor) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Card className="bg-zinc-900/60 border-zinc-800/50">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-red-400" />{tr.form.name} *
                </Label>
                <Input value={aiInput.name} onChange={e => setAiInput('name', e.target.value)} placeholder={tr.form.namePlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-red-400" />{tr.form.age}
                </Label>
                <Input value={aiInput.age} onChange={e => setAiInput('age', e.target.value)} placeholder={tr.form.agePlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-red-400" />{tr.form.gender}
                </Label>
                <Select value={aiInput.gender} onValueChange={v => setAiInput('gender', v)}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                    <SelectValue placeholder={locale === 'es' ? 'Seleccionar...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="male" className="text-gray-200">{tr.form.genderMale}</SelectItem>
                    <SelectItem value="female" className="text-gray-200">{tr.form.genderFemale}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-red-400" />{tr.form.profileType} *
                </Label>
                <Input value={aiInput.profileType} onChange={e => setAiInput('profileType', e.target.value)} placeholder={tr.form.profileTypePlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-red-400" />{tr.form.region}
              </Label>
              <Input value={aiInput.region} onChange={e => setAiInput('region', e.target.value)} placeholder={tr.form.regionPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Theater className="h-3.5 w-3.5 text-red-400" />{tr.form.scenario} *
              </Label>
              <Textarea value={aiInput.scenario} onChange={e => setAiInput('scenario', e.target.value)} placeholder={tr.form.scenarioPlaceholder} rows={3} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-red-400/70" />{tr.form.additional}
              </Label>
              <Textarea value={aiInput.additional} onChange={e => setAiInput('additional', e.target.value)} placeholder={tr.form.additionalPlaceholder} rows={2} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none" />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-6 text-base">
              {isGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
              {isGenerating ? tr.form.generating : tr.form.generate}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Editor (after AI generation)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => { setShowEditor(false); setEditingPageId(null); }} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-1" />{tr.form.backToInput}
        </Button>
        <p className="text-xs text-amber-400/70">{tr.form.editNote}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Editor - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Name */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-red-400" />{tr.form.profileName}
              </Label>
              <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder={tr.form.profileNamePlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
            </CardContent>
          </Card>

          {/* Voice + Voice Rationale */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <AudioLines className="h-3.5 w-3.5 text-red-400" />{tr.form.voice}
                </Label>
                {selectedVoice && (
                  <Badge variant="outline" className="border-red-500/30 text-red-400">{selectedVoice.name} ({voiceTrait})</Badge>
                )}
              </div>
              <Select value={aiGenerated?.voice || ''} onValueChange={v => { editField('voice', v); handleRegenerateText(); }}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                  <SelectValue placeholder={tr.form.voicePlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-80">
                  {voices.map(v => (
                    <SelectItem key={v.id} value={v.id} className="text-gray-200 focus:bg-red-500/10 focus:text-red-300">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-xs text-gray-500">({locale === 'es' ? v.trait : v.traitEn})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiGenerated?.voiceRationale && (
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300/80"><span className="font-medium">{tr.form.voiceRationale}</span> {aiGenerated.voiceRationale}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Profile */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <AudioLines className="h-3.5 w-3.5 text-red-400" />{tr.form.audioProfile}
              </Label>
              <Textarea value={aiGenerated?.audioProfile || ''} onChange={e => { editField('audioProfile', e.target.value); handleRegenerateText(); }} rows={4} className="bg-zinc-800/50 border-zinc-700 text-white resize-none" />
            </CardContent>
          </Card>

          {/* Style + Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-zinc-900/60 border-zinc-800/50">
              <CardContent className="p-4 space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-red-400" />{tr.form.style}
                </Label>
                <Select value={aiGenerated?.style || ''} onValueChange={v => { editField('style', v); handleRegenerateText(); }}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                    <SelectValue placeholder={tr.form.stylePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {styles.map(s => (
                      <SelectItem key={s} value={s} className="text-gray-200 focus:bg-red-500/10 focus:text-red-300">
                        <div className="flex flex-col">
                          <span>{tr.form.styles[s]} ({s})</span>
                          <span className="text-xs text-gray-500">{tr.form.styleDescriptions[s]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800/50">
              <CardContent className="p-4 space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-red-400" />{tr.form.pace}
                </Label>
                <Select value={aiGenerated?.pace || ''} onValueChange={v => { editField('pace', v); handleRegenerateText(); }}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                    <SelectValue placeholder={tr.form.pacePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {paces.map(p => (
                      <SelectItem key={p} value={p} className="text-gray-200 focus:bg-red-500/10 focus:text-red-300">
                        <div className="flex flex-col">
                          <span>{tr.form.paces[p]} ({p})</span>
                          <span className="text-xs text-gray-500">{tr.form.paceDescriptions[p]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Temperature */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Thermometer className="h-3.5 w-3.5 text-red-400" />{tr.form.temperature}
                </Label>
                <span className="text-lg font-mono text-red-400 font-bold">{aiGenerated?.temperature?.toFixed(2) ?? '0.50'}</span>
              </div>
              <Slider value={[aiGenerated?.temperature ?? 0.5]} onValueChange={([v]) => { editField('temperature', v); handleRegenerateText(); }} min={0} max={1} step={0.01} />
              <div className="flex justify-between text-xs text-gray-600">
                <span>0.0 ({locale === 'es' ? 'Preciso' : 'Precise'})</span>
                <span>1.0 ({locale === 'es' ? 'Creativo' : 'Creative'})</span>
              </div>
              <p className="text-xs text-gray-600">{tr.form.temperatureHelp}</p>
            </CardContent>
          </Card>

          {/* Scene */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Theater className="h-3.5 w-3.5 text-red-400" />{tr.form.scene}
              </Label>
              <Textarea value={aiGenerated?.scene || ''} onChange={e => { editField('scene', e.target.value); handleRegenerateText(); }} rows={3} className="bg-zinc-800/50 border-zinc-700 text-white resize-none" />
            </CardContent>
          </Card>

          {/* Sample Context */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-2">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-red-400" />{tr.form.sampleContext}
              </Label>
              <Textarea value={aiGenerated?.sampleContext || ''} onChange={e => { editField('sampleContext', e.target.value); handleRegenerateText(); }} rows={4} className="bg-zinc-800/50 border-zinc-700 text-white resize-none" />
            </CardContent>
          </Card>

          {/* Tag + Suggested */}
          <Card className="bg-zinc-900/60 border-zinc-800/50">
            <CardContent className="p-4 space-y-3">
              <Label className="text-gray-300 text-sm flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-red-400" />{tr.form.tag}
              </Label>
              <Input value={aiGenerated?.tag || ''} onChange={e => { editField('tag', e.target.value); handleRegenerateText(); }} placeholder={tr.form.tagPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono" />
              <p className="text-xs text-gray-600">{tr.form.tagHelp}</p>
              {aiGenerated?.suggestedTags && aiGenerated.suggestedTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">{tr.form.suggestedTags}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiGenerated.suggestedTags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-300 text-xs cursor-pointer hover:bg-amber-500/10" onClick={() => { editField('tag', tag); handleRegenerateText(); }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveNotion} disabled={isTranslating} className="bg-red-600 hover:bg-red-700 text-white font-medium">
              {isTranslating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {isTranslating ? tr.form.translating : (editingPageId ? tr.form.updateNotion : tr.form.saveNotion)}
            </Button>
            <Button variant="outline" onClick={handleCopy} className="border-zinc-700 text-gray-400 hover:text-white hover:bg-zinc-800">
              <Copy className="h-4 w-4 mr-2" />{tr.form.copy}
            </Button>
            <Button variant="outline" onClick={resetAiInput} className="border-zinc-700 text-gray-400 hover:text-white hover:bg-zinc-800" disabled={isTranslating}>
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
                <pre className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">{generatedText}</pre>
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
    </div>
  );
}
