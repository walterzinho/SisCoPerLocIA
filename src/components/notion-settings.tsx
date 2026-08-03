'use client';

import { useAppStore } from '@/lib/store';
import { t as getT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Plug, Database, Key, CheckCircle2, XCircle, Loader2, Sparkles, Search } from 'lucide-react';
import { useState } from 'react';

interface FoundDb {
  id: string;
  title: string;
  url: string;
}

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
  const [testingGoogle, setTestingGoogle] = useState(false);
  const [findingDbs, setFindingDbs] = useState(false);
  const [foundDbs, setFoundDbs] = useState<FoundDb[]>([]);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [googleModel, setGoogleModel] = useState('');

  const sanitizeNotionId = (v: string) => v.replace(/[-\s]/g, '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();

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

  const findDatabases = async () => {
    if (!notionToken) return;
    setFindingDbs(true); setFoundDbs([]);
    try {
      const res = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-databases', token: notionToken }),
      });
      const data = await res.json();
      if (data.success && data.databases.length > 0) {
        setFoundDbs(data.databases);
      } else {
        showToast(tr.notion.noDatabases, 'error');
      }
    } catch { showToast(tr.notion.databaseFail, 'error'); }
    setFindingDbs(false);
  };

  const selectDatabase = (db: FoundDb) => {
    const cleanId = db.id.replace(/[-\s]/g, '').toLowerCase();
    setNotionDatabaseId(cleanId);
    setNotionDbTitle(db.title);
    setDbStatus('success');
    setFoundDbs([]);
    showToast(`${tr.notion.databaseFound} ${db.title}`, 'success');
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
      if (data.success) {
        setDbStatus('success'); setNotionDbTitle(data.title); showToast(`${tr.notion.databaseFound} ${data.title}`, 'success');
      } else if (data.code === 'page_instead_of_database' && data.correctDatabaseId) {
        setNotionDatabaseId(data.correctDatabaseId);
        setDbStatus('idle');
        showToast('ID corregido automáticamente: era un ID de página. Probando con el ID correcto...', 'success');
        setTimeout(async () => {
          try {
            const retry = await fetch('/api/notion', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'test-database', token: notionToken, databaseId: data.correctDatabaseId }),
            });
            const retryData = await retry.json();
            if (retryData.success) {
              setDbStatus('success'); setNotionDbTitle(retryData.title);
              showToast(`${tr.notion.databaseFound} ${retryData.title}`, 'success');
            } else {
              setDbStatus('error'); showToast(`${tr.notion.databaseFail} ${retryData.error}`, 'error');
            }
          } catch { setDbStatus('error'); showToast(tr.notion.databaseFail, 'error'); }
        }, 800);
      } else {
        setDbStatus('error'); showToast(`${tr.notion.databaseFail} ${data.error}`, 'error');
      }
    } catch { setDbStatus('error'); showToast(tr.notion.databaseFail, 'error'); }
    setTestingDb(false);
  };

  const testGoogleKey = async () => {
    if (!googleApiKey) return;
    setTestingGoogle(true); setGoogleStatus('idle'); setGoogleModel('');
    try {
      const res = await fetch('/api/test-google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: googleApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setGoogleStatus('success'); setGoogleModel(data.model);
        showToast(`${tr.notion.googleKeyValid} ${data.model}`, 'success');
      } else {
        setGoogleStatus('error'); showToast(`${tr.notion.googleKeyFail} ${data.error}`, 'error');
      }
    } catch { setGoogleStatus('error'); showToast(tr.notion.googleKeyFail, 'error'); }
    setTestingGoogle(false);
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={findDatabases} disabled={findingDbs || !notionToken}>
              {findingDbs ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
              {tr.notion.findDatabases}
            </Button>
          </div>

          {foundDbs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium">{tr.notion.selectDatabase}</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {foundDbs.map(db => {
                  const cleanId = db.id.replace(/-/g, '').replace(/\s/g, '').toLowerCase();
                  return (
                  <button
                    key={db.id}
                    onClick={() => selectDatabase(db)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      notionDatabaseId === cleanId
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-zinc-800 hover:border-red-500/30 hover:bg-zinc-800/50'
                    }`}
                  >
                    <p className="text-sm text-white font-medium truncate">{db.title}</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{cleanId}</p>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.databaseId}</Label>
            <Input
              value={notionDatabaseId}
              onChange={e => {
                const raw = sanitizeNotionId(e.target.value);
                setNotionDatabaseId(raw);
                setDbStatus('idle'); setNotionDbTitle('');
              }}
              placeholder={tr.notion.databaseIdPlaceholder}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm"
              maxLength={32}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">{tr.notion.databaseIdHelp}</p>
              <span className={`text-xs tabular-nums ${notionDatabaseId.length === 32 ? 'text-emerald-400' : notionDatabaseId.length > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {notionDatabaseId.length}/32
              </span>
            </div>
            {notionDatabaseId.length > 0 && notionDatabaseId.length < 32 && (
              <p className="text-xs text-amber-400/80">Faltan {32 - notionDatabaseId.length} caracteres.</p>
            )}
            {notionDatabaseId.length === 32 && dbStatus !== 'success' && (
              <p className="text-xs text-emerald-400/80">ID con formato correcto. Prueba la conexión.</p>
            )}
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

      <Card className="bg-zinc-900/60 border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />{tr.notion.googleSection}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{tr.notion.googleKey}</Label>
            <Input type="password" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} placeholder={tr.notion.googleKeyPlaceholder} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600" />
            <p className="text-xs text-gray-600">{tr.notion.googleKeyHelp}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={testGoogleKey} disabled={testingGoogle || !googleApiKey}>
              {testingGoogle ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              {tr.notion.testGoogleKey}
            </Button>
            {googleStatus === 'success' && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {googleModel}
              </Badge>
            )}
            {googleStatus === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
