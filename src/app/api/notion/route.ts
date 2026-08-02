import { NextRequest, NextResponse } from 'next/server';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

// Test connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, apiKey, parentPageId, databaseName, databaseId, profile } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    switch (action) {
      case 'test': {
        const res = await fetch(`${NOTION_API}/users/me`, { headers: headers(apiKey) });
        if (!res.ok) {
          return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }
        const user = await res.json();
        return NextResponse.json({ success: true, user: user.name || user.bot?.owner?.type });
      }

      case 'create-database': {
        const parent: Record<string, unknown> = parentPageId
          ? { type: 'page_id', page_id: parentPageId }
          : { type: 'workspace', workspace: true };

        const dbBody = {
          parent,
          is_inline: false,
          title: [{ type: 'text', text: { content: databaseName || 'Perfiles de Locutores' } }],
          properties: {
            'Nombre del Perfil': { title: {} },
            'Locutor/a': { rich_text: {} },
            'Voz': { select: {} },
            'Audio Profile': { rich_text: {} },
            'Style': { select: {} },
            'Pace': { select: {} },
            'Temperatura': { number: { format: 'number' } },
            'Scene': { rich_text: {} },
            'Sample Context': { rich_text: {} },
            'Etiqueta': { rich_text: {} },
            'Configuración Completa': { rich_text: {} },
          },
        };

        const res = await fetch(`${NOTION_API}/databases`, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify(dbBody),
        });

        if (!res.ok) {
          const err = await res.json();
          return NextResponse.json({ error: err.message || 'Failed to create database' }, { status: res.status });
        }

        const db = await res.json();
        return NextResponse.json({ success: true, databaseId: db.id, url: db.url });
      }

      case 'export-profile': {
        if (!databaseId) {
          return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
        }

        const pageBody = {
          parent: { database_id: databaseId },
          properties: {
            'Nombre del Perfil': {
              title: [{ type: 'text', text: { content: profile.profileName || 'Sin nombre' } }],
            },
            'Locutor/a': {
              rich_text: [{ type: 'text', text: { content: profile.announcerName || '' } }],
            },
            'Voz': {
              select: profile.voice ? { name: profile.voice } : undefined,
            },
            'Audio Profile': {
              rich_text: [{ type: 'text', text: { content: profile.audioProfile || '' } }],
            },
            'Style': {
              select: profile.style ? { name: profile.style } : undefined,
            },
            'Pace': {
              select: profile.pace ? { name: profile.pace } : undefined,
            },
            'Temperatura': {
              number: profile.temperature ?? 0.5,
            },
            'Scene': {
              rich_text: [{ type: 'text', text: { content: profile.scene || '' } }],
            },
            'Sample Context': {
              rich_text: [{ type: 'text', text: { content: profile.sampleContext || '' } }],
            },
            'Etiqueta': {
              rich_text: [{ type: 'text', text: { content: profile.tag || '' } }],
            },
            'Configuración Completa': {
              rich_text: [{ type: 'text', text: { content: profile.generatedText || '' } }],
            },
          },
        };

        // Remove undefined values
        for (const key of Object.keys(pageBody.properties) as string[]) {
          const prop = (pageBody.properties as Record<string, unknown>)[key];
          if (prop === undefined) {
            delete (pageBody.properties as Record<string, unknown>)[key];
          }
        }

        const res = await fetch(`${NOTION_API}/pages`, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify(pageBody),
        });

        if (!res.ok) {
          const err = await res.json();
          return NextResponse.json({ error: err.message || 'Failed to export profile' }, { status: res.status });
        }

        const page = await res.json();
        return NextResponse.json({ success: true, pageId: page.id, url: page.url });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
