import { PlayerWallet } from '../types/game';
import { getStoredJson, setStoredJson, STORAGE_KEYS } from './storage';

export const EMPTY_WALLET: PlayerWallet = { gold: 0, silver: 0, money: 0 };

export async function getWallet(): Promise<PlayerWallet> {
  return getStoredJson<PlayerWallet>(STORAGE_KEYS.WALLET, EMPTY_WALLET);
}

export async function saveWallet(wallet: PlayerWallet): Promise<void> {
  await setStoredJson(STORAGE_KEYS.WALLET, wallet);
}

export async function addToWallet(earnings: PlayerWallet): Promise<PlayerWallet> {
  const current = await getWallet();
  const updated: PlayerWallet = {
    gold: current.gold + earnings.gold,
    silver: current.silver + earnings.silver,
    money: current.money + earnings.money,
  };
  await saveWallet(updated);
  return updated;
}

export function mergeWallets(a: PlayerWallet, b: PlayerWallet): PlayerWallet {
  return {
    gold: a.gold + b.gold,
    silver: a.silver + b.silver,
    money: a.money + b.money,
  };
}

export function formatWalletSummary(wallet: PlayerWallet): string {
  return `🪙 ${wallet.gold}  🥈 ${wallet.silver}  💵 ${wallet.money}`;
}
