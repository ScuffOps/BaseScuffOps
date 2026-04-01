import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Info, GripVertical, X, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TeamMemberEntity = base44.entities.TeamMember;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', hours: '6am – 12pm', range: ['06:00','07:00','08:00','09:00','10:00','11:00'] },
  { id: 'day',     label: 'Day',     hours: '12pm – 6pm',  range: ['12:00','13:00','14:00','15:00','16:00','17:00'] },
  { id: 'night',   label: 'Night',   hours: '6pm – 12am',  range: ['18:00','19:00','20:00','21:00','22:00','23:00'] },
];

const AVAIL_CHECK = (member, day, blockRange) =>
  blockRange.some(t => ['free', 'on_call'].includes(member.availability?.[day]?.[t]));

export default function DragScheduler({ teamMembers, onUpdate }) {
  // assignments: { "monday-morning": [memberId, ...] }
  const [assignments, setAssignments] = useState(() => {
    const init = {};
    DAYS.forEach(day => TIME_BLOCKS.forEach(block => {
      const key = `${day}-${block.id}`;
      const assigned = teamMembers.flatMap(m =>
        (m.assigned_shifts?.[day] || []).includes(block.id) ? [m.id] : []
      );
      init[key] = assigned;
    }));
    return init;
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const activeMembers = useMemo(
    () => teamMembers.filter(m => m.status === 'active'),
    [teamMembers]
  );

  const memberById = useMemo(() => {
    const map = {};
    activeMembers.forEach(m => { map[m.id] = m; });
    return map;
  }, [activeMembers]);

  const onDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    const memberId = draggableId.replace('pool-', '').replace(/^slot-[^-]+-[^-]+-/, '');

    // Drop into a slot
    if (destination.droppableId !== 'pool') {
      const key = destination.droppableId;
      setAssignments(prev => {
        const current = prev[key] || [];
        if (current.includes(memberId)) return prev;
        return { ...prev, [key]: [...current, memberId] };
      });
    }
  };

  const removeFromSlot = (key, memberId) => {
    setAssignments(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(id => id !== memberId),
    }));
  };

  const saveAssignments = async () => {
    setIsSaving(true);
    try {
      await Promise.all(activeMembers.map(m => {
        const assigned_shifts = {};
        DAYS.forEach(day => {
          const blocks = TIME_BLOCKS.filter(block =>
            (assignments[`${day}-${block.id}`] || []).includes(m.id)
          ).map(block => block.id);
          if (blocks.length) assigned_shifts[day] = blocks;
        });
        return TeamMemberEntity.update(m.id, { assigned_shifts });
      }));
      await onUpdate();
      toast({ title: 'Shifts saved!' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Shift Planner
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Drag members from the pool onto a shift cell. Green border = member is available for that block.
                </p>
              </div>
              <Button onClick={saveAssignments} disabled={isSaving} className="!rounded-[var(--button-radius)]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Shifts
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Member Pool */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Members — drag to assign</p>
              <Droppable droppableId="pool" direction="horizontal"
                renderClone={(provided, _snapshot, rubric) => {
                  const m = activeMembers[rubric.source.index];
                  return (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-600 text-white text-xs font-medium shadow-lg">
                      <Avatar className="w-5 h-5"><AvatarImage src={m?.profileUrl} /><AvatarFallback>{m?.name?.charAt(0)}</AvatarFallback></Avatar>
                      {m?.name}
                    </div>
                  );
                }}
              >
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50">
                    {activeMembers.map((m, i) => (
                      <Draggable key={m.id} draggableId={`pool-${m.id}`} index={i}>
                        {(p, snap) => (
                          <div
                            ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border cursor-grab transition-opacity ${
                              snap.isDragging ? 'opacity-0' : 'opacity-100'
                            } bg-slate-700/60 text-slate-200 border-slate-600/50 hover:bg-slate-600/60`}
                          >
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={m.profileUrl} />
                              <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {m.name}
                            <GripVertical className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Schedule Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header row */}
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                  <div />
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-300 capitalize py-1">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time block rows */}
                {TIME_BLOCKS.map(block => (
                  <div key={block.id} className="grid gap-2 mb-2" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                    {/* Block label */}
                    <div className="flex flex-col justify-center pr-2">
                      <p className="text-sm font-semibold text-slate-200">{block.label}</p>
                      <p className="text-[10px] text-slate-500">{block.hours}</p>
                    </div>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const key = `${day}-${block.id}`;
                      const assignedIds = assignments[key] || [];
                      return (
                        <Droppable key={key} droppableId={key}>
                          {(provided, snapshot) => {
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-h-[80px] rounded-xl border p-2 transition-colors ${
                                  snapshot.isDraggingOver
                                    ? 'bg-purple-500/20 border-purple-500/50'
                                    : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-600/60'
                                }`}
                              >
                                <div className="space-y-1">
                                  {assignedIds.map((mId, idx) => {
                                    const m = memberById[mId];
                                    if (!m) return null;
                                    const isAvail = AVAIL_CHECK(m, day, block.range);
                                    return (
                                      <Draggable key={`slot-${key}-${mId}`} draggableId={`slot-${key}-${mId}`} index={idx}>
                                        {(p) => (
                                          <div
                                            ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                            className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded-lg text-[10px] font-medium border ${
                                              isAvail
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1 min-w-0">
                                              <Avatar className="w-4 h-4 flex-shrink-0">
                                                <AvatarImage src={m.profileUrl} />
                                                <AvatarFallback>{m.name?.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <span className="truncate">{m.name}</span>
                                            </div>
                                            <button onClick={() => removeFromSlot(key, mId)} className="hover:text-white flex-shrink-0">
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                  {assignedIds.length === 0 && (
                                    <p className="text-[10px] text-slate-600 text-center py-2">Drop here</p>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        </Droppable>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" /> Available (matches their availability)</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/40" /> No availability set for this block</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
}