import { Collection, Song } from './types';

export const TUDO_POR_ELE_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230b1c33"/><path d="M70 85 C65 70, 45 70, 40 85 C35 100, 70 125, 70 125 C70 125, 105 100, 100 85 C95 70, 75 70, 70 85 Z" fill="%23ef4444" opacity="0.4"/><text x="100" y="70" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="white" text-anchor="middle" letter-spacing="-0.5">TUDO</text><text x="100" y="112" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="%23ef4444" text-anchor="middle" letter-spacing="1">POR</text><text x="100" y="156" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" letter-spacing="-0.5">ELE</text></svg>`;

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876', name: 'Hinário Adventista', icon: 'church', description: 'Hinos tradicionais da IASD' },
  { id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef', name: 'CDs Jovens', icon: 'music', description: 'Músicas de Jovens Adventistas' },
  { id: '98765432-10fe-4cba-b876-543210fedcba', name: 'Coletâneas Diversas', icon: 'library', description: 'Grupos e solistas' },
  { id: '12345678-90ab-4def-b234-567890abcdef', name: 'Doxologia', icon: 'scroll', description: 'Cânticos de adoração' },
  { id: 'abcdef01-2345-4789-abcd-ef0123456789', name: 'Músicas Infantis', icon: 'baby', description: 'Para os pequenos' },
];

export const MOCK_SONGS: Song[] = [
  // ==========================================
  // HINÁRIO ADVENTISTA
  // ==========================================
  {
    id: 'ha-1',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 1,
    title: 'Ó Deus de Amor',
    duration: '3:20',
    lyrics: `1. Ó Deus de amor, nós Te adoramos,
E Teu poder aqui louvamos;
Tu és o Rei, o Criador,
O nosso Deus e Salvador.

Coro:
Glória a Deus! Glória a Deus!
Cantem os anjos lá nos Céus;
Glória a Deus! Glória a Deus!
Cantem os filhos Seus.

2. Tua bondade sempiterna,
Com terno amor nos cerca e governa;
Deste-nos paz, perdão e luz,
Por Teu amor, por Teu Jesus.

3. Com grato e puro coração,
Rendemos hoje a adoração;
Sê nosso Guia, ó Deus sem par,
Até no Céu podermos entrar.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'ha-2',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 2,
    title: 'Ó Adorai o Senhor',
    duration: '2:45',
    lyrics: `1. Ó adorai o Senhor na beleza
Da santidade que vem lá dos Céus!
Dizei na terra com viva firmeza:
"Digno de glória e honra é o Deus!"

2. Aos Seus altares trazei com fervor
Vossas ofertas de grato louvor;
Pois Ele é santo, benigno e fiel,
Nosso refúgio, Emanuel!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'ha-12',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 12,
    title: 'Santo! Santo! Santo!',
    duration: '3:50',
    lyrics: `1. Santo! Santo! Santo! Deus onipotente!
Cedo de manhã cantaremos Teu louvor;
Santo! Santo! Santo! Justo e compassivo!
Deus soberano, excelso Criador!

2. Santo! Santo! Santo! Todos os remidos,
Junto com os anjos, proclamam Teu louvor;
Antes de formar-se o firmamento e a terra,
Eras, e sempre és, e hás de ser, Senhor!

3. Santo! Santo! Santo! Nós os pecadores,
Não podemos ver Tua glória sem temor;
Tu somente és Santo! Não há outro igual,
Puro e perfeito, nosso Benfeitor!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'ha-33',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 33,
    title: 'Castelo Forte',
    duration: '3:40',
    lyrics: `1. Castelo forte é nosso Deus,
Espada e bom escudo;
Com Seu poder defende os Seus
Em todo transe agudo.
Com fúria e com furor
Nos cerca o tentador;
Com astúcia e alvitres maus
Promove dor e caos;
Na Terra não há seu igual.

2. Se nos pudéssemos valer
Da nossa própria força,
Teríamos de perecer;
Mas Deus não nos destroça.
Sabeis quem é Jesus?
O que morreu na cruz!
Senhor dos altos Céus,
E sendo o próprio Deus,
Triunfa na batalha!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'ha-232',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 232,
    title: 'Chuvas de Graça',
    duration: '3:15',
    lyrics: `1. Chuvas de graça teremos,
