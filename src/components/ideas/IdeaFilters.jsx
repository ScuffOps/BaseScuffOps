import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function IdeaFilters({ ideas, filters, onChange }) {
  const categories = React.useMemo(() => {
    const set = new Set((ideas || []).map(i => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [ideas]);

  const creators = React.useMemo(() => {
    const set = new Set((ideas || []).map(i => i.createdBy).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [ideas]);

  function update(partial) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_200px_1fr] gap-3 mb-4">
      <Input
        placeholder="Search title, content, synopsis…"
        value={filters.query}
        onChange={(e) => update({ query: e.target.value })}
        className="bg-slate-900/70 border-slate-800/60"
      />
      <Select value={filters.category} onValueChange={(v) => update({ category: v })}>
        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.createdBy} onValueChange={(v) => update({ createdBy: v })}>
        <SelectTrigger><SelectValue placeholder="Created By" /></SelectTrigger>
        <SelectContent>
          {creators.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Filter by tags (comma-separated)"
        value={filters.tagsText}
        onChange={(e) => update({ tagsText: e.target.value })}
        className="bg-slate-900/70 border-slate-800/60"
      />
    </div>
  );
}