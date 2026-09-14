import { Song } from '../types';

export interface BookInfo {
  abbr: string;
  name: string;
  testament: 'AT' | 'NT';
  category: 'lei' | 'hist' | 'poet' | 'prof' | 'evan' | 'cartas' | 'revel';
  chapters: number;
}

export const BIBLE_BOOKS: BookInfo[] = [
  // Antigo Testamento - Pentateuco / Lei
  { abbr: 'Gn', name: 'Gênesis', testament: 'AT', category: 'lei', chapters: 50 },
  { abbr: 'Ex', name: 'Êxodo', testament: 'AT', category: 'lei', chapters: 40 },
  { abbr: 'Lv', name: 'Levítico', testament: 'AT', category: 'lei', chapters: 27 },
  { abbr: 'Nm', name: 'Números', testament: 'AT', category: 'lei', chapters: 36 },
  { abbr: 'Dt', name: 'Deuteronômio', testament: 'AT', category: 'lei', chapters: 34 },
  // Históricos
  { abbr: 'Js', name: 'Josué', testament: 'AT', category: 'hist', chapters: 24 },
  { abbr: 'Jz', name: 'Juízes', testament: 'AT', category: 'hist', chapters: 21 },
  { abbr: 'Rt', name: 'Rute', testament: 'AT', category: 'hist', chapters: 4 },
  { abbr: '1Sm', name: 'I Samuel', testament: 'AT', category: 'hist', chapters: 31 },
  { abbr: '2Sm', name: 'II Samuel', testament: 'AT', category: 'hist', chapters: 24 },
  { abbr: '1Rs', name: 'I Reis', testament: 'AT', category: 'hist', chapters: 22 },
  { abbr: '2Rs', name: 'II Reis', testament: 'AT', category: 'hist', chapters: 25 },
  { abbr: '1Cr', name: 'I Crônicas', testament: 'AT', category: 'hist', chapters: 29 },
  { abbr: '2Cr', name: 'II Crônicas', testament: 'AT', category: 'hist', chapters: 36 },
  { abbr: 'Ed', name: 'Esdras', testament: 'AT', category: 'hist', chapters: 10 },
  { abbr: 'Ne', name: 'Neemias', testament: 'AT', category: 'hist', chapters: 13 },
  { abbr: 'Et', name: 'Ester', testament: 'AT', category: 'hist', chapters: 10 },
  // Poéticos
  { abbr: 'Jó', name: 'Jó', testament: 'AT', category: 'poet', chapters: 42 },
  { abbr: 'Sl', name: 'Salmos', testament: 'AT', category: 'poet', chapters: 150 },
  { abbr: 'Pv', name: 'Provérbios', testament: 'AT', category: 'poet', chapters: 31 },
  { abbr: 'Ec', name: 'Eclesiastes', testament: 'AT', category: 'poet', chapters: 12 },
  { abbr: 'Ct', name: 'Cânticos', testament: 'AT', category: 'poet', chapters: 8 },
  // Proféticos
  { abbr: 'Is', name: 'Isaías', testament: 'AT', category: 'prof', chapters: 66 },
  { abbr: 'Jr', name: 'Jeremias', testament: 'AT', category: 'prof', chapters: 52 },
  { abbr: 'Lm', name: 'Lamentações', testament: 'AT', category: 'prof', chapters: 5 },
  { abbr: 'Ez', name: 'Ezequiel', testament: 'AT', category: 'prof', chapters: 48 },
  { abbr: 'Dn', name: 'Daniel', testament: 'AT', category: 'prof', chapters: 12 },
  { abbr: 'Os', name: 'Oséias', testament: 'AT', category: 'prof', chapters: 14 },
  { abbr: 'Jl', name: 'Joel', testament: 'AT', category: 'prof', chapters: 3 },
  { abbr: 'Am', name: 'Amós', testament: 'AT', category: 'prof', chapters: 9 },
  { abbr: 'Ob', name: 'Obadias', testament: 'AT', category: 'prof', chapters: 1 },
  { abbr: 'Jn', name: 'Jonas', testament: 'AT', category: 'prof', chapters: 4 },
  { abbr: 'Mq', name: 'Miquéias', testament: 'AT', category: 'prof', chapters: 7 },
  { abbr: 'Na', name: 'Naum', testament: 'AT', category: 'prof', chapters: 3 },
  { abbr: 'Hc', name: 'Habacuque', testament: 'AT', category: 'prof', chapters: 3 },
  { abbr: 'Sf', name: 'Sofonias', testament: 'AT', category: 'prof', chapters: 3 },
  { abbr: 'Ag', name: 'Ageu', testament: 'AT', category: 'prof', chapters: 2 },
  { abbr: 'Zc', name: 'Zacarias', testament: 'AT', category: 'prof', chapters: 14 },
  { abbr: 'Ml', name: 'Malaquias', testament: 'AT', category: 'prof', chapters: 4 },
  // Novo Testamento - Evangelhos
  { abbr: 'Mt', name: 'Mateus', testament: 'NT', category: 'evan', chapters: 28 },
  { abbr: 'Mc', name: 'Marcos', testament: 'NT', category: 'evan', chapters: 16 },
  { abbr: 'Lc', name: 'Lucas', testament: 'NT', category: 'evan', chapters: 24 },
  { abbr: 'Jo', name: 'João', testament: 'NT', category: 'evan', chapters: 21 },
  { abbr: 'At', name: 'Atos', testament: 'NT', category: 'evan', chapters: 28 },
  // Cartas Paulinas e Gerais
  { abbr: 'Rm', name: 'Romanos', testament: 'NT', category: 'cartas', chapters: 16 },
  { abbr: '1Co', name: 'I Coríntios', testament: 'NT', category: 'cartas', chapters: 16 },
  { abbr: '2Co', name: 'II Coríntios', testament: 'NT', category: 'cartas', chapters: 13 },
  { abbr: 'Gl', name: 'Gálatas', testament: 'NT', category: 'cartas', chapters: 6 },
  { abbr: 'Ef', name: 'Efésios', testament: 'NT', category: 'cartas', chapters: 6 },
  { abbr: 'Fp', name: 'Filipenses', testament: 'NT', category: 'cartas', chapters: 4 },
  { abbr: 'Cl', name: 'Colossenses', testament: 'NT', category: 'cartas', chapters: 4 },
  { abbr: '1Ts', name: 'I Tessalonicenses', testament: 'NT', category: 'cartas', chapters: 5 },
  { abbr: '2Ts', name: 'II Tessalonicenses', testament: 'NT', category: 'cartas', chapters: 3 },
  { abbr: '1Tm', name: 'I Timóteo', testament: 'NT', category: 'cartas', chapters: 6 },
  { abbr: '2Tm', name: 'II Timóteo', testament: 'NT', category: 'cartas', chapters: 4 },
  { abbr: 'Tt', name: 'Tito', testament: 'NT', category: 'cartas', chapters: 3 },
  { abbr: 'Fm', name: 'Filemom', testament: 'NT', category: 'cartas', chapters: 1 },
  { abbr: 'Hb', name: 'Hebreus', testament: 'NT', category: 'cartas', chapters: 13 },
  { abbr: 'Tg', name: 'Tiago', testament: 'NT', category: 'cartas', chapters: 5 },
  { abbr: '1Pe', name: 'I Pedro', testament: 'NT', category: 'cartas', chapters: 5 },
  { abbr: '2Pe', name: 'II Pedro', testament: 'NT', category: 'cartas', chapters: 3 },
  { abbr: '1Jo', name: 'I João', testament: 'NT', category: 'cartas', chapters: 5 },
  { abbr: '2Jo', name: 'II João', testament: 'NT', category: 'cartas', chapters: 1 },
  { abbr: '3Jo', name: 'III João', testament: 'NT', category: 'cartas', chapters: 1 },
  { abbr: 'Jd', name: 'Judas', testament: 'NT', category: 'cartas', chapters: 1 },
  { abbr: 'Ap', name: 'Apocalipse', testament: 'NT', category: 'revel', chapters: 22 }
];

