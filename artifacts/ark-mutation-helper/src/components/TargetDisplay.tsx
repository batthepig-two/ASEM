import { calcAllTargets } from "../lib/mutations";
import { BreedingPair } from "../types";
import { BREEDABLE_STATS, Stat } from "../data/dinos";

interface TargetDisplayProps {
  pair: BreedingPair;
}

export default function TargetDisplay({ pair }: TargetDisplayProps) {
  const targets = calcAllTargets(pair.father, pair.mother);

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Mutation Targets (+2 levels)
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {BREEDABLE_STATS.map((stat) => {
          const isTarget = stat === pair.mutationTarget;
          const { fatherTarget, motherTarget } = targets[stat as Stat];
          return (
            <div
              key={stat}
              className={`rounded-lg p-2 border transition-all ${
                isTarget
                  ? "bg-primary/10 border-primary/50 ark-glow-green"
                  : "bg-muted border-border"
              }`}
              data-testid={`card-target-${stat.toLowerCase()}`}
            >
              <div className={`text-xs font-semibold mb-1 ${isTarget ? "text-primary" : "text-muted-foreground"}`}>
                {stat} {isTarget && "★"}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">♂</span>
                <span className={`font-mono font-bold ${isTarget ? "text-primary" : "text-foreground"}`}>
                  {fatherTarget > 2 ? fatherTarget : "—"}
                </span>
                <span className="text-muted-foreground">♀</span>
                <span className={`font-mono font-bold ${isTarget ? "text-primary" : "text-foreground"}`}>
                  {motherTarget > 2 ? motherTarget : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
