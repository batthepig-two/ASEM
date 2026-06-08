import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronUp, Dna } from "lucide-react";
import { BreedingPair } from "../types";
import { BREEDABLE_STATS, Stat } from "../data/dinos";
import DinoSelector from "./DinoSelector";
import StatInput from "./StatInput";
import TargetDisplay from "./TargetDisplay";
import MutationChecker from "./MutationChecker";
import MutationCounter from "./MutationCounter";

interface BreedingCardProps {
  pair: BreedingPair;
  onUpdate: (updated: BreedingPair) => void;
  onDelete: () => void;
}

export default function BreedingCard({ pair, onUpdate, onDelete }: BreedingCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  function updateField<K extends keyof BreedingPair>(key: K, value: BreedingPair[K]) {
    onUpdate({ ...pair, [key]: value });
  }

  function updateFatherStat(stat: Stat, value: string) {
    onUpdate({ ...pair, father: { ...pair.father, [stat]: value === "" ? "" : Number(value) } });
  }

  function updateMotherStat(stat: Stat, value: string) {
    onUpdate({ ...pair, mother: { ...pair.mother, [stat]: value === "" ? "" : Number(value) } });
  }

  return (
    <Card
      className="border-border bg-card shadow-md"
      data-testid={`card-breeding-pair-${pair.id}`}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 shrink-0">
            <Dna className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={pair.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Breeding line name..."
              className="h-8 bg-muted border-input font-semibold text-foreground"
              data-testid={`input-pair-name-${pair.id}`}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(!collapsed)}
              data-testid={`button-toggle-${pair.id}`}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              data-testid={`button-delete-${pair.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1">
            <DinoSelector
              selected={pair.dinoType}
              onSelect={(dino) => updateField("dinoType", dino)}
            />
          </div>
          <div className="shrink-0">
            <Select
              value={pair.mutationTarget}
              onValueChange={(v) => updateField("mutationTarget", v as Stat)}
            >
              <SelectTrigger
                className="h-9 bg-primary/10 border-primary/40 text-primary font-semibold w-36"
                data-testid={`select-target-stat-${pair.id}`}
              >
                <SelectValue placeholder="Target stat" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-popover-border">
                {BREEDABLE_STATS.map((s) => (
                  <SelectItem key={s} value={s} className="text-popover-foreground">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatInput
              label="Father Stats"
              stats={pair.father}
              onChange={updateFatherStat}
              prefix={`father-${pair.id}`}
            />
            <StatInput
              label="Mother Stats"
              stats={pair.mother}
              onChange={updateMotherStat}
              prefix={`mother-${pair.id}`}
            />
          </div>

          <div className="border-t border-border pt-4">
            <TargetDisplay pair={pair} />
          </div>

          <div className="border-t border-border pt-4">
            <MutationChecker pair={pair} />
          </div>

          <div className="border-t border-border pt-4">
            <MutationCounter
              count={pair.mutationCount}
              max={pair.maxMutations}
              onIncrement={() => updateField("mutationCount", pair.mutationCount + 1)}
              onDecrement={() => updateField("mutationCount", Math.max(0, pair.mutationCount - 1))}
              onMaxChange={(max) => updateField("maxMutations", max)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
            <Input
              value={pair.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="e.g. Gen 5 melee line, keep babies above 350..."
              className="bg-muted border-input text-sm"
              data-testid={`input-notes-${pair.id}`}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
