import { CharacterId } from '../types/game';
import {
  DEFAULT_CHARACTER_LOADOUT,
  sanitizeCharacterLoadout,
} from '../constants/characters';
import { getStoredJson, setStoredJson, STORAGE_KEYS } from './storage';

export type CharacterLoadout = CharacterId[];

export async function getSavedCharacterLoadout(): Promise<CharacterLoadout> {
  const stored = await getStoredJson<unknown>(STORAGE_KEYS.CHARACTER_LOADOUT, null);
  const loadout = sanitizeCharacterLoadout(stored ?? DEFAULT_CHARACTER_LOADOUT);

  // Migrate legacy ids (phantom/blitz/fortress) in storage.
  if (stored !== null && JSON.stringify(stored) !== JSON.stringify(loadout)) {
    await setStoredJson(STORAGE_KEYS.CHARACTER_LOADOUT, loadout);
  }

  return loadout;
}

export async function saveCharacterLoadout(loadout: CharacterLoadout): Promise<void> {
  await setStoredJson(STORAGE_KEYS.CHARACTER_LOADOUT, sanitizeCharacterLoadout(loadout));
}
