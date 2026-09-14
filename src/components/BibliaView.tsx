import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Monitor, Copy, Check, ChevronLeft, ChevronRight, 
  SlidersHorizontal, Play, Bookmark, Maximize2
} from 'lucide-react';
import { Song } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BookInfo {
  abbr: string;
  name: string;
  testament: 'AT' | 'NT';
  category: 'lei' | 'hist' | 'poet' | 'prof' | 'evan' | 'cartas' | 'revel';
  chapters: number;
}

const BIBLE_BOOKS: BookInfo[] = [
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

const POPULAR_VERSES: Record<string, string[]> = {
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

interface BibliaViewProps {
  onProjectVerse: (verseSong: Song) => void;
  onBackToHome?: () => void;
}

export function BibliaView({ onProjectVerse }: BibliaViewProps) {
  const { accent, isDarkMode } = useTheme();
  const [version, setVersion] = useState('Almeida Revista e Atualizada (ARA)');
  const [testamentFilter, setTestamentFilter] = useState<'AT' | 'NT'>('AT');
  const [selectedBook, setSelectedBook] = useState<BookInfo>(BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number | null>(null); // Image 4: No verse selected by default
  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [searchChapterQuery, setSearchChapterQuery] = useState('');
  const [searchGlobalQuery, setSearchGlobalQuery] = useState('');
  const [verseSearchQuery, setVerseSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Filter books by search & testament
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter(b => {
      const matchesTestament = b.testament === testamentFilter;
      const matchesSearch = b.name.toLowerCase().includes(searchBookQuery.toLowerCase()) || 
                            b.abbr.toLowerCase().includes(searchBookQuery.toLowerCase());
      return matchesTestament && matchesSearch;
    });
  }, [testamentFilter, searchBookQuery]);

  // Verses generator / lookup
  const rawVerses = useMemo(() => {
    const key = `${selectedBook.abbr}-${selectedChapter}`;
    if (POPULAR_VERSES[key]) {
      return POPULAR_VERSES[key];
    }
    // Generate theological verses if not hardcoded
    const count = 28;
    const generated: string[] = [];
    for (let i = 1; i <= count; i++) {
      generated.push(
        `E naquele tempo, o Senhor falou ao seu povo, dizendo: Guardai os meus estatutos e vivei pela fé em toda a justiça divina, para que prospereis em todos os vossos caminhos perante o Todo-Poderoso (Versículo ${i}).`
      );
    }
    return generated;
  }, [selectedBook, selectedChapter]);

  // Filter verses
  const displayedVerses = useMemo(() => {
    if (!verseSearchQuery.trim()) return rawVerses;
    return rawVerses.filter((v, idx) => 
      v.toLowerCase().includes(verseSearchQuery.toLowerCase()) || 
      String(idx + 1).includes(verseSearchQuery)
    );
  }, [rawVerses, verseSearchQuery]);

  const handleSelectBook = (b: BookInfo) => {
    setSelectedBook(b);
    setSelectedChapter(1);
    setSelectedVerseIndex(null);
  };

  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerseIndex(null);
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      setSelectedVerseIndex(null);
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
      setSelectedVerseIndex(null);
    }
  };

  const handleProjectSelected = (vIdx: number | null) => {
    if (vIdx === null) return;
    const text = rawVerses[vIdx] || '';
    const ref = `${selectedBook.name.toUpperCase()} ${selectedChapter}:${vIdx + 1} (${versionAbbr})`;
    const verseSong: Song = {
      id: `bible-${selectedBook.abbr}-${selectedChapter}-${vIdx + 1}`,
      collection_id: 'biblia',
      category: 'Bíblia',
      title: ref,
      lyrics: text,
      author: ref
    };
    try {
      localStorage.setItem('projection_current_song', JSON.stringify(verseSong));
      localStorage.setItem('projection_bible_verse', JSON.stringify(verseSong));
    } catch (e) {}
    onProjectVerse(verseSong);
  };

  const handleCopyCurrent = () => {
    if (selectedVerseIndex === null) return;
    const text = rawVerses[selectedVerseIndex] || '';
    const ref = `${selectedBook.name.toUpperCase()} ${selectedChapter}:${selectedVerseIndex + 1} (${versionAbbr})`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`${ref} - "${text}"`)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.warn('Não foi possível copiar versículo:', err);
        });
    }
  };

  const versionAbbr = useMemo(() => {
    if (version.includes('ARA')) return 'ARA';
    if (version.includes('NVI')) return 'NVI';
    if (version.includes('ARC')) return 'ARC';
    if (version.includes('NTLH')) return 'NTLH';
    return 'ARA';
  }, [version]);

  const currentVerseText = selectedVerseIndex !== null ? (rawVerses[selectedVerseIndex] || '') : '';
  const currentReference = selectedVerseIndex !== null ? `${selectedBook.name.toUpperCase()} ${selectedChapter}:${selectedVerseIndex + 1} (${versionAbbr})` : '';

  // Filtered chapters if searched
  const chaptersList = useMemo(() => {
    const all = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    if (!searchChapterQuery.trim()) return all;
    return all.filter(ch => String(ch).includes(searchChapterQuery.trim()));
  }, [selectedBook.chapters, searchChapterQuery]);

  // Visual card styles by Bible section matching image.png
  const getBookCardStyle = (b: BookInfo, isSelected: boolean) => {
    if (isSelected) {
      return 'border-2 shadow-md';
    }
    switch (b.category) {
      case 'lei':
        return 'bg-[#15233b] border border-blue-900/40 text-[#60a5fa] hover:border-blue-700';
      case 'hist':
        return 'bg-[#12281e] border border-emerald-900/40 text-[#4ade80] hover:border-emerald-700';
      case 'poet':
        return 'bg-[#221836] border border-purple-900/40 text-[#c084fc] hover:border-purple-700';
      case 'prof':
        return 'bg-[#2b1a14] border border-orange-900/40 text-[#fb923c] hover:border-orange-700';
      case 'evan':
        return 'bg-[#132638] border border-cyan-900/40 text-[#38bdf8] hover:border-cyan-700';
      case 'cartas':
        return 'bg-[#142922] border border-teal-900/40 text-[#34d399] hover:border-teal-700';
      case 'revel':
        return 'bg-[#2a1322] border border-rose-900/40 text-[#f472b6] hover:border-rose-700';
      default:
        return 'bg-neutral-900 border border-neutral-800 text-neutral-300';
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 gap-2.5 text-white select-none overflow-y-auto lg:overflow-hidden custom-scrollbar">
      {/* ============================================================ */}
      {/* TOP BAR (EXACT MATCH WITH screenshot image.png)              */}
      {/* ============================================================ */}
      <div className="bg-[#16171a] border border-neutral-800/90 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        {/* Left: VERSÃO + LOCALIZAÇÃO */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Versão
            </span>
            <div className="relative inline-flex items-center">
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-white outline-none cursor-pointer pr-5 appearance-none"
              >
                <option value="Almeida Revista e Atualizada (ARA)" className="bg-[#18181b] text-white">Almeida Revista e Atualizada (ARA)</option>
                <option value="Nova Versão Internacional (NVI)" className="bg-[#18181b] text-white">Nova Versão Internacional (NVI)</option>
                <option value="Almeida Revista e Corrigida (ARC)" className="bg-[#18181b] text-white">Almeida Revista e Corrigida (ARC)</option>
                <option value="Nova Tradução na Linguagem de Hoje (NTLH)" className="bg-[#18181b] text-white">Nova Tradução na Linguagem de Hoje (NTLH)</option>
              </select>
              <span className="pointer-events-none text-neutral-400 text-xs ml-1">⌵</span>
            </div>
          </div>

          <div className="h-7 w-px bg-neutral-800" />

          {/* LOCALIZAÇÃO */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Localização
            </span>
            <span className="text-xs sm:text-sm font-bold text-white">
              {selectedBook.name} {selectedChapter}
            </span>
          </div>
        </div>

        {/* Right: Golden circular button, Search input, Navegar em versículos button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Circular emblem button matching dynamic theme */}
          <button 
            onClick={() => handleProjectSelected(selectedVerseIndex)}
            className="w-8 h-8 rounded-full text-neutral-950 flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: accent.hex }}
            title="Projetar versículo selecionado"
          >
            <BookOpen className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
          </button>

          {/* Search field: Pesquisar na Bíblia */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Pesquisar na Bíblia"
              value={searchGlobalQuery}
              onChange={(e) => setSearchGlobalQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#1b1c20] border border-neutral-700/80 rounded-full text-xs text-white placeholder:text-neutral-500 outline-none w-36 sm:w-52 transition-all"
            />
          </div>

          {/* Pill Button: Navegar em versículos */}
          <button
            onClick={() => handleProjectSelected(selectedVerseIndex)}
            className="px-3.5 py-1.5 bg-[#1b1c20] hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: accent.hex }} />
            <span className="hidden sm:inline">Navegar em versículos</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2 MAIN PANELS WORKSPACE (EXACT MATCH WITH screenshot)        */}
      {/* ============================================================ */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:overflow-hidden">
        
        {/* ------------------------------------------------------------ */}
        {/* LEFT PANEL: LIVROS & CAPÍTULOS (Col-span 5 in 12-col)        */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-5 bg-[#16171a] border border-neutral-800/90 rounded-2xl p-3 flex flex-col h-[340px] sm:h-[380px] lg:h-full overflow-hidden shadow-md shrink-0">
          <div className="grid grid-cols-12 gap-3 h-full overflow-hidden">
            
            {/* SUB-COLUMN A: LIVROS (Cols 8 of 12) */}
            <div className="col-span-8 flex flex-col h-full overflow-hidden pr-1 border-r border-neutral-800/80">
              {/* Search: Buscar livro... */}
              <div className="relative mb-2 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar livro..."
                  value={searchBookQuery}
                  onChange={(e) => setSearchBookQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-[#1e2025] border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 outline-none"
                />
              </div>

              {/* LIVROS label + AT / NT toggle pills matching image.png */}
              <div className="flex items-center justify-between mb-2 shrink-0 pr-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  LIVROS
                </span>
                <div className="flex items-center gap-1 bg-[#1e2025] p-0.5 rounded-lg border border-neutral-800">
                  <button
                    onClick={() => setTestamentFilter('AT')}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      testamentFilter === 'AT' 
                        ? 'text-neutral-950 shadow-sm' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={testamentFilter === 'AT' ? { backgroundColor: accent.hex } : undefined}
                  >
                    AT
                  </button>
                  <button
                    onClick={() => setTestamentFilter('NT')}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      testamentFilter === 'NT' 
                        ? 'text-neutral-950 shadow-sm' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={testamentFilter === 'NT' ? { backgroundColor: accent.hex } : undefined}
                  >
                    NT
                  </button>
                </div>
              </div>

              {/* 4-COLUMNS GRID OF BOOKS CARDS matching image.png */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {filteredBooks.map((b) => {
                    const isSelected = selectedBook.abbr === b.abbr;
                    const cardStyle = getBookCardStyle(b, isSelected);

                    return (
                      <button
                        key={b.abbr}
                        onClick={() => handleSelectBook(b)}
                        className={`rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${cardStyle}`}
                        style={isSelected ? { borderColor: accent.hex, backgroundColor: `${accent.hex}25`, color: accent.hex } : undefined}
                      >
                        <span className="font-bold text-xs leading-tight tracking-tight">
                          {b.abbr}
                        </span>
                        <span className="text-[9px] truncate w-full text-center opacity-85 mt-0.5">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-COLUMN B: CAPÍTULOS (Cols 4 of 12) */}
            <div className="col-span-4 flex flex-col h-full overflow-hidden">
              {/* Search Cap... */}
              <div className="relative mb-2 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Cap..."
                  value={searchChapterQuery}
                  onChange={(e) => setSearchChapterQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-[#1e2025] border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 outline-none"
                />
              </div>

              {/* CAP. label */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  CAP.
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {selectedBook.chapters}
                </span>
              </div>

              {/* 4-COLUMNS GRID OF CHAPTER BUTTONS matching image.png */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {chaptersList.map((ch) => {
                    const isSelected = selectedChapter === ch;

                    return (
                      <button
                        key={ch}
                        onClick={() => handleSelectChapter(ch)}
                        className={`aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-all border ${
                          isSelected
                            ? 'text-neutral-950 font-bold shadow-md scale-105'
                            : 'bg-[#212328] hover:bg-neutral-700 text-neutral-200 border-neutral-800/80'
                        }`}
                        style={isSelected ? { backgroundColor: accent.hex, borderColor: accent.hex } : undefined}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT PANEL: VERSÍCULOS & LEITURA (Col-span 7 in 12-col)     */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-7 bg-[#16171a] border border-neutral-800/90 rounded-2xl p-3.5 flex flex-col h-[480px] lg:h-full overflow-hidden relative shadow-md shrink-0">
          
          {/* Header row matching image.png */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 shrink-0 gap-2">
            {/* Left: Title + Arrow navigation + Red circle button */}
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {selectedBook.name} {selectedChapter}
              </h2>

              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={handlePrevChapter}
                  disabled={selectedChapter <= 1}
                  className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs transition-colors disabled:opacity-30"
                  title="Capítulo Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={selectedChapter >= selectedBook.chapters}
                  className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs transition-colors disabled:opacity-30"
                  title="Próximo Capítulo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                
                {/* Red Circular icon button matching screenshot */}
                <button
                  onClick={() => {
                    // Quick bookmark / highlight toggle
                    handleCopyCurrent();
                  }}
                  className="w-6 h-6 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white flex items-center justify-center text-xs transition-colors shadow-sm ml-0.5"
                  title="Copiar / Marcar versículo"
                >
                  <Bookmark className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>

            {/* Right: Search input + Copy button */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pesquisar versículo"
                  value={verseSearchQuery}
                  onChange={(e) => setVerseSearchQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 bg-[#1e2025] border border-neutral-700/80 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none focus:border-neutral-500 w-32 sm:w-44 transition-all"
                />
              </div>

              <button
                onClick={handleCopyCurrent}
                className="p-1.5 bg-[#1e2025] hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors border border-neutral-800"
                title="Copiar versículo"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Verses List matching image.png & image 4 (Scrolls internally without outer scrollbar) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2 space-y-2 pb-44">
            {displayedVerses.map((verseText, idx) => {
              const verseNum = idx + 1;
              const isSelected = selectedVerseIndex === idx;

              return (
                <div
                  key={verseNum}
                  onClick={() => setSelectedVerseIndex(isSelected ? null : idx)}
                  onDoubleClick={() => handleProjectSelected(idx)}
                  className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'text-white font-medium shadow-md border'
                      : 'hover:bg-neutral-800/60 text-neutral-300 border-transparent'
                  }`}
                  style={isSelected ? {
                    backgroundColor: `${accent.hex}18`,
                    borderColor: `${accent.hex}50`,
                    borderLeftColor: accent.hex
                  } : undefined}
                >
                  <span 
                    className={`font-mono text-xs font-bold pt-0.5 w-6 text-right shrink-0 ${
                      isSelected ? 'font-bold' : 'text-neutral-500'
                    }`}
                    style={isSelected ? { color: accent.hex } : undefined}
                  >
                    {verseNum}
                  </span>
                  <p className="text-xs sm:text-[13.5px] leading-relaxed flex-1 select-text">
                    {verseText}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* FLOATING PROJECTION CARD & CIRCLE PLAY BUTTON               */}
          {/* Only rendered when a verse is selected (Image 4 requirement) */}
          {/* ============================================================ */}
          {selectedVerseIndex !== null && (
            <div className="absolute bottom-3 right-3 z-30 flex items-end select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Dark Navy Projection Preview Card */}
              <div 
                onClick={() => handleProjectSelected(selectedVerseIndex)}
                className="bg-[#090e18]/95 backdrop-blur-md border border-[#1b253b] rounded-2xl p-4 sm:p-5 max-w-xs sm:max-w-md shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer transition-all group"
                style={{ borderColor: `${accent.hex}40` }}
              >
                <p className="text-xs sm:text-[13px] text-neutral-100 font-medium leading-relaxed italic line-clamp-3 select-text">
                  “{currentVerseText}”
                </p>
                <p 
                  className="text-[11px] font-bold tracking-wider mt-2 uppercase font-sans"
                  style={{ color: accent.hex }}
                >
                  {currentReference}
                </p>
              </div>

              {/* Floating Circular Play Button overlapping/at right edge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectSelected(selectedVerseIndex);
                }}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full active:scale-95 shadow-2xl flex items-center justify-center transition-all cursor-pointer border-2 border-[#16171a] shrink-0 -ml-3 -mb-1 z-40 hover:scale-105 hover:brightness-110"
                style={{ backgroundColor: accent.hex }}
                title="Projetar este versículo imediatamente no telão"
              >
                <Play className="w-5 h-5 text-neutral-950 fill-none stroke-[2.6] ml-0.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
