import { NextRequest, NextResponse } from 'next/server';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, databaseId, profile, profileName, pageId } = body;

    if (!token) {
      return NextResponse.json({ error: 'Notion token is required' }, { status: 400 });
    }

    // Sanitize database ID: remove dashes, spaces, and trim
    const sanitizeId = (id: string) => id.replace(/[-\s]/g, '').trim();
    const cleanDbId = databaseId ? sanitizeId(databaseId) : '';

    switch (action) {
      case 'test': {
        const res = await fetch(`${NOTION_API}/users/me`, { headers: headers(token) });
        if (!res.ok) {
          const err = await res.json();
          return NextResponse.json({ error: err.message || 'Token inválido' }, { status: 401 });
        }
        const user = await res.json();
        return NextResponse.json({ success: true, name: user.name || 'Connected' });
      }

      case 'test-database': {
        if (!cleanDbId) {
          return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
        }
        if (cleanDbId.length !== 32) {
          return NextResponse.json({
            error: `El ID tiene ${cleanDbId.length} caracteres pero debe tener exactamente 32 (sin guiones). Verifica que estés copiando el ID de la base de datos, no de una página.`,
            code: 'invalid_id_length',
          }, { status: 400 });
        }
        const res = await fetch(`${NOTION_API}/databases/${cleanDbId}`, { headers: headers(token) });
        if (!res.ok) {
          const err = await res.json();
          const code = err.code || '';
          let msg = err.message || 'Database no encontrada';
          if (code === 'not_found') {
            msg = 'No se encontró una base de datos con ese ID. Asegúrate de que el ID pertenece a una BASE DE DATOS (no a una página normal). Puedes encontrarlo en: Base de datos → ⋯ (tres puntos) → Conexiones → Copiar enlace de la base de datos. El ID son los últimos 32 caracteres hexadecimales en la URL.';
          } else if (code === 'unauthorized') {
            msg = 'El token no tiene acceso a esta base de datos. Asegúrate de haber compartido la base de datos con tu integración de Notion (Conexiones → Añadir integraciones).';
          }
          return NextResponse.json({ error: msg, code }, { status: res.status });
        }
        const db = await res.json();
        const title = db.title?.[0]?.plain_text || 'Sin título';
        return NextResponse.json({ success: true, title, url: db.url });
      }

      case 'query-profiles': {
        if (!cleanDbId) {
          return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
        }
        const allProfiles: Record<string, unknown>[] = [];
        let hasMore = true;
        let startCursor: string | undefined;

        while (hasMore) {
          const url = new URL(`${NOTION_API}/databases/${cleanDbId}/query`);
          url.searchParams.set('page_size', '100');
          if (startCursor) url.searchParams.set('start_cursor', startCursor);
          url.searchParams.set('sorts', JSON.stringify([{ timestamp: 'created_time', direction: 'descending' }]));

          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: headers(token),
            body: JSON.stringify({}),
          });

          if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.message || 'Failed to query' }, { status: res.status });
          }

          const data = await res.json();

          for (const page of data.results) {
            const props = page.properties as Record<string, Record<string, unknown>>;
            const getProp = (key: string): string => {
              const p = props[key];
              if (!p) return '';
              if (p.type === 'title') return (p.title as Array<Record<string, string>>)?.map(t => t.plain_text).join('') || '';
              if (p.type === 'rich_text') return (p.rich_text as Array<Record<string, string>>)?.map(t => t.plain_text).join('') || '';
              if (p.type === 'select') return (p.select as Record<string, string>)?.name || '';
              if (p.type === 'number') return String(p.number ?? '');
              return '';
            };

            allProfiles.push({
              pageId: page.id,
              url: page.url,
              profileName: getProp('Nombre del Perfil') || getProp('Name') || getProp('Nombre'),
              announcerName: getProp('Locutor/a') || getProp('Announcer') || getProp('Locutor'),
              voice: getProp('Voz') || getProp('Voice'),
              audioProfile: getProp('Audio Profile'),
              style: getProp('Style'),
              pace: getProp('Pace'),
              temperature: getProp('Temperatura') || getProp('Temperature'),
              scene: getProp('Scene'),
              sampleContext: getProp('Sample Context'),
              tag: getProp('Etiqueta') || getProp('Tag'),
              fullConfig: getProp('Configuración Completa') || getProp('Full Configuration'),
              createdAt: page.created_time,
            });
          }

          hasMore = data.has_more;
          startCursor = data.next_cursor;
        }

        return NextResponse.json({ success: true, profiles: allProfiles });
      }

      case 'export-profile': {
        if (!cleanDbId) {
          return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
        }

        const pageBody: Record<string, unknown> = {
          parent: { database_id: cleanDbId },
          properties: {
            'Nombre del Perfil': {
              title: [{ type: 'text', text: { content: profileName || profile?.profileName || 'Sin nombre' } }],
            },
          },
        };

        const props = pageBody.properties as Record<string, unknown>;
        if (profile?.announcerName) props['Locutor/a'] = { rich_text: [{ type: 'text', text: { content: profile.announcerName } }] };
        if (profile?.voice) props['Voz'] = { select: { name: profile.voice } };
        if (profile?.audioProfile) props['Audio Profile'] = { rich_text: [{ type: 'text', text: { content: profile.audioProfile } }] };
        if (profile?.style) props['Style'] = { select: { name: profile.style } };
        if (profile?.pace) props['Pace'] = { select: { name: profile.pace } };
        if (profile?.temperature != null) props['Temperatura'] = { number: Number(profile.temperature) };
        if (profile?.scene) props['Scene'] = { rich_text: [{ type: 'text', text: { content: profile.scene } }] };
        if (profile?.sampleContext) props['Sample Context'] = { rich_text: [{ type: 'text', text: { content: profile.sampleContext } }] };
        if (profile?.tag) props['Etiqueta'] = { rich_text: [{ type: 'text', text: { content: profile.tag } }] };
        if (profile?.generatedText) props['Configuración Completa'] = { rich_text: [{ type: 'text', text: { content: profile.generatedText } }] };

        const res = await fetch(`${NOTION_API}/pages`, {
          method: 'POST',
          headers: headers(token),
          body: JSON.stringify(pageBody),
        });

        if (!res.ok) {
          const err = await res.json();
          return NextResponse.json({ error: err.message || 'Failed to export' }, { status: res.status });
        }

        const page = await res.json();
        return NextResponse.json({ success: true, pageId: page.id, url: page.url });
      }

      case 'update-profile': {
        if (!pageId) {
          return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
        }

        const updateProps: Record<string, unknown> = {};
        if (profile?.profileName) updateProps['Nombre del Perfil'] = { title: [{ type: 'text', text: { content: profile.profileName } }] };
        if (profile?.announcerName) updateProps['Locutor/a'] = { rich_text: [{ type: 'text', text: { content: profile.announcerName } }] };
        if (profile?.voice) updateProps['Voz'] = { select: { name: profile.voice } };
        if (profile?.audioProfile) updateProps['Audio Profile'] = { rich_text: [{ type: 'text', text: { content: profile.audioProfile } }] };
        if (profile?.style) updateProps['Style'] = { select: { name: profile.style } };
        if (profile?.pace) updateProps['Pace'] = { select: { name: profile.pace } };
        if (profile?.temperature != null) updateProps['Temperatura'] = { number: Number(profile.temperature) };
        if (profile?.scene) updateProps['Scene'] = { rich_text: [{ type: 'text', text: { content: profile.scene } }] };
        if (profile?.sampleContext) updateProps['Sample Context'] = { rich_text: [{ type: 'text', text: { content: profile.sampleContext } }] };
        if (profile?.tag) updateProps['Etiqueta'] = { rich_text: [{ type: 'text', text: { content: profile.tag } }] };
        if (profile?.generatedText) updateProps['Configuración Completa'] = { rich_text: [{ type: 'text', text: { content: profile.generatedText } }] };

        const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
          method: 'PATCH',
          headers: headers(token),
          body: JSON.stringify({ properties: updateProps }),
        });

        if (!res.ok) {
          const err = await res.json();
          return NextResponse.json({ error: err.message || 'Failed to update' }, { status: res.status });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
