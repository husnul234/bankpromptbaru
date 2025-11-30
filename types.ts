export interface Prompt {
  id: string;
  title: string;
  category: string;
  prompts: string; // The long text
  created_at: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  id?: string;
}

export type SortOption = 'newest' | 'oldest' | 'az';
