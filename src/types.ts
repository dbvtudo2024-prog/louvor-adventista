export interface Collection {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Song {
  id: string;
  collection_id: string;
  album_name?: string;
  year?: number;
  number?: number;
  title: string;
  lyrics: string;
  audio_url?: string;
  author?: string;
}

export interface Favorite {
  user_id: string;
  song_id: string;
}
