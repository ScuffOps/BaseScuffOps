import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // Monday start
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      days.push(date);
    }
    weeks.push(days);
  }
  return weeks;
}

export default function TaskCalendarView({ tasks, onItemClick }) {
  const [cursor, setCursor] = useState(new Date());
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const matrix = useMemo(() => getMonthMatrix(y, m), [y, m]);

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
      (map[key] ||= []).push(t);
    });
    return map;
  }, [tasks]);

  function keyForDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 !rounded-[var(--panel-radius)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-200">
          {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </CardTitle>
        <div className="flex gap-2">
          <button className="p-1 rounded hover:bg-white/10" onClick={() => setCursor(new Date(y, m - 1, 1))}><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1 rounded hover:bg-white/10" onClick={() => setCursor(new Date(y, m + 1, 1))}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-2">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {matrix.flat().map((date, idx) => {
            const inMonth = date.getMonth() === m;
            const key = keyForDate(date);
            const dayTasks = tasksByDay[key] || [];
            return (
              <div key={idx} className={`min-h-[90px] rounded-lg border p-2 ${inMonth ? "border-white/10 bg-white/5" : "border-white/5 bg-white/0 opacity-60"}`}>
                <div className="text-xs text-slate-400 mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {dayTasks.slice(0,3).map(t => (
                    <button key={t.id} onClick={() => onItemClick && onItemClick(t)} className="w-full truncate text-left px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800/90 text-[11px]">
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[11px] text-slate-500">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}