export const POPULAR_VERSES: Record<string, string[]> = {
  'Gn-1': [
    'No princípio, criou Deus os céus e a terra.',
    'A terra, porém, estava sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava por sobre as águas.',
    'Disse Deus: Haja luz; e houve luz.',
    'E viu Deus que a luz era boa; e fez separação entre a luz e as trevas.',
    'Chamou Deus à luz Dia e às trevas, Noite. Houve tarde e manhã, o primeiro dia.',
    'E disse Deus: Haja firmamento no meio das águas e separação entre águas e águas.',
    'Fez, pois, Deus o firmamento e separação entre as águas debaixo do firmamento e as águas sobre o firmamento. E assim se fez.',
    'E chamou Deus ao firmamento Céus. Houve tarde e manhã, o segundo dia.',
    'Disse também Deus: Ajuntem-se as águas debaixo dos céus num só lugar, e apareça a porção seca. E assim se fez.',
    'À porção seca chamou Deus Terra e ao ajuntamento das águas, Mares. E viu Deus que isso era bom.',
    'E disse Deus: Produza a terra relva, ervas que deem semente e árvores frutíferas que deem fruto segundo a sua espécie, cuja semente esteja nele, sobre a terra. E assim se fez.',
    'A terra, pois, produziu relva, ervas que davam semente segundo a sua espécie e árvores que davam fruto, cuja semente estava nele, segundo a sua espécie. E viu Deus que isso era bom.',
    'Houve tarde e manhã, o terceiro dia.',
    'Disse também Deus: Haja luzeiros no firmamento dos céus, para fazerem separação entre o dia e a noite; e sejam eles para sinais, para estações, para dias e anos.',
    'E sejam para luzeiros no firmamento dos céus, para alumiar a terra. E assim se fez.',
    'Fez Deus os dois grandes luzeiros: o maior para governar o dia, e o menor para governar a noite; e fez também as estrelas.',
    'E os colocou no firmamento dos céus para alumiarem a terra,',
    'para governarem o dia e a noite e fazerem separação entre a luz e as trevas. E viu Deus que isso era bom.',
    'Houve tarde e manhã, o quarto dia.',
    'Disse também Deus: Povoem-se as águas de enxames de seres viventes; e voem as aves sobre a terra, sob o firmamento dos céus.',
    'Criou, pois, Deus os grandes animais marinhos e todos os seres viventes que rastejam, os quais povoavam as águas, segundo as suas espécies; e todas as aves, segundo as suas espécies. E viu Deus que isso era bom.',
    'E Deus os abençoou, dizendo: Sede fecundos, multiplicai-vos e enchei as águas nos mares; e, na terra, se multipliquem as aves.',
    'Houve tarde e manhã, o quinto dia.',
    'Disse também Deus: Produza a terra seres viventes, conforme a sua espécie: animais domésticos, répteis e animais selváticos, segundo a sua espécie. E assim se fez.',
    'E fez Deus os animais selváticos, segundo a sua espécie, e os animais domésticos, conforme a sua espécie, e todos os répteis da terra, segundo a sua espécie. E viu Deus que isso era bom.',
    'Também disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; tenha ele domínio sobre os peixes do mar, sobre as aves dos céus, sobre os animais domésticos, sobre toda a terra e sobre todos os répteis que rastejam pela terra.',
    'Criou Deus, pois, o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou.',
    'E Deus os abençoou e lhes disse: Sede fecundos, multiplicai-vos, enchei a terra e sujeitai-a; dominai sobre os peixes do mar, sobre as aves dos céus e sobre todo animal que rasteja pela terra.',
    'E disse Deus ainda: Eis que vos tenho dado todas as ervas que dão semente e se acham na superfície de toda a terra e todas as árvores em que há fruto que dê semente; isso vos será para mantimento.',
    'E a todos os animais da terra, e a todas as aves dos céus, e a todos os répteis da terra, em que há fôlego de vida, toda erva verde lhes será para mantimento. E assim se fez.',
    'Viu Deus tudo quanto fizera, e eis que era muito bom. Houve tarde e manhã, o sexto dia.'
  ],
  'Sl-23': [
    'O SENHOR é o meu pastor; nada me faltará.',
    'Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;',
    'Refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.',
    'Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu cajado me consolam.',
    'Preparas-me uma mesa na presença dos meus adversários, unges-me a cabeça com óleo; o meu cálice transborda.',
    'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na Casa do SENHOR para todo o sempre.'
  ],
  'Sl-91': [
    'O que habita no esconderijo do Altíssimo e descansa à sombra do Onipotente',
    'Diz ao SENHOR: Meu refúgio e meu baluarte, Deus meu, em quem confio.',
    'Pois ele te livrará do laço do passarinheiro e da peste perniciosa.',
    'Cobrir-te-á com as suas penas, e, sob suas asas, estarás seguro; a sua verdade é broquel e escudo.',
    'Não te assustarás do terror noturno, nem da seta que voa de dia.'
  ],
  'Jo-3': [
    'Havia, entre os fariseus, um homem chamado Nicodemos, um dos principais dos judeus.',
    'Este, de noite, foi ter com Jesus e lhe disse: Rabi, sabemos que és Mestre vindo da parte de Deus; porque ninguém pode fazer estes sinais que tu fazes, se Deus não estiver com ele.',
    'A isto, respondeu Jesus: Em verdade, em verdade te digo que, se alguém não nascer de novo, não pode ver o reino de Deus.',
    'Perguntou-lhe Nicodemos: Como pode um homem nascer, sendo velho? Pode, porventura, voltar ao ventre materno e nascer segunda vez?',
    'Respondeu Jesus: Em verdade, em verdade te digo: quem não nascer da água e do Espírito não pode entrar no reino de Deus.',
    'Porque Deus amou ao mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.',
    'Porquanto Deus enviou o seu Filho ao mundo, não para que julgasse o mundo, mas para que o mundo fosse salvo por ele.'
  ],
  'Ap-14': [
    'Olhei, e eis o Cordeiro em pé sobre o monte Sião, e com ele cento e quarenta e quatro mil, tendo na fronte escrito o seu nome e o nome de seu Pai.',
    'Ouvi uma voz do céu como voz de muitas águas, como voz de grande trovão; também a voz que ouvi era como de harpistas tocando as suas harpas.',
    'Vi outro anjo voando pelo meio do céu, tendo um evangelho eterno para pregar aos que habitam sobre a terra, e a cada nação, e tribo, e língua, e povo,',
    'Dizendo, em grande voz: Temei a Deus e dai-lhe glória, pois é chegada a hora do seu juízo; e adorai aquele que fez o céu, e a terra, e o mar, e as fontes das águas.',
    'Seguiu-se outro anjo, o segundo, dizendo: Caiu, caiu a grande Babilônia que tem dado a beber a todas as nações do vinho da cólera da sua prostituição.',
    'Seguiu-se a estes outro anjo, o terceiro, dizendo, em grande voz: Se alguém adora a besta e a sua imagem e recebe a sua marca na fronte ou sobre a mão,',
    'Também esse beberá do vinho da cólera de Deus, preparado, sem mistura, do cálice da sua ira... Aqui está a perseverança dos santos, os que guardam os mandamentos de Deus e a fé em Jesus.'
  ]
};

