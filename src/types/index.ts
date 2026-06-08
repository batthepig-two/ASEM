import { Stat } from "../data/dinos";

export interface ParentStats {
  [key: string]: number | string;
  Health: number | string;
  Stamina: number | string;
  Oxygen: number | string;
  Food: number | string;
  Weight: number | string;
  Melee: number | string;
}

export interface BreedingPair {
  id: string;
  name: string;
  dinoType: string;
  father: ParentStats;
  mother: ParentStats;
  mutationTarget: Stat;
  mutationCount: number;
  maxMutations: number;
  notes: string;
  createdAt: number;
}

export type MutationResult = "perfect" | "bad" | "none" | null;

export interface MutationCheck {
  babyStatValue: string;
  result: MutationResult;
  matchedStat: Stat | null;
}
