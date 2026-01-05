import apiRequest from './api';

export async function getCategories(): Promise<string[]> {
  return apiRequest<string[]>('/products/categories');
}

