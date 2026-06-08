import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { checkMutation } from "../lib/mutations";
import { BreedingPair, MutationCheck } from "../types";

interface MutationCheckerProps {
  pair: BreedingPair;
}

export default function MutationChecker({ pair }: MutationCheckerProps) {
  const [babyVal, setBabyVal] = useState("");
  const [result, setResult] = useState<MutationCheck | null>(null);

  function handleCheck() {
    if (!babyVal.trim()) return;
    const r = checkMutation(babyVal, pair.father, pair.mother, pair.mutationTarget);
    setResult(r);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCheck();
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-foreground">
        Baby {pair.mutationTarget} Stat — Is it a Mutation?
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder={`Enter baby's ${pair.mutationTarget} level...`}
          value={babyVal}
          onChange={(e) => { setBabyVal(e.target.value); setResult(null); }}
          onKeyDown={handleKeyDown}
          className="bg-muted border-input flex-1"
          data-testid="input-baby-stat"
        />
        <Button
          onClick={handleCheck}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          data-testid="button-check-mutation"
        >
          Check
        </Button>
      </div>

      {result && result.result !== null && (
        <div
          className={`rounded-lg p-3 border flex items-start gap-3 transition-all ${
            result.result === "perfect"
              ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300 mutation-good"
              : result.result === "bad"
              ? "bg-red-950/50 border-red-500/50 text-red-300 mutation-bad"
              : "bg-muted border-border text-muted-foreground"
          }`}
          data-testid="text-mutation-result"
        >
          {result.result === "perfect" && (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
          )}
          {result.result === "bad" && (
            <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
          )}
          {result.result === "none" && (
            <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div>
            {result.result === "perfect" && (
              <>
                <p className="font-bold text-emerald-300">Mutation on {pair.mutationTarget}!</p>
                <p className="text-sm text-emerald-400/80 mt-0.5">
                  Baby has {babyVal} — matches the target mutation level. Keep this one!
                </p>
              </>
            )}
            {result.result === "bad" && (
              <>
                <p className="font-bold text-red-300">Bad Mutation — {result.matchedStat}</p>
                <p className="text-sm text-red-400/80 mt-0.5">
                  Mutation landed on <strong>{result.matchedStat}</strong> instead of {pair.mutationTarget}. Skip this baby.
                </p>
              </>
            )}
            {result.result === "none" && (
              <>
                <p className="font-bold">No Mutation Detected</p>
                <p className="text-sm mt-0.5">
                  Baby stat {babyVal} doesn't match any mutation target. This baby inherited normal stats.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
