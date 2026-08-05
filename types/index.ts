export interface Project {
  id: string;
  user_id: string;
  title: string;
  genre: 'drama' | 'comedy' | 'action' | 'romance' | 'documentary' | 'thriller';
  answer_name: string | null;
  answer_before: string | null;
  answer_turning_point: string | null;
  answer_now: string | null;
  answer_movie_title: string | null;
  status: 'draft' | 'uploading' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  project_id: string;
  storage_key: string;
  position: number;
  uploaded_at: string;
}

export interface RenderJob {
  id: string;
  project_id: string;
  type: 'free_trailer' | 'full_movie' | 'poster';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_url: string | null;
  error_message: string | null;
  cost_cents: number;
  created_at: string;
  completed_at: string | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  project_id: string;
  tier: 'full_movie' | 'poster' | 'bundle';
  stripe_payment_id: string | null;
  amount_cents: number;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
}

export interface Beat {
  kind: 'title_card' | 'narration' | 'caption' | 'music_swell' | 'silence';
  text: string;
  duration: number;
  photo_index: number | null;
  emotion: string;
}
