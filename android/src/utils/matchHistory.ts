import { MatchRecord } from '../types/history';
import { getStoredJson, setStoredJson, STORAGE_KEYS } from './storage';

const MAX_MATCH_HISTORY = 50;

export async function getMatchHistory(): Promise<MatchRecord[]> {
  return getStoredJson<MatchRecord[]>(STORAGE_KEYS.MATCH_HISTORY, []);
}

export async function appendMatchRecord(record: MatchRecord): Promise<void> {
  const history = await getMatchHistory();
  const updated = [record, ...history].slice(0, MAX_MATCH_HISTORY);
  await setStoredJson(STORAGE_KEYS.MATCH_HISTORY, updated);
}

export async function clearMatchHistory(): Promise<void> {
  await setStoredJson(STORAGE_KEYS.MATCH_HISTORY, []);
}
