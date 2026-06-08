import { ParentStats, MutationCheck } from "../types";
import { BREEDABLE_STATS, Stat } from "../data/dinos";

export function getMutationLevel(baseStat: number | string): number {
  const val = typeof baseStat === "string" ? parseFloat(baseStat) : baseStat;
  return isNaN(val) ? 0 : val;
}

export function calcTargetStat(parentValue: number | string): number {
  const base = getMutationLevel(parentValue);
  return base + 2;
}

export function calcAllTargets(
  father: ParentStats,
  mother: ParentStats
): Record<Stat, { fatherTarget: number; motherTarget: number }> {
  const result: Partial<Record<Stat, { fatherTarget: number; motherTarget: number }>> = {};
  for (const stat of BREEDABLE_STATS) {
    result[stat] = {
      fatherTarget: calcTargetStat(father[stat]),
      motherTarget: calcTargetStat(mother[stat]),
    };
  }
  return result as Record<Stat, { fatherTarget: number; motherTarget: number }>;
}

export function checkMutation(
  babyStatStr: string,
  father: ParentStats,
  mother: ParentStats,
  targetStat: Stat
): MutationCheck {
  const babyVal = parseFloat(babyStatStr);
  if (isNaN(babyVal) || babyStatStr.trim() === "") {
    return { babyStatValue: babyStatStr, result: null, matchedStat: null };
  }

  const fatherTarget = calcTargetStat(father[targetStat]);
  const motherTarget = calcTargetStat(mother[targetStat]);

  if (babyVal === fatherTarget || babyVal === motherTarget) {
    return { babyStatValue: babyStatStr, result: "perfect", matchedStat: targetStat };
  }

  for (const stat of BREEDABLE_STATS) {
    if (stat === targetStat) continue;
    const ft = calcTargetStat(father[stat]);
    const mt = calcTargetStat(mother[stat]);
    if (babyVal === ft || babyVal === mt) {
      return { babyStatValue: babyStatStr, result: "bad", matchedStat: stat };
    }
  }

  return { babyStatValue: babyStatStr, result: "none", matchedStat: null };
}
