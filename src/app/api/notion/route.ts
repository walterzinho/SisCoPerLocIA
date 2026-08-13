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

      case 'list-databases': {
        const allDbs: { id: string; title: string; url: string }[] = [];
        let hasMore = true;
        let startCursor: string | undefined;
        while (hasMore) {
          const url = new URL(`${NOTION_API}/search`);
          url.searchParams.set('page_size', '100');
          url.searchParams.set('filter', JSON.stringify({ value: 'database', property: 'object' }));
          if (startCursor) url.searchParams.set('start_cursor', startCursor);
          const res = await fetch(url.toString(), {
            method: 'POST', headers: headers(token), body: JSON.stringify({}),
          });
          if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.message || 'Failed to search' }, { status: res.status });
          }
          const data = await res.json();
          for (const db of data.results) {
            const title = (db.title as Array<Record<string, string>>)?.map(t => t.plain_text).join('') || 'Sin título';
            allDbs.push({ id: db.id, title, url: db.url });
          }
          hasMore = data.has_more;
          startCursor = data.next_cursor;
        }
        return NextResponse.json({ success: true, databases: allDbs });
      }

      case 'test-database': {
        if (!cleanDbId) {
          return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
        }
        if (cleanDbId.length !== 32) {
          return NextResponse.json({
            error: `El ID tiene ${cleanDbId.length} caracteres pero debe tener exactamente 32 (sin guiones).`,
            code: 'invalid_id_length',
          }, { status: 400 });
        }

        // 1) Try as database
        let res = await fetch(`${NOTION_API}/databases/${cleanDbId}`, { headers: headers(token) });

        if (res.ok) {
          const db = await res.json();
          const title = db.title?.[0]?.plain_text || 'Sin título';
          return NextResponse.json({ success: true, title, url: db.url });
        }

        // 2) Failed as database — try as PAGE to see if user copied a page ID instead
        const pageRes = await fetch(`${NOTION_API}/pages/${cleanDbId}`, { headers: headers(token) });

        if (pageRes.ok) {
          const pageData = await pageRes.json();
          const parentDb = pageData.parent?.database_id;
          const parentPage = pageData.parent?.page_id;
          const pageName = (pageData.properties as Record<string, Record<string, unknown>>)?.Nombre?.title
            ?.map((t: Record<string, string>) => t.plain_text).join('')
            || (pageData.properties as Record<string, Record<string, unknown>>)?.['Nombre del Perfil']?.title
              ?.map((t: Record<string, string>) => t.plain_text).join('')
            || 'esta página';

          if (parentDb) {
            return NextResponse.json({
              error: `Ese ID es de una PÁGINA (${pageName}), no de la base de datos. El ID de tu base de datos es:
${parentDb}

Copia ese ID y pégalo en el campo de ID de Base de Datos.`,
              code: 'page_instead_of_database',
              correctDatabaseId: parentDb,
            }, { status: 400 });
          }

          if (parentPage) {
            return NextResponse.json({
              error: `Ese ID es de una página normal (${pageName}) que no está dentro de una base de datos. Necesitas encontrar el ID de la BASE DE DATOS (vista de tabla), no de una página individual.`,
              code: 'regular_page',
            }, { status: 400 });
          }

          return NextResponse.json({
            error: `Ese ID es de una página, no de una base de datos. Asegúrate de copiar el ID de la vista de tabla (base de datos), no de una página individual.`,
            code: 'page_instead_of_database',
          }, { status: 400 });
        }

        // 3) Not found as either database or page
        const dbErr = await res.json().catch(() => ({}));
        const code = dbErr.code || '';

        if (code === 'unauthorized' || res.status === 401) {
          return NextResponse.json({
            error: 'La integración no tiene acceso a ese recurso. Ve a la base de datos en Notion → ⋯ (tres puntos) → Conexiones → Añade tu integración.',
            code: 'unauthorized',
          }, { status: 403 });
        }

        return NextResponse.json({
          error: `No se encontró ninguna base de datos ni página con ese ID (${cleanDbId}). Verifica que lo hayas copiado correctamente de la URL de Notion.`,
          code: 'not_found',
        }, { status: 404 });
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
              profileName: getProp('Nombre') || getProp('Nombre del Perfil') || getProp('Name'),
              announcerName: getProp('Genero') || getProp('Locutor/a') || getProp('Announcer'),
              voice: getProp('Voz') || getProp('Voice'),
              audioProfile: getProp('Instrucciones') || getProp('Audio Profile'),
              style: getProp('Tono') || getProp('Style'),
              pace: getProp('Ritmo') || getProp('Pace'),
              temperature: '',
              scene: getProp('Escenario') || getProp('Scene'),
              sampleContext: getProp('Instrucciones') || getProp('Sample Context'),
              tag: getProp('Tags') || getProp('Etiqueta') || getProp('Tag'),
              language: getProp('Idioma') || getProp('Language'),
              englishInstructions: getProp('Instrucciones EN') || getProp('EN Instructions'),
              fullConfig: getProp('Instrucciones') || getProp('Configuración Completa') || getProp('Full Configuration'),
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
            'Nombre': {
              title: [{ type: 'text', text: { content: profileName || profile?.profileName || 'Sin nombre' } }],
            },
          },
        };

        const props = pageBody.properties as Record<string, unknown>;
        if (profile?.announcerName) props['Genero'] = { select: { name: profile.announcerName } };
        if (profile?.voice) props['Voz'] = { select: { name: profile.voice } };
        if (profile?.style) props['Tono'] = { select: { name: profile.style } };
        if (profile?.pace) props['Ritmo'] = { select: { name: profile.pace } };
        if (profile?.scene) props['Escenario'] = { rich_text: [{ type: 'text', text: { content: profile.scene } }] };
        if (profile?.sampleContext || profile?.audioProfile) {
          const instrParts: string[] = [];
          if (profile.audioProfile) instrParts.push(profile.audioProfile);
          if (profile.sampleContext) instrParts.push(profile.sampleContext);
          props['Instrucciones'] = { rich_text: [{ type: 'text', text: { content: instrParts.join('\n---\n') } }] };
        }
        if (profile?.tag) props['Tags'] = { multi_select: [{ name: profile.tag }] };
        if (profile?.generatedText) props['Instrucciones'] = { rich_text: [{ type: 'text', text: { content: profile.generatedText } }] };
        props['Idioma'] = { select: { name: 'Español' } };

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
        if (profile?.profileName) updateProps['Nombre'] = { title: [{ type: 'text', text: { content: profile.profileName } }] };
        if (profile?.announcerName) updateProps['Genero'] = { select: { name: profile.announcerName } };
        if (profile?.voice) updateProps['Voz'] = { select: { name: profile.voice } };
        if (profile?.style) updateProps['Tono'] = { select: { name: profile.style } };
        if (profile?.pace) updateProps['Ritmo'] = { select: { name: profile.pace } };
        if (profile?.scene) updateProps['Escenario'] = { rich_text: [{ type: 'text', text: { content: profile.scene } }] };
        if (profile?.tag) updateProps['Tags'] = { multi_select: [{ name: profile.tag }] };
        if (profile?.generatedText) updateProps['Instrucciones'] = { rich_text: [{ type: 'text', text: { content: profile.generatedText } }] };
        if (profile?.language) updateProps['Idioma'] = { select: { name: profile.language } };
        if (profile?.englishInstructions) updateProps['Instrucciones EN'] = { rich_text: [{ type: 'text', text: { content: profile.englishInstructions } }] };

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
