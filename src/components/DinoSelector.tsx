import { useState } from "react";
import { ARK_DINOS } from "../data/dinos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DinoSelectorProps {
  selected: string;
  onSelect: (dino: string) => void;
}

export default function DinoSelector({ selected, onSelect }: DinoSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = ARK_DINOS.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal border-input bg-muted hover:bg-muted/80 text-foreground"
        onClick={() => setOpen(true)}
        data-testid="button-select-dino"
      >
        {selected || "Select Dino..."}
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card shadow-lg">
      <div className="p-2 border-b border-border flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          autoFocus
          placeholder="Search dinos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
          data-testid="input-dino-search"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={() => setOpen(false)}
        >
          ✕
        </Button>
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">No dinos found</p>
        )}
        <div className="flex flex-wrap gap-1 p-1">
          {filtered.map((dino) => (
            <button
              key={dino}
              onClick={() => { onSelect(dino); setOpen(false); setSearch(""); }}
              className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${
                selected === dino
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
              }`}
              data-testid={`button-dino-${dino.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {dino}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
