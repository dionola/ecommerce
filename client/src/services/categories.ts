import { api } from './api';

export async function getCategories(): Promise<string[]> {
  const response = await api.get<string[]>('/products/categories');
  return response.data;
}

