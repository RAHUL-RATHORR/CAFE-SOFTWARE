"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminGlobalSearch } from "@/actions/admin";
import type { AdminSearchResult } from "@/types/admin";

export function AdminGlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runSearch() {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const result = await adminGlobalSearch({ q });
      if (result.success) {
        setResults(result.data);
        setOpen(true);
      } else {
        setResults([]);
      }
    });
  }

  return (
    <div className="relative w-full sm:w-72">
      <div className="flex gap-1">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") runSearch();
          }}
          placeholder="Search restaurants, users…"
          className="h-9 rounded-xl"
          aria-label="Admin global search"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-9 rounded-xl"
          onClick={runSearch}
          disabled={isPending}
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>
      </div>
      {open && results.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border/70 bg-card p-1 shadow-lg">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-muted"
              onClick={() => {
                setOpen(false);
                router.push(item.href);
              }}
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                {item.type} · {item.subtitle}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
