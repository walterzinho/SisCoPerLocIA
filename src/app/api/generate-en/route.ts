import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert in text-to-speech (TTS) voice configuration for Google Gemini 3.1 Flash TTS Preview. Your job is to translate and adapt voice profile instructions from Spanish to English, optimized for the AI to understand and produce the best possible voice output.

RULES:
1. Translate ALL fields to English. The AI understands English better, so the English instructions should be the definitive reference for TTS generation.
2. Keep the same JSON structure.
3. Adapt cultural references and regional descriptions so they make sense in English while preserving the original intent.
4. Audio tags must remain in English (they already are).
5. Pace values must remain as-is (very-slow, slow, moderate, fast, very-fast, rapid-fire).
6. Temperature value must remain as a number between 0.0 and 1.0.
7. The voice ID must remain unchanged.
8. Respond ONLY with valid JSON, no markdown, no backticks.`;

export async function POST(req: NextRequest) {
  try {
    const { apiKey, profile, announcerName } = await req.json();

    if (!apiKey || !profile) {
      return NextResponse.json({ error: 'API key and profile are required' }, { status: 400 });
    }

    const prompt = `Translate and optimize this voice profile configuration to English. The AI TTS engine understands English better, so make the descriptions precise and effective for voice generation.

Announcer name: ${announcerName || 'Not specified'}

Current profile (in Spanish):
${JSON.stringify(profile, null, 2)}

Respond with the COMPLETE translated profile in this exact JSON format:
{
  "voice": "voice_id",
  "audioProfile": "detailed audio profile description in English...",
  "style": "StyleName",
  "pace": "pace_value",
  "temperature": 0.XX,
  "scene": "scene description in English...",
  "sampleContext": "sample context in English...",
  "tag": "[main_tag]",
  "suggestedTags": ["[tag1]", "[tag2]"],
  "voiceRationale": "voice selection rationale in English..."
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
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

    let translated;
    try {
      translated = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) { try { translated = JSON.parse(jsonMatch[1]); } catch { /* */ } }
      if (!translated) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) { try { translated = JSON.parse(objMatch[0]); } catch { /* */ } }
      }
      if (!translated) {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: text.substring(0, 500) }, { status: 500 });
      }
    }

    // Build the English instructions text
    const { buildProfileText } = await import('@/lib/store');
    const enText = buildProfileText(
      'EN - ' + (announcerName || 'Profile'),
      announcerName || '',
      translated,
      translated.voice || '',
      '',
    );

    return NextResponse.json({ success: true, translated, text: enText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
