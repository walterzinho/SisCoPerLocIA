'use client';

import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { audioTags, tagCategories, usageExamples } from '@/lib/tags';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const categoryOrder = ['emotion', 'rhythm', 'vocalEffect', 'creative', 'nonVerbal'] as const;
const categoryColors: Record<string, string> = {
  emotion: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  rhythm: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  vocalEffect: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  creative: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  nonVerbal: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

export function TagGuide() {
  const { locale, setFormField, formData } = useAppStore();
  const tr = getT(locale);

  const examples = usageExamples[locale];

  const insertTag = (tag: string) => {
    const current = formData.tag;
    const newTag = current ? `${current} ${tag}` : tag;
    setFormField('tag', newTag);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">{tr.tagGuide.title}</h2>
        <p className="text-sm text-gray-400">{tr.tagGuide.description}</p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-200 text-sm">
          {tr.tagGuide.recommendation}
        </AlertDescription>
      </Alert>

      <ScrollArea className="max-h-[500px]">
        <div className="space-y-8 pr-4">
          {categoryOrder.map((cat) => {
            const tags = audioTags.filter(t => t.category === cat);
            const catName = tagCategories[cat][locale];
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  {catName}
                </h3>
                <div className="space-y-2">
                  {tags.map((audioTag) => (
                    <div
                      key={audioTag.tag}
                      className="group bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-3 hover:border-red-500/30 transition-colors cursor-pointer"
                      onClick={() => insertTag(audioTag.tag)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono text-red-400 group-hover:text-red-300">
                          {audioTag.tag}
                        </code>
                        <Badge variant="outline" className={`text-xs ${categoryColors[cat]}`}>
                          {catName}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {locale === 'es' ? audioTag.descriptionEs : audioTag.descriptionEn}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 italic">
                        &quot;{locale === 'es' ? audioTag.exampleEs : audioTag.exampleEn}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          {tr.tagGuide.examples}
        </h3>
        <div className="space-y-4">
          {examples.map((ex, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-amber-400 mb-2 font-medium">{ex.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ex.tags.map((tag, j) => (
                  <code key={j} className="text-xs font-mono bg-red-500/15 text-red-300 px-2 py-0.5 rounded">
                    {tag}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">&quot;{ex.text}&quot;</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
