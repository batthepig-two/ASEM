import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BREEDABLE_STATS, Stat } from "../data/dinos";
import { ParentStats } from "../types";

interface StatInputProps {
  label: string;
  stats: ParentStats;
  onChange: (stat: Stat, value: string) => void;
  prefix: string;
}

export default function StatInput({ label, stats, onChange, prefix }: StatInputProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        {BREEDABLE_STATS.map((stat) => (
          <div key={stat}>
            <Label className="text-xs text-muted-foreground mb-1 block">{stat}</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={stats[stat] === "" ? "" : stats[stat]}
              onChange={(e) => onChange(stat, e.target.value)}
              className="h-8 text-sm bg-muted border-input"
              data-testid={`input-${prefix}-${stat.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
