'use client';

import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Plug, Database, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function NotionSettings() {
  const {
    notionApiKey, setNotionApiKey,
    notionParentPageId, setNotionParentPageId,
    notionDatabaseName, setNotionDatabaseName,
    notionDatabaseId, setNotionDatabaseId,
    googleApiKey, setGoogleApiKey,
    locale, showToast,
  } = useAppStore();
  const tr = getT(locale);
  const [testing, setTesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    if (!notionApiKey) return;
    setTesting(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', apiKey: notionApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus('success');
        showToast(tr.notion.connectionSuccess, 'success');
      } else {
        setConnectionStatus('error');
        showToast(tr.notion.connectionFail, 'error');
      }
    } catch {
      setConnectionStatus('error');
      showToast(tr.notion.connectionFail, 'error');
    }
    setTesting(false);
  };

  const createDatabase = async () => {
    if (!notionApiKey) return;
    setCreating(true);
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-database', apiKey: notionApiKey, parentPageId: notionParentPageId, databaseName: notionDatabaseName }),
      });
      const data = await res.json();
      if (data.success) {
        setNotionDatabaseId(data.databaseId);
        showToast(tr.notion.databaseCreated, 'success');
      } else {
        showToast(data.error || 'Error', 'error');
      }
    } catch {
      showToast('Error', 'error');
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-red-400" />
        <h2 className="text-xl font-semibold text-white">{tr.notion.title}</h2>
      </div>

      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Notion API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.apiKey}</Label>
            <Input
              type="password"
              value={notionApiKey}
              onChange={(e) => setNotionApiKey(e.target.value)}
              placeholder={tr.notion.apiKeyPlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
            />\n            <p className="text-xs text-gray-600">{tr.notion.apiKeyHelp}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={testConnection}
              disabled={testing || !notionApiKey}
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plug className="h-3.5 w-3.5 mr-1.5" />}
              {tr.notion.testConnection}
            </Button>
            {connectionStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Database className="h-4 w-4" />
            {locale === 'es' ? 'Base de Datos' : 'Database'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notionDatabaseId && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                DB connected
              </Badge>
              <code className="text-zinc-600 truncate">{notionDatabaseId}</code>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.parentPageId}</Label>
            <Input
              value={notionParentPageId}
              onChange={(e) => setNotionParentPageId(e.target.value)}
              placeholder={tr.notion.parentPageIdPlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm"
            />\n          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.databaseName}</Label>
            <Input
              value={notionDatabaseName}
              onChange={(e) => setNotionDatabaseName(e.target.value)}
              placeholder={tr.notion.databaseNamePlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
            />\n          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={createDatabase}
            disabled={creating || !notionApiKey}
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
            {tr.notion.createDatabase}
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-zinc-800" />

      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Key className="h-4 w-4" />
            {tr.googleAI.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.googleAI.apiKey}</Label>
            <Input
              type="password"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder={tr.googleAI.apiKeyPlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
            />\n            <p className="text-xs text-gray-600">{tr.googleAI.apiKeyHelp}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}