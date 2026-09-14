export interface Collection {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface SlideData {
  id: string;
  primaryText: string;
  auxiliaryText?: string;
  align?: 'left' | 'center' | 'right';
  textColor?: string;
  textSize?: number; // e.g. 18 for 18%
  auxColor?: string;
  auxSize?: number; // e.g. 10 for 10%
  bgColor?: string;
  bgImage?: string;
  bgTransparent?: boolean;
}

export interface Song {
  id: string;
  collection_id: string;
  album_name?: string;
  year?: number | string;
  number?: number;
  title: string;
  lyrics: string;
  audio_url?: string;
  cover_url?: string;
  author?: string;
  duration?: string;
  category?: string;
  is_custom?: boolean;
  slides?: SlideData[];
}

export interface Favorite {
  user_id: string;
  song_id: string;
}

export interface LiturgySubItem {
  id: string;
  title: string;
  durationMin?: number;
  song?: Song;
  speakerOrLeader?: string;
  completed?: boolean;
}

export interface LiturgyCategory {
  id: string;
  name: string;
  items: LiturgySubItem[];
  startTime?: string;
  endTime?: string;
  notes?: string;
}
