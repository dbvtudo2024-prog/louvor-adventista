import { Collection, Song } from './types';

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'hinario', name: 'Hinário Adventista', icon: 'church', description: 'Hinos tradicionais da IASD' },
  { id: 'ja', name: 'CDs Jovens', icon: 'music', description: 'Músicas de Jovens Adventistas' },
  { id: 'coletaneas', name: 'Coletâneas Diversas', icon: 'library', description: 'Grupos e solistas' },
  { id: 'doxologia', name: 'Doxologia', icon: 'scroll', description: 'Cânticos de adoração' },
  { id: 'infantil', name: 'Músicas Infantis', icon: 'baby', description: 'Para os pequenos' },
];

export const MOCK_SONGS: Song[] = [
  {
    id: '1',
    collection_id: 'hinario',
    number: 1,
    title: 'Ó Deus de Amor',
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
    collection_id: 'ja',
    title: 'Brilhar por Ti',
    lyrics: `Às vezes parece que o sol não vai brilhar
E a escuridão quer me desanimar
Mas eu sei que Tu estás comigo
És meu porto seguro, meu melhor amigo.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    collection_id: 'coletaneas',
    title: 'Vaso de Alabastro',
    lyrics: `Vim para adorar-Te, vim para dizer
Que Tu és o meu Deus, o meu Salvador
Como o vaso de alabastro que se quebrou
Minha vida entrego em Teu altar, Senhor.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4',
    collection_id: 'doxologia',
    title: 'A Deus Supremo Benfeitor',
    lyrics: `A Deus, supremo Benfeitor,
Vós, anjos e homens, dai louvor;
A Deus o Filho, a Deus o Pai,
E a Deus Espírito, glória dai. Amém.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  }
];
