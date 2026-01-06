import { api } from './api';

export interface UserSettings {
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contact_details?: {
    phone?: string;
    alternate_email?: string;
  };
}

// Note: This assumes you'll create a settings endpoint on the backend
// For now, we'll use localStorage as a temporary solution
const SETTINGS_KEY = 'user_settings';

export function getSettings(): UserSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Future: When backend endpoint is available
// export async function getSettings(): Promise<UserSettings> {
//   const response = await api.get<UserSettings>('/settings');
//   return response.data;
// }

// export async function updateSettings(data: UserSettings): Promise<UserSettings> {
//   const response = await api.patch<UserSettings>('/settings', data);
//   return response.data;
// }

