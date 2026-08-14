import { NextRequest, NextResponse } from 'next/server';
import { voices } from '@/lib/voices';

const VOICES_LIST = voices.map(v => `${v.name}: ${v.trait} (${v.traitEn})`).join(', ');

const SYSTEM_PROMPT = `Eres un experto en configuración de voces para texto a voz (TTS) con Google Gemini TTS. Tu trabajo es generar configuraciones de perfil de voz detalladas y profesionales para una emisora de radio colombiana llamada Voces Campesinas.

VOCES DISPONIBLES (debes elegir SOLO una de esta lista):
${VOICES_LIST}

ETIQUETAS DE AUDIO DISPONIBLES (puedes sugerir varias, van en inglés):
Emoción: [amazed], [excited], [serious], [sarcastic], [crying], [panicked], [tired], [curious], [reluctantly], [bored]
Ritmo: [very fast], [very slow], [one painfully slow word at a time], [pauses]
Efecto Vocal: [whispers], [shouting], [low-voiced], [trembling], [nasal]
Creativo: [like a cartoon dog], [like dracula], [mischievously], [like a news anchor], [like a storyteller]
No Verbal: [sighs], [gasp], [giggles], [laughs], [cough]

OPCIONES DE PACE: natural, rapid-fire, the-drift, staccato

OPCIONES DE STYLE: vocal-smile, newscaster, whisper, empathetic, promo-hype, deadpan

REGLAS IMPORTANTES:
1. El Audio Profile debe ser una descripción detallada de al menos 3-4 oraciones describiendo las características de la voz, edad, acento, cualidades.
2. El Style debe ser uno de los valores exactos de la lista de OPTIONS DE STYLE.
3. La Temperature debe ser un número entre 0.0 y 1.0.
4. Scene debe describir el entorno físico o atmosférico de la grabación (2-3 oraciones).
5. Sample Context debe describir el contexto del locutor: qué segmento conduce, a qué audiencia habla (3-4 oraciones).
6. El tag debe ser la etiqueta principal recomendada para el texto a locutar.
7. suggestedTags es un array de 3-5 etiquetas adicionales.
8. voiceRationale explica brevemente por qué se eligió esa voz.
9. La voz DEBE estar en la lista de voces disponibles. Usa el ID exacto (en minúsculas).`;

function buildPrompt(data: Record<string, string>) {
  return `Genera una configuración completa de perfil de voz con estos datos del locutor/a:

- Nombre: ${data.name || 'No especificado'}
- Edad: ${data.age || 'No especificada'}
- Género de voz: ${data.gender || 'No especificado'}
- Tipo de perfil/segmento: ${data.profileType || 'No especificado'}
- Región/Acento: ${data.region || 'No especificado'}
- Escenario/Contexto: ${data.scenario || 'No especificado'}
${data.additional ? `- Información adicional: ${data.additional}` : ''}

Genera DOS versiones del perfil: una en español (profileEs) y otra en inglés (profileEn). La versión en inglés debe estar optimizada para el motor TTS de Google Gemini, con descripciones precisas y efectivas para la generación de voz.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "profileEs": {
    "voice": "voice_id",
    "audioProfile": "descripción detallada del perfil de audio en español...",
    "style": "valor-exacto-de-la-lista",
    "pace": "valor-exacto-de-la-lista",
    "temperature": 0.XX,
    "scene": "descripción del escenario en español...",
    "sampleContext": "contexto de muestra en español...",
    "tag": "[etiqueta_principal]",
    "suggestedTags": ["[tag1]", "[tag2]", "[tag3]"],
    "voiceRationale": "razón de la selección de voz en español..."
  },
  "profileEn": {
    "voice": "voice_id",
    "audioProfile": "detailed audio profile description in English optimized for TTS...",
    "style": "exact-value-from-list",
    "pace": "exact-value-from-list",
    "temperature": 0.XX,
    "scene": "scene description in English...",
    "sampleContext": "sample context in English...",
    "tag": "[main_tag]",
    "suggestedTags": ["[tag1]", "[tag2]", "[tag3]"],
    "voiceRationale": "voice selection rationale in English..."
  }
}

AMBAS versiones deben usar la MISMA voz (voice), el MISMO style, el MISMO pace y la MISMA temperature. Las diferencias deben ser solo en los textos descriptivos (audioProfile, scene, sampleContext, voiceRationale, tag, suggestedTags).`;
}

function parseGeminiJson(text: string): Record<string, unknown> | null {
  // Try direct parse
  try { return JSON.parse(text); } catch {}

  // Try extracting from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  // Try finding JSON object in text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch {}
  }

  return null;
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
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
    }

    const parsed = parseGeminiJson(text);
    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: text }, { status: 500 });
    }

    const profileEs = parsed.profileEs || parsed;
    const profileEn = parsed.profileEn || null;

    return NextResponse.json({ success: true, profile: profileEs, profileEn });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
