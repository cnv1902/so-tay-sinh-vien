export interface News {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  author_id: number;
  created_at: string;
}
