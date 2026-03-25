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
  // Tracks from Image 2: CD "Tudo por Ele"
  {
    id: 'tpe-1',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Tudo por Ele',
    year: 2024,
    number: 1,
    title: 'Tudo por Ele',
    duration: '4:52',
    cover_url: TUDO_POR_ELE_COVER,
    lyrics: `Tudo por Ele, por Sua graça e amor
Minha vida entrego em louvor ao Salvador
Em cada passo, em cada oração
Tudo por Ele em meu coração.

Coro:
Tudo por Cristo, meu Rei e Senhor
Tudo por Ele, sublime Redentor!`,
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
    id: '1',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    number: 1,
    title: 'Ó Deus de Amor',
    duration: '3:20',
    lyrics: `Ó Deus de amor, nós Te adoramos,
E Teu poder aqui louvamos;
Tu és o Rei, o Criador,
O nosso Deus e Salvador.

Coro:
Glória a Deus! Glória a Deus!
Cantem os anjos lá nos Céus;
Glória a Deus! Glória a Deus!
Cantem os filhos Seus.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2',
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    album_name: 'Brilhar por Ti',
    year: 2022,
    number: 1,
    title: 'Brilhar por Ti',
    duration: '4:15',
    lyrics: `Às vezes parece que o sol não vai brilhar
E a escuridão quer me desanimar
Mas eu sei que Tu estás comigo
És meu porto seguro, meu melhor amigo.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    collection_id: '98765432-10fe-4cba-b876-543210fedcba',
    title: 'Vaso de Alabastro',
    duration: '4:45',
    lyrics: `Vim para adorar-Te, vim para dizer
Que Tu és o meu Deus, o meu Salvador
Como o vaso de alabastro que se quebrou
Minha vida entrego em Teu altar, Senhor.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4',
    collection_id: '12345678-90ab-4def-b234-567890abcdef',
    number: 1,
    title: 'A Deus Supremo Benfeitor',
    duration: '2:15',
    lyrics: `A Deus, supremo Benfeitor,
Vós, anjos e homens, dai louvor;
A Deus o Filho, a Deus o Pai,
E a Deus Espírito, glória dai. Amém.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  }
];
