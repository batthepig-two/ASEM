import { BreedingPair } from "../types";

const STORAGE_KEY = "ark-mutation-helper-pairs";

export function loadPairs(): BreedingPair[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BreedingPair[];
  } catch {
    return [];
  }
}

export function savePairs(pairs: BreedingPair[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  } catch {
    // ignore storage errors
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
