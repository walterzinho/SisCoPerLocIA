import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate format: Google AI keys start with 'AIza'
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json({
        error: 'La API key debe comenzar con "AIza". Verifica que estés usando una clave de Google AI Studio (aistudio.google.com), no una clave de Firebase ni de Google Cloud.',
      }, { status: 400 });
    }

    // Test with a minimal Gemini API call
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with only: OK' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || err?.message || 'No se pudo conectar con Google AI';

      if (res.status === 400) {
        return NextResponse.json({ error: `API key inválida o expirada: ${msg}` }, { status: 400 });
      }
      if (res.status === 403) {
        return NextResponse.json({
          error: 'La API key no tiene permiso. Verifica que la clave tenga habilitada la API de Generative Language en Google AI Studio.',
        }, { status: 403 });
      }
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const data = await res.json();
    const modelName = data.modelVersion || 'gemini-2.0-flash';

    return NextResponse.json({ success: true, model: modelName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
