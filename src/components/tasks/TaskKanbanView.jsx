import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STATUSES = [
  { id: "in_queue", title: "In Queue" },
  { id: "working_on", title: "Working On" },
  { id: "done", title: "Done" }
];

export default function TaskKanbanView({ tasks, onDragEnd, onItemClick }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STATUSES.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="min-w-[300px] flex-shrink-0">
              <Card className="bg-slate-900/50 border-slate-800 !rounded-[var(--panel-radius)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200">{col.title} ({colTasks.length})</CardTitle>
                </CardHeader>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] ${snapshot.isDraggingOver ? "bg-slate-800/50" : ""}`}
                    >
                      {colTasks.map((t, idx) => (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              onClick={() => onItemClick && onItemClick(t)}
                              className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer ${snap.isDragging ? "rotate-1" : ""}`}
                            >
                              <div className={`text-sm ${t.status === "done" ? "line-through text-slate-400" : "text-slate-100"}`}>{t.title}</div>
                              {t.category && <div className="text-xs text-slate-400 mt-1">{t.category}</div>}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}