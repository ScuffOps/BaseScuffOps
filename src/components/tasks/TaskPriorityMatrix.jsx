import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRIORITIES = ["urgent", "high", "normal", "low"];

export default function TaskPriorityMatrix({ tasks, onItemClick }) {
  const grouped = useMemo(() => {
    const m = { urgent: [], high: [], normal: [], low: [] };
    tasks.forEach(t => {
      const p = PRIORITIES.includes(t.priority) ? t.priority : "normal";
      m[p].push(t);
    });
    return m;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {PRIORITIES.map(p => (
        <Card key={p} className="bg-slate-900/50 border-slate-800 !rounded-[var(--panel-radius)]">
          <CardHeader className="pb-2">
            <CardTitle className="capitalize text-slate-200">{p} ({grouped[p].length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped[p].length === 0 && <div className="text-sm text-slate-500">No tasks</div>}
            {grouped[p].map(t => (
              <button key={t.id} onClick={() => onItemClick && onItemClick(t)} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
                <div className={`text-sm ${t.status === "done" ? "line-through text-slate-400" : "text-slate-100"}`}>{t.title}</div>
                {t.dueDate && <div className="text-xs text-slate-400">{new Date(t.dueDate).toLocaleDateString()}</div>}
              </button>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}