import type { Category } from './category';

export type Thing = {
    id: string;
    label: string;
    category?: Category;
  };
