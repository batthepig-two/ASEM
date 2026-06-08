import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface MutationCounterProps {
  count: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onMaxChange: (max: number) => void;
}

export default function MutationCounter({
  count,
  max,
  onIncrement,
  onDecrement,
  onMaxChange,
}: MutationCounterProps) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const danger = count >= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Mutation Stack</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Max:</span>
          <select
            value={max}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            className="bg-muted border border-input rounded px-1 py-0.5 text-xs text-foreground focus:outline-none"
            data-testid="select-max-mutations"
          >
            {[20, 40, 60, 80, 100].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-input bg-muted hover:bg-destructive hover:text-destructive-foreground shrink-0"
          onClick={onDecrement}
          disabled={count <= 0}
          data-testid="button-decrement-mutations"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-2xl font-bold tabular-nums ${danger ? "text-destructive" : "text-primary"}`}
              data-testid="text-mutation-count"
            >
              {count}
            </span>
            <span className="text-sm text-muted-foreground">/ {max}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                danger ? "bg-destructive" : pct > 70 ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
              data-testid="bar-mutation-progress"
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-input bg-muted hover:bg-primary hover:text-primary-foreground shrink-0"
          onClick={onIncrement}
          data-testid="button-increment-mutations"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {danger && (
        <p className="text-xs text-destructive font-medium" data-testid="text-mutation-warning">
          Warning: Mutation cap reached ({max}/{max})! Mutations will no longer be accepted.
        </p>
      )}
    </div>
  );
}
