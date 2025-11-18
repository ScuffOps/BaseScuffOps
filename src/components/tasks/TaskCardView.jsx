
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import LinkCard from "./LinkCard";

export default function TaskCardView({ tasks, onEdit, onToggleDone }) {
  // Use only the specified palette for priority labels
  const COLOR_MAP = {
    urgent: "#612529",
    high: "#753243",
    normal: "#4c6f91",
    low: "#c0abb2"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map(task => {
        const isDone = task.status === "done";
        const links = Array.isArray(task.links) ? task.links : [];
        return (
          <Card key={task.id} className={`bg-slate-900/60 border-slate-800 ${isDone ? "opacity-70" : ""} !rounded-[var(--panel-radius)]`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={isDone} onCheckedChange={() => onToggleDone(task)} />
                <CardTitle className={`text-base ${isDone ? "line-through text-slate-400" : "text-slate-100"}`}>
                  {task.title}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEdit(task)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.description && (
                <p className={`text-sm ${isDone ? "text-slate-500 line-through" : "text-slate-300"}`}>{task.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {task.priority && (
                  <Badge
                    variant="outline"
                    className="border"
                    style={{ backgroundColor: COLOR_MAP[task.priority] || "#4c6f91", color: "#fff", borderColor: COLOR_MAP[task.priority] || "#4c6f91" }}
                  >
                    {task.priority}
                  </Badge>
                )}
                {task.category && <Badge variant="outline">{task.category}</Badge>}
                {task.type && <Badge variant="outline">{task.type}</Badge>}
                {task.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(task.dueDate), "MMM d")}
                  </Badge>
                )}
              </div>
              {/* Links */}
              {links.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {links.slice(0, 4).map((lnk, i) => (
                    <LinkCard key={i} link={lnk} size="sm" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
