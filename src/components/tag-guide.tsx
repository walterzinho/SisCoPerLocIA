'use client';

import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { audioTags, tagCategories, usageExamples } from '@/lib/tags';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const categoryOrder = ['emotion', 'rhythm', 'vocalEffect', 'creative', 'nonVerbal'] as const;

const categoryConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  emotion:      { color: 'text-rose-300',     bg: 'bg-rose-500/10',     border: 'border-rose-500/25',     dot: 'bg-rose-400' },
  rhythm:       { color: 'text-amber-300',    bg: 'bg-amber-500/10',    border: 'border-amber-500/25',    dot: 'bg-amber-400' },
  vocalEffect:  { color: 'text-purple-300',   bg: 'bg-purple-500/10',   border: 'border-purple-500/25',   dot: 'bg-purple-400' },
  creative:     { color: 'text-emerald-300',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/25',  dot: 'bg-emerald-400' },
  nonVerbal:    { color: 'text-sky-300',      bg: 'bg-sky-500/10',      border: 'border-sky-500/25',      dot: 'bg-sky-400' },
};

export function TagGuide() {
  const { locale } = useAppStore();
  const tr = getT(locale);
  const examples = usageExamples[locale];
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const copyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">{tr.tagGuide.title}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">{tr.tagGuide.description}</p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-400 shrink-0" />
        <AlertDescription className="text-amber-200 text-sm">
          {tr.tagGuide.recommendation}
        </AlertDescription>
      </Alert>

      <ScrollArea className="max-h-[calc(100vh-320px)]">
        <div className="space-y-6 pr-4">
          {categoryOrder.map((cat) => {
            const tags = audioTags.filter(t => t.category === cat);
            const catName = tagCategories[cat][locale];
            const cfg = categoryConfig[cat];
            return (
              <div key={cat}>
                {/* Category header with count */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <h3 className="text-xs font-bold ${cfg.color} uppercase tracking-widest">{catName}</h3>
                  <span className="text-xs text-zinc-600 tabular-nums">{tags.length}</span>
                </div>

                {/* Tags grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tags.map((audioTag) => {
                    const isCopied = copiedTag === audioTag.tag;
                    return (
                      <button
                        key={audioTag.tag}
                        onClick={() => copyTag(audioTag.tag)}
                        className={`group relative text-left rounded-lg border p-3 transition-all duration-150 ${cfg.bg} ${cfg.border} hover:brightness-125 cursor-pointer`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className={`text-sm font-mono font-semibold ${cfg.color} group-hover:brightness-125`}>
                            {audioTag.tag}
                          </code>
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          {locale === 'es' ? audioTag.descriptionEs : audioTag.descriptionEn}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1 italic truncate">
                          &quot;{locale === 'es' ? audioTag.exampleEs : audioTag.exampleEn}&quot;
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Usage Examples */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">
              {tr.tagGuide.examples}
            </h3>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-amber-400 mb-2 font-medium">{ex.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ex.tags.map((tag, j) => (
                      <code key={j} className="text-xs font-mono bg-red-500/15 text-red-300 px-2 py-0.5 rounded">
                        {tag}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 italic leading-relaxed">&quot;{ex.text}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
