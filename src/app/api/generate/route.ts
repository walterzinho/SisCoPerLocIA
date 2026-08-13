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

OPCIONES DE PACE (debes elegir SOLO una de esta lista exacta):
- natural: Natural conversational pace.
- rapid-fire: Fast, energetic, no dead air. Sentences overlap slightly.
- the-drift: Slow, liquid, zero urgency. Long pauses for breath.
- staccato: Short, clipped sentences with distinct pauses between words.

OPCIONES DE STYLE (debes elegir SOLO una de esta lista exacta):
- vocal-smile: The soft palate is raised to keep the tone bright, sunny, and explicitly inviting.
- newscaster: Professional, authoritative, clear articulation with standard broadcast cadence.
- whisper: Intimate, breathy, close-to-mic proximity effect.
- empathetic: Warm, understanding, soft tone with gentle inflections.
- promo-hype: High energy, punchy consonants, elongated vowels on excitement words.
- deadpan: Flat affect, minimal pitch variation, dry delivery.

REGLAS IMPORTANTES:
1. El Audio Profile debe ser una descripción detallada de al menos 3-4 oraciones describiendo las características de la voz, edad, acento, cualidades.
2. El Style DEBE ser exactamente uno de: vocal-smile, newscaster, whisper, empathetic, promo-hype, deadpan
3. El pace DEBE ser exactamente uno de: natural, rapid-fire, the-drift, staccato.
4. La Temperature debe ser un número entre 0.0 y 1.0. Valores bajos = más preciso/consistente, valores altos = más creativo/variable.
5. Scene debe describir el entorno físico o atmosférico de la grabación (2-3 oraciones).
6. Sample Context debe describir el contexto del locutor: qué segmento conduce, a qué audiencia habla, qué tono debe tener (3-4 oraciones).
7. El tag debe ser la etiqueta principal recomendada para el texto a locutar.
8. suggestedTags es un array de 3-5 etiquetas adicionales que podrían ser útiles.
9. voiceRationale explica brevemente por qué se eligió esa voz.
10. La voz DEBE estar en la lista de voces disponibles. Usa el ID exacto (en minúsculas).
11. Responde SIEMPRE en español.`;

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
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    // Robust JSON parsing
    let profile;
    // 1. Try direct parse
    try {
      profile = JSON.parse(text.trim());
    } catch {
      // 2. Try extracting from markdown code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        try { profile = JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue to next method */ }
      }
      // 3. Try extracting JSON object from text
      if (!profile) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try { profile = JSON.parse(objMatch[0]); } catch { /* continue */ }
        }
      }
      if (!profile) {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: text }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