É a promessa de Deus;
Tempos benditos veremos,
Sinais que nos vêm lá dos Céus.

Coro:
Chuvas de graça,
Chuvas pedimos, Senhor!
Manda-nos já chuvas mansas,
Pelo Teu grande amor!

2. Chuvas de graça teremos,
Vida de paz e perdão;
Gratos tributos daremos
Ao nosso fiel Redentor.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'ha-400',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 400,
    title: 'Maranata! Jesus Vem!',
    duration: '3:30',
    lyrics: `1. Breve Jesus há de vir com poder,
Para os fiéis com amor acolher;
Lá não haverá mais pranto nem dor,
Maranata! Louvai ao Senhor!

Coro:
Maranata! Jesus breve vem!
Maranata! Nas nuvens além!
Com grande glória e poder triunfal,
Para o Seu reino de luz celestial!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'ha-575',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 575,
    title: 'Quase no Lar',
    duration: '4:10',
    lyrics: `1. Olho além, bem vejo a pátria,
Onde a dor não mais terá lugar;
Lá Jesus com braços abertos
Seus remidos vai abençoar.

Coro:
Quase no lar! Quase no lar!
Peregrinos, não desanimar!
Eis que a noite já vai terminando,
Breve a glória iremos cantar!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },

  // ==========================================
  // COLETÂNEAS DIVERSAS
  // ==========================================
  {
    id: 'col-1',
    collection_id: '98765432-10fe-4cba-b876-543210fedcba',
    number: 1,
    title: 'Vaso de Alabastro',
    duration: '4:45',
    lyrics: `Vim para adorar-Te, vim para dizer
Que Tu és o meu Deus, o meu Salvador.
Como o vaso de alabastro que se quebrou,
Minha vida entrego em Teu altar, Senhor.

Coro:
Quebranta meu coração,
Derrama Tua santa unção;
Tudo o que sou entrego a Ti,
Meu Jesus, vive em mim!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'col-2',
    collection_id: '98765432-10fe-4cba-b876-543210fedcba',
    number: 2,
    title: 'Raridade',
    duration: '4:30',
    lyrics: `Não consigo ir além do Teu olhar
Tudo o que eu consigo é olhar pra Ti
Chego a me esquecer de quem eu sou
Quando estou aqui diante do Teu amor.

Coro:
Você é um espelho que reflete a imagem do Senhor
Não chore se o mundo ainda não notou
Você é uma preciosidade do Senhor!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'col-3',
    collection_id: '98765432-10fe-4cba-b876-543210fedcba',
    number: 3,
    title: 'Descansar',
    duration: '4:15',
    lyrics: `Não quero viver preocupado com o amanhã
Se Deus veste os lírios do campo com tanto esplendor
Se até os passarinhos Ele alimenta com amor
Descansarei em Seus braços, meu Criador.

Coro:
Descansar nos braços do Pai,
Descansar e confiar na Sua voz;
Ele cuida de tudo, Ele é fiel,
Meu refúgio seguro, Rei de Israel!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'col-4',
    collection_id: '98765432-10fe-4cba-b876-543210fedcba',
    number: 4,
    title: 'Porque Ele Vive',
    duration: '3:55',
    lyrics: `Deus enviou Seu Filho amado
Para salvar e perdoar;
Na cruz morreu por meu pecado,
Mas ressurgiu e vivo com o Pai está!

Coro:
Porque Ele vive, posso crer no amanhã,
Porque Ele vive, temor não há;
Mas eu bem sei, eu sei, que a minha vida
Está nas mãos do meu Jesus, que vivo está!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },

  // ==========================================
  // MÚSICAS INFANTIS
  // ==========================================
  {
    id: 'inf-1',
    collection_id: 'abcdef01-2345-4789-abcd-ef0123456789',
    number: 1,
    title: 'Três Palavrinhas',
    duration: '2:10',
    lyrics: `Três palavrinhas só,
Eu aprendi de cor:
Deus é amor!
Trá-lá-lá-lá-lá-lá-lá-lá!

Deus é amor,
No meu coração;
Três palavrinhas só,
Com muita gratidão!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'inf-2',
    collection_id: 'abcdef01-2345-4789-abcd-ef0123456789',
    number: 2,
    title: 'Pedro, Tiago e João no Barquinho',
    duration: '2:30',
    lyrics: `Pedro, Tiago, João no barquinho,
Pedro, Tiago, João no barquinho,
Pedro, Tiago, João no barquinho,
No mar da Galileia.

Puxaram a rede, mas não veio peixe,
Puxaram a rede, mas não veio peixe,
No mar da Galileia.

Jesus mandou jogar do outro lado,
Jesus mandou jogar do outro lado,
Puxaram a rede cheia de peixinhos!
No mar da Galileia!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'inf-3',
    collection_id: 'abcdef01-2345-4789-abcd-ef0123456789',
    number: 3,
    title: 'Cristo Ama as Criancinhas',
    duration: '2:15',
    lyrics: `Cristo ama as criancinhas
Deste mundo ao redor;
Quer vermelhas, quer morenas,
Todas têm o Seu amor;
Cristo ama as criancinhas com ardor!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },

  // ==========================================
  // DOXOLOGIA
  // ==========================================
  {
    id: 'dox-1',
    collection_id: '12345678-90ab-4def-b234-567890abcdef',
    number: 1,
    title: 'A Deus Supremo Benfeitor',
    duration: '2:15',
    lyrics: `A Deus, supremo Benfeitor,
Vós, anjos e homens, dai louvor;
A Deus o Filho, a Deus o Pai,
E a Deus Espírito, glória dai. Amém.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'dox-2',
    collection_id: '12345678-90ab-4def-b234-567890abcdef',
    number: 2,
    title: 'Glória ao Pai',
    duration: '2:00',
    lyrics: `Glória ao Pai, e ao Filho, e ao Espírito Santo,
Como era no princípio, agora e para sempre,
Pelos séculos dos séculos. Amém!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },

  // ==========================================
  // CDS JOVENS
  // ==========================================
  {
    id: 'tpe-1',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 1,
    title: 'Tudo por Ele',
    duration: '4:52',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `Tudo por Ele
Os Céus proclamam as obras do Eterno
Galáxias cantam de Sua imensidão
E uma voz com sons de glória
Ecoa em toda a criação
Do grão que faz a vida irromper
O esplendor invisível faz nascer
E uma voz com sons de glória
Ecoa em nosso coração
Diante dEle nos rendemos
É tudo por Ele tudo por Ele
A Ele, a glória e para sempre
É tudo por Ele tudo por Ele
Em oração e na palavra seguiremos`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'tpe-2',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 2,
    title: 'Maranata',
    duration: '5:59',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `O Senhor logo vem, as promessas se cumprem
Os sinais pelo mundo nos mostram a luz
Maranata, ora vem Senhor Jesus!
Maranata, nossa esperança reluz!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'tpe-3',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 3,
    title: 'Lugar Secreto',
    duration: '4:36',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `No silêncio da alma eu Te busco, Senhor
No secreto do quarto encontro Teu amor
Tua presença me acalma, renova o meu ser
No Teu santo esconderijo eu quero viver.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'tpe-4',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 4,
    title: 'Medley da Fé',
    duration: '9:06',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `Firme nas promessas do meu Salvador
Cantarei louvores ao meu Criador
Grandioso és Tu, meu Deus e Senhor
Toda glória a Ti para sempre, ó Pai de amor!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'tpe-5',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 5,
    title: 'Rumo ao Lar',
    duration: '3:58',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `Caminhando na luz, guiados pela fé
Nosso porto seguro em Cristo está de pé
Rumo à Pátria Celeste vamos com fervor
Brevemente veremos o nosso Senhor!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'tpe-6',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 6,
    title: 'Vale a Pena',
    duration: '4:12',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `Vale a pena servir, vale a pena amar
Vale a pena a cruz com coragem levar
A coroa da vida nos céus nos espera
O amor de Jesus tudo regenera.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'ja-2022',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Eu vou',
    year: 2022,
    number: 1,
    title: 'Eu Vou',
    duration: '4:15',
    lyrics: `Ao clamor das nações responderei
Com a força do alto partirei
Eu vou anunciar que Cristo vem
Levar a esperança a quem não tem!`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  }
];
