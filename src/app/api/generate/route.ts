import { NextRequest, NextResponse } from 'next/server';
import { voices } from '@/lib/voices';

const VOICES_LIST = voices.map(v => `${v.name}: ${v.trait} (${v.traitEn})`).join(', ');

const SYSTEM_PROMPT = `Eres un experto en configuración de voces para texto a voz (TTS) con Google Gemini 3.1 Flash TTS Preview. Tu trabajo es generar configuraciones de perfil de voz detalladas y profesionales para una emisora de radio colombiana llamada Voces Campesinas.

VOCES DISPONIBLES (debes elegir SOLO una de esta lista):
${VOICES_LIST}

ETIQUETAS DE AUDIO DISPONIBLES (puedes sugerir varias, van en inglés):
Emoción: [amazed], [excited], [serious], [sarcastic], [crying], [panicked], [tired], [curious], [reluctantly], [bored]
Ritmo: [very fast], [very slow], [one painfully slow word at a time], [pauses]
Efecto Vocal: [whispers], [shouting], [low-voiced], [trembling], [nasal]
Creativo: [like a cartoon dog], [like dracula], [mischievously], [like a news anchor], [like a storyteller]
No Verbal: [sighs], [gasp], [giggles], [laughs], [cough]

OPCIONES DE PACE: very-slow, slow, moderate, fast, very-fast, rapid-fire

REGLAS IMPORTANTES:
1. El Audio Profile debe ser una descripción detallada de al menos 3-4 oraciones describiendo las características de la voz, edad, acento, cualidades.
2. El Style debe ser una sola palabra o frase corta (Ej: Empathetic, Professional, Enthusiastic, Calm, Serious, Cheerful)
3. La Temperature debe ser un número entre 0.0 y 1.0. Valores bajos = más preciso/consistente, valores altos = más creativo/variable.
4. Scene debe describir el entorno físico o atmosférico de la grabación (2-3 oraciones).
5. Sample Context debe describir el contexto del locutor: qué segmento conduce, a qué audiencia habla, qué tono debe tener (3-4 oraciones).
6. El tag debe ser la etiqueta principal recomendada para el texto a locutar.
7. suggestedTags es un array de 3-5 etiquetas adicionales que podrían ser útiles.
8. voiceRationale explica brevemente por qué se eligió esa voz.
9. La voz DEBE estar en la lista de voces disponibles. Usa el ID exacto (en minúsculas).
10. Responde SIEMPRE en español.`;

function buildPrompt(data: Record<string, string>) {
  return `Genera una configuración completa de perfil de voz con estos datos del locutor/a:

- Nombre: ${data.name || 'No especificado'}
- Edad: ${data.age || 'No especificada'}
- Género de voz: ${data.gender || 'No especificado'}
- Tipo de perfil/segmento: ${data.profileType || 'No especificado'}
- Región/Acento: ${data.region || 'No especificado'}
- Escenario/Contexto: ${data.scenario || 'No especificado'}
${data.additional ? `- Información adicional: ${data.additional}` : ''}

Genera la configuración respondiendo ÚNICAMENTE con un JSON válido (sin markdown, sin \\\`\\\\\\\\\`) con esta estructura exacta:
{
  "voice": "voice_id",
  "audioProfile": "descripción detallada del perfil de audio...",
  "style": "NombreDelEstilo",
  "pace": "pace_value",
  "temperature": 0.XX,
  "scene": "descripción del escenario...",
  "sampleContext": "contexto de muestra...",
  "tag": "[etiqueta_principal]",
  "suggestedTags": ["[tag1]", "[tag2]", "[tag3]"],
  "voiceRationale": "razón de la selección de voz..."
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, ...data } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key is required' }, { status: 400 });
    }

    const prompt = buildPrompt(data);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${err}` }, { status: res.status });
    }

    const result = await res.json();
    let text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      // Try to extract from model response in different formats
      const modelStr = JSON.stringify(result);
      console.error('Gemini response:', modelStr.substring(0, 500));
      return NextResponse.json({ error: 'No response from Gemini', debug: modelStr.substring(0, 300) }, { status: 500 });
    }

    let profile;
    try {
      // Try direct parse first
      profile = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try { profile = JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
      }
      // Try finding JSON object in text
      if (!profile) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try { profile = JSON.parse(objMatch[0]); } catch { /* fall through */ }
        }
      }
      if (!profile) {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: text.substring(0, 500) }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
