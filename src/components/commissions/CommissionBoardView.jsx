
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { User } from "@/entities/User";

const STATUSES = [
  { id: 'requested', title: 'Requested', color: 'bg-yellow-500/20' },
  { id: 'accepted', title: 'Accepted', color: 'bg-blue-500/20' },
  { id: 'sketch', title: 'Sketch', color: 'bg-purple-500/20' },
  { id: 'wip', title: 'WIP', color: 'bg-indigo-500/20' },
  { id: 'revisions', title: 'Revisions', color: 'bg-amber-500/20' },
  { id: 'final', title: 'Final', color: 'bg-cyan-500/20' },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-500/20' }
];

export default function CommissionBoardView({ commissions, onCommissionClick, onUpdate }) {
  const sanitizeCommissionPayload = (data) => {
    const cleaned = { ...data };
    if (cleaned.artist_handles && typeof cleaned.artist_handles === 'object') {
      const keep = {};
      ['discord', 'vgen', 'twitter', 'deviantart', 'email'].forEach((k) => {
        const v = cleaned.artist_handles[k];
        if (typeof v === 'string') keep[k] = v;
      });
      if (Object.keys(keep).length) cleaned.artist_handles = keep;
      else delete cleaned.artist_handles;
    }
    return cleaned;
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const commission = commissions.find(c => c.id === draggableId);
    if (!commission) return;

    // Update commission status
    try {
      const { Commission } = await import('@/entities/Commission');
      const payload = sanitizeCommissionPayload({ ...commission, status: destination.droppableId });
      await Commission.update(draggableId, payload);
      onUpdate();
    } catch (error) {
      console.error('Failed to update commission status:', error);
      if (String(error?.message || "").toLowerCase().includes("permission") || String(error).includes("403")) {
        await User.loginWithRedirect(window.location.href);
      }
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD';
  };

  const getCommissionsByStatus = (status) => {
    return commissions.filter(c => c.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6">
        {STATUSES.map((status) => {
          const statusCommissions = getCommissionsByStatus(status.id);
          return (
            <div key={status.id} className="min-w-[300px] flex-shrink-0">
              <Card className={`${status.color} border-slate-700/50 !rounded-[var(--panel-radius)]`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-slate-200">{status.title}</span>
                    <Badge variant="outline" className="text-slate-300">
                      {statusCommissions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <CardContent
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-slate-800/50' : ''
                      }`}
                    >
                      {statusCommissions.map((commission, index) => (
                        <Draggable key={commission.id} draggableId={commission.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-pointer bg-slate-900/80 border-slate-700 hover:border-slate-600 transition-colors ${
                                snapshot.isDragging ? 'rotate-3 shadow-xl' : ''
                              }`}
                              onClick={() => onCommissionClick(commission)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  {commission.thumbnail && (
                                    <img
                                      src={commission.thumbnail}
                                      alt={commission.type}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-200 truncate">
                                      {commission.artist}
                                    </h4>
                                    <p className="text-sm text-slate-400 truncate">
                                      {commission.type}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{formatCurrency(commission.payment)}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {commission.platform}
                                  </Badge>
                                </div>

                                {commission.deadline && (
                                  <div className="mt-2 text-xs text-slate-500">
                                    Due: {new Date(commission.deadline).toLocaleDateString()}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
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
