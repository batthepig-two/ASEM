import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Dna, Github } from "lucide-react";
import { BreedingPair } from "../types";
import { loadPairs, savePairs, generateId } from "../lib/storage";
import BreedingCard from "../components/BreedingCard";

function createDefaultPair(): BreedingPair {
  return {
    id: generateId(),
    name: "New Breeding Line",
    dinoType: "",
    father: { Health: "", Stamina: "", Oxygen: "", Food: "", Weight: "", Melee: "" },
    mother: { Health: "", Stamina: "", Oxygen: "", Food: "", Weight: "", Melee: "" },
    mutationTarget: "Melee",
    mutationCount: 0,
    maxMutations: 20,
    notes: "",
    createdAt: Date.now(),
  };
}

export default function Home() {
  const [pairs, setPairs] = useState<BreedingPair[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadPairs();
    setPairs(saved.length > 0 ? saved : [createDefaultPair()]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) savePairs(pairs);
  }, [pairs, loaded]);

  function addPair() {
    setPairs((prev) => [createDefaultPair(), ...prev]);
  }

  function updatePair(updated: BreedingPair) {
    setPairs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function deletePair(id: string) {
    setPairs((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 ark-glow-green">
              <Dna className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">
                ARK Mutation Helper
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Survival Evolved / Ascended
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Batthepig-two/ASEM"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-github"
            >
              <Github className="h-5 w-5" />
            </a>
            <Button
              onClick={addPair}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 gap-2"
              data-testid="button-add-pair"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Breeding Line</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* How-to banner */}
      <div className="bg-secondary/10 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            <span className="text-primary font-semibold">How it works:</span>{" "}
            Enter parent stat <em>levels</em> (not values) → Target column shows what to look for (+2) →
            Type baby's stat to instantly check if it's a mutation → Track stacks with the counter.
            Everything saves automatically.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {pairs.length === 0 && (
          <div className="text-center py-16">
            <Dna className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">No breeding lines yet.</p>
            <Button onClick={addPair} className="mt-4 bg-primary text-primary-foreground" data-testid="button-add-first-pair">
              Add your first breeding line
            </Button>
          </div>
        )}

        {pairs.map((pair) => (
          <BreedingCard
            key={pair.id}
            pair={pair}
            onUpdate={updatePair}
            onDelete={() => deletePair(pair.id)}
          />
        ))}

        {pairs.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={addPair}
              className="border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary gap-2"
              data-testid="button-add-pair-bottom"
            >
              <Plus className="h-4 w-4" />
              Add Another Breeding Line
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-8 py-4">
        <p className="text-center text-xs text-muted-foreground">
          ARK Mutation Helper — All data stored locally in your browser
        </p>
      </footer>
    </div>
  );
}
