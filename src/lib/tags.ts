export interface AudioTag {
  tag: string;
  category: 'emotion' | 'rhythm' | 'vocalEffect' | 'creative' | 'nonVerbal';
  descriptionEs: string;
  descriptionEn: string;
  exampleEs: string;
  exampleEn: string;
}

export const audioTags: AudioTag[] = [
  // Emotion
  { tag: '[amazed]', category: 'emotion', descriptionEs: 'Sorpresa y asombro', descriptionEn: 'Surprise and amazement', exampleEs: '[amazed] ¡No puedo creer lo que acabo de escuchar!', exampleEn: '[amazed] I can\'t believe what I just heard!' },
  { tag: '[excited]', category: 'emotion', descriptionEs: 'Emoción y entusiasmo', descriptionEn: 'Excitement and enthusiasm', exampleEs: '[excited] ¡Bienvenidos a otra edición espectacular!', exampleEn: '[excited] Welcome to another spectacular edition!' },
  { tag: '[serious]', category: 'emotion', descriptionEs: 'Tono serio y formal', descriptionEn: 'Serious and formal tone', exampleEs: '[serious] Les informamos sobre los hechos de hoy.', exampleEn: '[serious] We bring you today\'s news.' },
  { tag: '[sarcastic]', category: 'emotion', descriptionEs: 'Sarcasmo e ironía', descriptionEn: 'Sarcasm and irony', exampleEs: '[sarcastic] Qué gran sorpresa, otra vez lo mismo.', exampleEn: '[sarcastic] What a great surprise, same thing again.' },
  { tag: '[crying]', category: 'emotion', descriptionEs: 'Llanto y tristeza', descriptionEn: 'Crying and sadness', exampleEs: '[crying] Esta es una noticia que nos duele en el alma.', exampleEn: '[crying] This is news that hurts our souls.' },
  { tag: '[panicked]', category: 'emotion', descriptionEs: 'Pánico y urgencia', descriptionEn: 'Panic and urgency', exampleEs: '[panicked] ¡Tenemos que actuar ahora mismo!', exampleEn: '[panicked] We need to act right now!' },
  { tag: '[tired]', category: 'emotion', descriptionEs: 'Cansancio y fatiga', descriptionEn: 'Tiredness and fatigue', exampleEs: '[tired] Han sido muchas horas de transmisión.', exampleEn: '[tired] It\'s been many hours of broadcasting.' },
  { tag: '[curious]', category: 'emotion', descriptionEs: 'Curiosidad e interés', descriptionEn: 'Curiosity and interest', exampleEs: '[curious] ¿Alguna vez se han preguntado por qué...?', exampleEn: '[curious] Have you ever wondered why...?' },
  { tag: '[reluctantly]', category: 'emotion', descriptionEs: 'Reluctancia y desgano', descriptionEn: 'Reluctance and unwillingness', exampleEs: '[reluctantly] Bueno, si insisten, les cuento...', exampleEn: '[reluctantly] Well, if you insist, I\'ll tell you...' },
  { tag: '[bored]', category: 'emotion', descriptionEs: 'Aburrimiento y desinterés', descriptionEn: 'Boredom and disinterest', exampleEs: '[bored] Otro día más de lo mismo...', exampleEn: '[bored] Another day, same old thing...' },

  // Rhythm
  { tag: '[very fast]', category: 'rhythm', descriptionEs: 'Muy rápido, ritmo acelerado', descriptionEn: 'Very fast, accelerated pace', exampleEs: '[very fast] Y ahora pasamos directamente a la siguiente nota.', exampleEn: '[very fast] And now we move directly to the next story.' },
  { tag: '[very slow]', category: 'rhythm', descriptionEs: 'Muy lento, pausado y deliberado', descriptionEn: 'Very slow, deliberate and measured', exampleEs: '[very slow] Cada palabra cuenta en este momento.', exampleEn: '[very slow] Every word counts in this moment.' },
  { tag: '[one painfully slow word at a time]', category: 'rhythm', descriptionEs: 'Una palabra a la vez, extremadamente lento', descriptionEn: 'One word at a time, extremely slow', exampleEs: '[one painfully slow word at a time] Esto. Es. Importante.', exampleEn: '[one painfully slow word at a time] This. Is. Important.' },
  { tag: '[pauses]', category: 'rhythm', descriptionEs: 'Pausas dramáticas entre frases', descriptionEn: 'Dramatic pauses between phrases', exampleEs: '[pauses] La respuesta... [pauses] nos sorprendió a todos.', exampleEn: '[pauses] The answer... [pauses] surprised us all.' },

  // Vocal Effect
  { tag: '[whispers]', category: 'vocalEffect', descriptionEs: 'Susurro, voz baja e íntima', descriptionEn: 'Whispering, low and intimate voice', exampleEs: '[whispers] Y les cuento un secreto que pocos conocen.', exampleEn: '[whispers] And I\'ll tell you a secret few know.' },
  { tag: '[shouting]', category: 'vocalEffect', descriptionEs: 'Grito, voz alta y potente', descriptionEn: 'Shouting, loud and powerful voice', exampleEs: '[shouting] ¡GOOOOOL! ¡Qué jugada increíble!', exampleEn: '[shouting] GOOOOAL! What an incredible play!' },
  { tag: '[low-voiced]', category: 'vocalEffect', descriptionEs: 'Voz grave y profunda', descriptionEn: 'Low, deep voice', exampleEs: '[low-voiced] En la quietud de la madrugada...', exampleEn: '[low-voiced] In the stillness of the early morning...' },
  { tag: '[trembling]', category: 'vocalEffect', descriptionEs: 'Temblores en la voz, nerviosismo', descriptionEn: 'Trembling voice, nervousness', exampleEs: '[trembling] La emoción no me deja hablar con claridad.', exampleEn: '[trembling] Emotion won\'t let me speak clearly.' },
  { tag: '[nasal]', category: 'vocalEffect', descriptionEs: 'Tono nasal', descriptionEn: 'Nasal tone', exampleEs: '[nasal] Hoy les traemos una historia peculiar.', exampleEn: '[nasal] Today we bring you a peculiar story.' },

  // Creative
  { tag: '[like a cartoon dog]', category: 'creative', descriptionEs: 'Estilo caricatura, voz animada', descriptionEn: 'Cartoon style, animated voice', exampleEs: '[like a cartoon dog] ¡Hola amiguitos!', exampleEn: '[like a cartoon dog] Hey there friends!' },
  { tag: '[like dracula]', category: 'creative', descriptionEs: 'Estilo Drácula, voz dramática y oscura', descriptionEn: 'Dracula style, dramatic and dark voice', exampleEs: '[like dracula] Bienvenidos... a la noche eterna.', exampleEn: '[like dracula] Welcome... to the eternal night.' },
  { tag: '[mischievously]', category: 'creative', descriptionEs: 'Tono pícaro y travieso', descriptionEn: 'Mischievous and playful tone', exampleEs: '[mischievously] ¿Sabían que...? Pues no es lo que creen.', exampleEn: '[mischievously] Did you know...? Well, it\'s not what you think.' },
  { tag: '[like a news anchor]', category: 'creative', descriptionEs: 'Estilo presentador de noticias', descriptionEn: 'News anchor style', exampleEs: '[like a news anchor] Buenas noches, estas son las noticias del día.', exampleEn: '[like a news anchor] Good evening, here are today\'s news.' },
  { tag: '[like a storyteller]', category: 'creative', descriptionEs: 'Estilo narrador de cuentos', descriptionEn: 'Storyteller style', exampleEs: '[like a storyteller] Érase una vez, en un pueblo lejano...', exampleEn: '[like a storyteller] Once upon a time, in a faraway village...' },

  // Non-verbal
  { tag: '[sighs]', category: 'nonVerbal', descriptionEs: 'Suspiro audible', descriptionEn: 'Audible sigh', exampleEs: '[sighs] Qué belleza la de esta canción.', exampleEn: '[sighs] What beauty in this song.' },
  { tag: '[gasp]', category: 'nonVerbal', descriptionEs: 'Jadeo, sorpresa repentina', descriptionEn: 'Gasp, sudden surprise', exampleEs: '[gasp] ¡No lo puedo creer!', exampleEn: '[gasp] I can\'t believe it!' },
  { tag: '[giggles]', category: 'nonVerbal', descriptionEs: 'Risitas suaves', descriptionEn: 'Soft giggles', exampleEs: '[giggles] Esto me recuerda algo gracioso.', exampleEn: '[giggles] This reminds me of something funny.' },
  { tag: '[laughs]', category: 'nonVerbal', descriptionEs: 'Risa audible', descriptionEn: 'Audible laugh', exampleEs: '[laughs] ¡Qué bueno que vinieron hoy!', exampleEn: '[laughs] So glad you came today!' },
  { tag: '[cough]', category: 'nonVerbal', descriptionEs: 'Tos', descriptionEn: 'Cough', exampleEs: '[cough] Disculpen, un momento...', exampleEn: '[cough] Excuse me, one moment...' },
];

