import type { Locale } from './i18n';

export interface VoiceTemplate {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  voice: string;
  audioProfile: string;
  style: string;
  pace: string;
  temperature: number;
  scene: string;
  sampleContext: string;
  tag: string;
}

export const templates: VoiceTemplate[] = [
  {
    id: 'news',
    nameEs: 'Noticiero',
    nameEn: 'News',
    descriptionEs: 'Perfil para noticias, serio y autoritativo',
    descriptionEn: 'News profile, serious and authoritative',
    voice: 'charon',
    audioProfile: 'A professional news anchor voice with clear diction, confident delivery, and a neutral authoritative tone. 45-year-old male voice artist with a standard Latin American Spanish accent: precise, credible, objective, and commanding.',
    style: 'Serious',
    pace: 'moderate',
    temperature: 0.3,
    scene: 'A professional news studio with bright lighting, teleprompter, and a focused atmosphere. The backdrop shows a city skyline.',
    sampleContext: 'As the lead anchor for the evening news broadcast at 8:00 PM, delivering breaking news and daily headlines with precision and gravitas to a wide metropolitan audience.',
    tag: '[like a news anchor]',
  },
  {
    id: 'magazine',
    nameEs: 'Magazine',
    nameEn: 'Magazine',
    descriptionEs: 'Perfil para programas magazine, dinámico y cercano',
    descriptionEn: 'Magazine show profile, dynamic and approachable',
    voice: 'puck',
    audioProfile: 'A vibrant, energetic radio host with a warm and engaging voice. 35-year-old voice artist with a Colombian Spanish accent: charismatic, friendly, humorous, and spontaneous.',
    style: 'Enthusiastic',
    pace: 'fast',
    temperature: 0.65,
    scene: 'A colorful, lively radio studio with multiple screens, guest seating, and an informal atmosphere. Music beds transition between segments.',
    sampleContext: 'Hosting a weekend magazine show with interviews, music, and audience interaction. The show covers lifestyle, culture, and entertainment with a fun, relaxed tone.',
    tag: '[excitedly]',
  },
  {
    id: 'cultural',
    nameEs: 'Cultural',
    nameEn: 'Cultural',
    descriptionEs: 'Perfil para programas culturales, profundo y narrativo',
    descriptionEn: 'Cultural program profile, deep and narrative',
    voice: 'umbriel',
    audioProfile: 'A contemplative, well-spoken cultural commentator with a rich, measured voice. 50-year-old voice artist with a neutral Spanish accent: reflective, eloquent, knowledgeable, and soothing.',
    style: 'Empathetic',
    pace: 'slow',
    temperature: 0.5,
    scene: 'A quiet, warmly-lit studio with bookshelves, art pieces, and acoustic instruments. The atmosphere invites deep conversation and reflection.',
    sampleContext: 'Hosting a cultural program that explores literature, music, and traditions. The tone is thoughtful and intimate, inviting listeners to pause and reflect.',
    tag: '[like a storyteller]',
  },
  {
    id: 'sports',
    nameEs: 'Deportivo',
    nameEn: 'Sports',
    descriptionEs: 'Perfil para narración deportiva, apasionado y enérgico',
    descriptionEn: 'Sports narration profile, passionate and energetic',
    voice: 'fenrir',
    audioProfile: 'A passionate, high-energy sports commentator with a powerful, projecting voice. 30-year-old voice artist with a Latin American Spanish accent: explosive, emotional, rhythmic, and vibrant.',
    style: 'Enthusiastic',
    pace: 'rapid-fire',
    temperature: 0.8,
    scene: 'A packed sports stadium with crowd noise in the background. The commentator booth overlooks the field with live action unfolding.',
    sampleContext: 'Live play-by-play commentary of a football match, capturing every goal, foul, and save with raw emotion and instant analysis for passionate sports fans.',
    tag: '[excited]',
  },
  {
    id: 'morning',
    nameEs: 'Matutino',
    nameEn: 'Morning',
    descriptionEs: 'Perfil para programas de la mañana, cálido y motivador',
    descriptionEn: 'Morning show profile, warm and motivating',
    voice: 'zephyr',
    audioProfile: 'A bright, cheerful morning radio host with an uplifting, sunny voice. 40-year-old female voice artist with a Colombian Spanish accent: warm, dynamic, motivating, and clear.',
    style: 'Empathetic',
    pace: 'moderate',
    temperature: 0.55,
    scene: 'A cozy radio studio bathed in morning sunlight, with a coffee cup on the desk and soft music playing. The atmosphere is fresh and hopeful.',
    sampleContext: 'Hosting a morning show that wakes up listeners with positive energy, music, and community news. The tone is like talking with a good friend over morning coffee.',
    tag: '[excitedly]',
  },
  {
    id: 'night',
    nameEs: 'Nocturno',
    nameEn: 'Night',
    descriptionEs: 'Perfil para programas nocturnos, íntimo y relajante',
    descriptionEn: 'Night show profile, intimate and relaxing',
    voice: 'callirrhoe',
    audioProfile: 'A smooth, calming late-night radio host with a velvety, intimate voice. 45-year-old voice artist with a neutral Spanish accent: soothing, confidential, gentle, and atmospheric.',
    style: 'Calm',
    pace: 'slow',
    temperature: 0.45,
    scene: 'A dimly-lit radio studio at night, with city lights visible through the window. Soft jazz plays in the background, creating a late-night ambiance.',
    sampleContext: 'Hosting a late-night show that features dedication songs, reflections, and conversation with night owls. The tone is intimate, like sharing secrets with a close friend.',
    tag: '[low-voiced]',
  },
];

export function getTemplateById(id: string): VoiceTemplate | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplateName(template: VoiceTemplate, locale: Locale): string {
  return locale === 'es' ? template.nameEs : template.nameEn;
}

export function getTemplateDescription(template: VoiceTemplate, locale: Locale): string {
  return locale === 'es' ? template.descriptionEs : template.descriptionEn;
}
