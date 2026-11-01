import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
  }
  return fallback;
}

export async function setStoredJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
}

export const STORAGE_KEYS = {
  STATS: 'paper_trace_stats',
  WALLET: 'paper_trace_wallet',
  MATCH_HISTORY: 'paper_trace_match_history',
  CHARACTER_LOADOUT: 'paper_trace_character_loadout',
} as const;