export const tagCategories = {
  emotion: { es: 'Emoción', en: 'Emotion' },
  rhythm: { es: 'Ritmo', en: 'Rhythm' },
  vocalEffect: { es: 'Efecto Vocal', en: 'Vocal Effect' },
  creative: { es: 'Creativo', en: 'Creative' },
  nonVerbal: { es: 'No Verbal', en: 'Non-Verbal' },
} as const;

export const usageExamples = {
  es: [
    { desc: 'Cambio de énfasis emocional', tags: ['[excitedly]', '[bored]', '[reluctantly]'], text: 'Hola, soy un nuevo modelo de texto a voz y puedo decir cosas de muchas maneras diferentes.' },
    { desc: 'Control de ritmo', tags: ['[very fast]', '[very slow]', '[sarcastically, one painfully slow word at a time]'], text: 'Hola, soy un nuevo modelo de texto a voz...' },
    { desc: 'Secciones específicas', tags: ['[whispers]...[shouting]...[whispers]'], text: 'Hola, soy un nuevo modelo de texto a voz y puedo decir cosas de muchas maneras diferentes. ¿En qué puedo ayudarte?' },
    { desc: 'Estilos creativos', tags: ['[like a cartoon dog]', '[like dracula]'], text: 'Hola, soy un nuevo modelo de texto a voz...' },
  ],
  en: [
    { desc: 'Emotional emphasis changes', tags: ['[excitedly]', '[bored]', '[reluctantly]'], text: 'Hi, I am a new text-to-speech model and I can say things in many different ways.' },
    { desc: 'Pace control', tags: ['[very fast]', '[very slow]', '[sarcastically, one painfully slow word at a time]'], text: 'Hi, I am a new text-to-speech model...' },
    { desc: 'Specific sections', tags: ['[whispers]...[shouting]...[whispers]'], text: 'Hi, I am a new text-to-speech model and I can say things in many different ways. How can I help you?' },
    { desc: 'Creative styles', tags: ['[like a cartoon dog]', '[like dracula]'], text: 'Hi, I am a new text-to-speech model...' },
  ],
};
