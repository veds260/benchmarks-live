"use client";

import { useCallback, useEffect, useState } from "react";
import { EntryRow, EntriesResponse } from "@/lib/types";
import { CategoryTabs } from "./category-tabs";
import { SearchBar } from "./search-bar";
import { EntryRowComponent } from "./entry-row";
import { Pagination } from "./pagination";
import { SkeletonTable } from "./skeleton-table";
import { cn } from "@/lib/utils";

export function RankingTable() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rank");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const pageSize = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        category,
        sort,
        order,
        page: String(page),
        limit: String(pageSize),
        ...(search && { search }),
      });

      const res = await fetch(`/api/entries?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data: EntriesResponse = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, sort, order, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (col: string) => {
    if (sort === col) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(col);
      setOrder(col === "rank" || col === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const SortHeader = ({
    col,
    label,
    className,
  }: {
    col: string;
    label: string;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(col)}
      className={cn(
        "text-xs font-medium text-text-muted hover:text-text-secondary transition-colors text-left",
        sort === col && "text-accent",
        className
      )}
    >
      {label}
      {sort === col && (
        <span className="ml-0.5">{order === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
      </div>

      {/* Mobile sort controls */}
      <div className="flex md:hidden gap-1.5 overflow-x-auto pb-1">
        {[
          { col: "rank", label: "#" },
          { col: "score", label: "Score" },
          { col: "quality", label: "Quality" },
          { col: "trend_24h", label: "24h" },
          { col: "trend_7d", label: "7d" },
          { col: "name", label: "Name" },
        ].map((s) => (
          <button
            key={s.col}
            onClick={() => handleSort(s.col)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors",
              sort === s.col
                ? "bg-accent/15 text-accent"
                : "bg-bg-card text-text-muted"
            )}
          >
            {s.label}
            {sort === s.col && (
              <span className="ml-0.5">{order === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[40px_1fr_70px_60px_60px_65px_65px_70px_80px] items-center gap-2 px-3 py-2 border-b border-border">
        <SortHeader col="rank" label="#" />
        <SortHeader col="name" label="Name" />
        <SortHeader col="score" label="AI Cap" />
        <SortHeader col="quality" label="Quality" />
        <SortHeader col="popularity" label="Pop." />
        <SortHeader col="trend_24h" label="24h" />
        <SortHeader col="trend_7d" label="7d" />
        <span className="text-xs font-medium text-text-muted">Stars/DL</span>
        <span className="text-xs font-medium text-text-muted">7d Chart</span>
      </div>

      {/* Error state */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-3">Failed to load entries.</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-accent/15 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/25 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <SkeletonTable rows={15} />
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          No entries found.
        </div>
      ) : (
        <div className="space-y-0.5">
          {entries.map((entry, i) => (
            <EntryRowComponent key={entry.slug} entry={entry} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Total count */}
      {!error && (
        <div className="text-center text-xs text-text-muted">
          Showing {entries.length} of {total} entries
        </div>
      )}
    </div>
  );
}
