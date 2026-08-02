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
    notionToken, setNotionToken,
    notionDatabaseId, setNotionDatabaseId,
    notionDbTitle, setNotionDbTitle,
    googleApiKey, setGoogleApiKey,
    locale, showToast,
  } = useAppStore();
  const tr = getT(locale);
  const [testingToken, setTestingToken] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testToken = async () => {
    if (!notionToken) return;
    setTestingToken(true); setTokenStatus('idle');
    try {
      const res = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', token: notionToken }),
      });
      const data = await res.json();
      if (data.success) { setTokenStatus('success'); showToast(tr.notion.connectionSuccess, 'success'); }
      else { setTokenStatus('error'); showToast(`${tr.notion.connectionFail} ${data.error}`, 'error'); }
    } catch { setTokenStatus('error'); showToast(tr.notion.connectionFail, 'error'); }
    setTestingToken(false);
  };

  const testDatabase = async () => {
    if (!notionToken || !notionDatabaseId) return;
    setTestingDb(true); setDbStatus('idle');
    try {
      const res = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-database', token: notionToken, databaseId: notionDatabaseId }),
      });
      const data = await res.json();
      if (data.success) { setDbStatus('success'); setNotionDbTitle(data.title); showToast(`${tr.notion.databaseFound} ${data.title}`, 'success'); }
      else { setDbStatus('error'); showToast(`${tr.notion.databaseFail} ${data.error}`, 'error'); }
    } catch { setDbStatus('error'); showToast(tr.notion.databaseFail, 'error'); }
    setTestingDb(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-red-400" />
        <h2 className="text-xl font-semibold text-white">{tr.notion.title}</h2>
      </div>

      {/* Notion Token */}
      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Plug className="h-4 w-4" />{tr.notion.notionSection}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.token}</Label>
            <Input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} placeholder={tr.notion.tokenPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
            <p className="text-xs text-gray-600">{tr.notion.tokenHelp}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={testToken} disabled={testingToken || !notionToken}>
              {testingToken ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plug className="h-3.5 w-3.5 mr-1.5" />}
              {tr.notion.testToken}
            </Button>
            {tokenStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {tokenStatus === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
        </CardContent>
      </Card>

      {/* Database ID */}
      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Database className="h-4 w-4" />{tr.notion.databaseId}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notionDbTitle && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400"><CheckCircle2 className="h-3 w-3 mr-1" />{notionDbTitle}</Badge>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.databaseId}</Label>
            <Input value={notionDatabaseId} onChange={e => setNotionDatabaseId(e.target.value)} placeholder={tr.notion.databaseIdPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm" />
            <p className="text-xs text-gray-600">{tr.notion.databaseIdHelp}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={testDatabase} disabled={testingDb || !notionToken || !notionDatabaseId}>
              {testingDb ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
              {tr.notion.testDatabase}
            </Button>
            {dbStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {dbStatus === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Google AI */}
      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Key className="h-4 w-4" />{tr.notion.googleSection}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.googleKey}</Label>
            <Input type="password" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} placeholder={tr.notion.googleKeyPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
            <p className="text-xs text-gray-600">{tr.notion.googleKeyHelp}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}