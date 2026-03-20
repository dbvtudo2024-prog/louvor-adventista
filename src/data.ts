import { Collection, Song } from './types';

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876', name: 'Hinário Adventista', icon: 'church', description: 'Hinos tradicionais da IASD' },
  { id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef', name: 'CDs Jovens', icon: 'music', description: 'Músicas de Jovens Adventistas' },
  { id: '98765432-10fe-4cba-b876-543210fedcba', name: 'Coletâneas Diversas', icon: 'library', description: 'Grupos e solistas' },
  { id: '12345678-90ab-4def-b234-567890abcdef', name: 'Doxologia', icon: 'scroll', description: 'Cânticos de adoração' },
  { id: 'abcdef01-2345-4789-abcd-ef0123456789', name: 'Músicas Infantis', icon: 'baby', description: 'Para os pequenos' },
];

export const MOCK_SONGS: Song[] = [
  {
    id: '1',
    collection_id: 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
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
    collection_id: 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    title: 'Brilhar por Ti',
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
    lyrics: `Vim para adorar-Te, vim para dizer
Que Tu és o meu Deus, o meu Salvador
Como o vaso de alabastro que se quebrou
Minha vida entrego em Teu altar, Senhor.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4',
    collection_id: '12345678-90ab-4def-b234-567890abcdef',
    title: 'A Deus Supremo Benfeitor',
    lyrics: `A Deus, supremo Benfeitor,
Vós, anjos e homens, dai louvor;
A Deus o Filho, a Deus o Pai,
E a Deus Espírito, glória dai. Amém.`,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  }
];