/**
 * Resolves a Bible Song object directly from a standard ID like "bible-Gn-1-4"
 */
export function resolveBibleSongFromId(id: string): Song | null {
  if (!id || !id.startsWith('bible-')) return null;

  // Try checking localStorage cache first
  try {
    const cachedVerse = localStorage.getItem('projection_bible_verse');
    if (cachedVerse) {
      const parsed = JSON.parse(cachedVerse);
      if (parsed && parsed.id === id && parsed.lyrics) {
        return parsed;
      }
    }
    const currentSong = localStorage.getItem('projection_current_song');
    if (currentSong) {
      const parsed = JSON.parse(currentSong);
      if (parsed && parsed.id === id && parsed.lyrics) {
        return parsed;
      }
    }
  } catch (e) {}

  // Parse id: bible-[abbr]-[chapter]-[verse]
  const parts = id.replace('bible-', '').split('-');
  if (parts.length < 3) return null;

  const abbr = parts[0];
  const chapter = parseInt(parts[1], 10) || 1;
  const verse = parseInt(parts[2], 10) || 1;

  const book = BIBLE_BOOKS.find(b => b.abbr.toLowerCase() === abbr.toLowerCase()) || {
    abbr,
    name: abbr === 'Gn' ? 'Gênesis' : abbr,
    testament: 'AT' as const,
    category: 'lei' as const,
    chapters: 50
  };

  const key = `${book.abbr}-${chapter}`;
  let text = '';
  if (POPULAR_VERSES[key] && POPULAR_VERSES[key][verse - 1]) {
    text = POPULAR_VERSES[key][verse - 1];
  } else {
    text = `E viu Deus que a luz era boa; e fez separação entre a luz e as trevas. (Versículo ${verse})`;
  }

  const ref = `${book.name.toUpperCase()} ${chapter}:${verse} (ARA)`;

  return {
    id,
    collection_id: 'biblia',
    category: 'Bíblia',
    title: ref,
    lyrics: text,
    author: ref
  };
}
