
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import IdeaCard from './IdeaCard';

const STAGES = ["Draft", "Proposal", "Review", "Voting", "Approved", "Implemented", "On Hold", "Vetoed"];

export default function IdeaKanbanView({ ideas, onDragEnd, onIdeaClick, onEdit, onDelete, canModify }) {
  const ideasByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = ideas.filter(idea => idea.stage === stage);
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <Droppable key={stage} droppableId={stage}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`w-80 flex-shrink-0 bg-slate-900 rounded-xl p-3 ${
                  snapshot.isDraggingOver ? 'bg-slate-800/50' : ''
                }`}
              >
                <h3 className="font-bold text-slate-200 p-2 mb-3 sticky top-0 bg-slate-900">
                  {stage} ({ideasByStage[stage].length})
                </h3>
                <div className="space-y-3 h-[calc(100vh-250px)] overflow-y-auto">
                  {ideasByStage[stage].map((idea, index) => (
                    <Draggable key={idea.id} draggableId={idea.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <IdeaCard
                            idea={idea}
                            onClick={onIdeaClick}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            canModify={typeof canModify === 'function' ? canModify(idea) : !!canModify}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
