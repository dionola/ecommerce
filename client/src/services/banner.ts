import { api } from './api';

export interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category: string | null;
  button_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateBannerData {
  title?: string;
  description?: string;
  image_url?: string;
  category?: string | null;
  button_text?: string | null;
}

export async function getBanner(): Promise<Banner> {
  const response = await api.get<Banner>('/banner');
  return response.data;
}

export async function updateBanner(data: UpdateBannerData): Promise<Banner> {
  const response = await api.patch<Banner>('/banner', data);
  return response.data;
}







