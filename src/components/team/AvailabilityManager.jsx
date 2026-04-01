import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, User } from 'lucide-react';

const TeamMemberEntity = base44.entities.TeamMember;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const STATUSES = ['free', 'on_call', 'busy', 'dnd'];

const STATUS_CONFIG = {
  free:    { label: 'Free',       color: 'bg-emerald-500/80 text-white border-emerald-400/50', dot: 'bg-emerald-400' },
  on_call: { label: 'On Call',    color: 'bg-blue-500/80 text-white border-blue-400/50',       dot: 'bg-blue-400' },
  busy:    { label: 'Busy',       color: 'bg-amber-500/80 text-white border-amber-400/50',     dot: 'bg-amber-400' },
  dnd:     { label: 'Do Not Disturb', color: 'bg-rose-600/80 text-white border-rose-500/50',  dot: 'bg-rose-500' },
};

function cycleStatus(current) {
  if (!current) return 'free';
  const idx = STATUSES.indexOf(current);
  if (idx === -1 || idx === STATUSES.length - 1) return null;
  return STATUSES[idx + 1];
}

export default function AvailabilityManager({ teamMembers, currentUser, onUpdate }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [availability, setAvailability] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);
  const currentUserName =
    currentUser?.displayName || currentUser?.full_name || currentUser?.username ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '');

  const canEdit =
    !!currentUser && !!selectedMember && (
      currentUser.role === 'admin' ||
      currentUser.role === 'leadmod' ||
      selectedMember.created_by === currentUser.email ||
      selectedMember.user_email === currentUser.email ||
      selectedMember.name === currentUserName
    );

  React.useEffect(() => {
    if (selectedMember) {
      // Migrate old array format to new object format if needed
      const raw = selectedMember.availability || {};
      const normalized = {};
      DAYS.forEach(day => {
        const val = raw[day];
        if (Array.isArray(val)) {
          // Old format: convert array to object with 'free' status
          normalized[day] = {};
          val.forEach(t => { normalized[day][t] = 'free'; });
        } else if (val && typeof val === 'object') {
          normalized[day] = val;
        } else {
          normalized[day] = {};
        }
      });
      setAvailability(normalized);
    }
  }, [selectedMember]);

  const handleSlotClick = (day, time) => {
    if (!canEdit) return;
    setAvailability(prev => {
      const dayData = { ...(prev[day] || {}) };
      const current = dayData[time] || null;
      const next = cycleStatus(current);
      if (next === null) {
        delete dayData[time];
      } else {
        dayData[time] = next;
      }
      return { ...prev, [day]: dayData };
    });
  };

  const handleSave = async () => {
    if (!selectedMember || !canEdit) return;
    setIsSaving(true);
    try {
      await TeamMemberEntity.update(selectedMember.id, { availability });
      onUpdate();
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDay = (day) => {
    setAvailability(prev => ({ ...prev, [day]: {} }));
  };

  const fillDay = (day, status = 'free') => {
    const filled = {};
    TIME_SLOTS.forEach(t => { filled[t] = status; });
    setAvailability(prev => ({ ...prev, [day]: filled }));
  };

  const getStatusSummary = (dayData) => {
    const counts = { free: 0, on_call: 0, busy: 0, dnd: 0 };
    Object.values(dayData || {}).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
    return counts;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Availability Management
          </CardTitle>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className={`w-3 h-3 rounded-sm ${cfg.dot}`} />
                {cfg.label}
              </div>
            ))}
            <span className="text-xs text-slate-500">· click slot to cycle status · click again to clear</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
            <label className="text-sm font-medium text-slate-300">Select Team Member:</label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64 bg-slate-800/30 border border-slate-700/50 !rounded-[var(--button-radius)]">
                <SelectValue placeholder="Choose a team member…" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} — {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && canEdit && (
              <Button onClick={handleSave} disabled={isSaving} className="!rounded-[var(--button-radius)]">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </CardHeader>

        {selectedMember && (
          <CardContent>
            {!canEdit && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-300 text-sm">View only. Contact an admin or lead mod to make changes.</p>
              </div>
            )}

            <div className="grid gap-5">
              {DAYS.map(day => {
                const dayData = availability[day] || {};
                const summary = getStatusSummary(dayData);
                return (
                  <Card key={day} className="bg-slate-800/30 border border-slate-700/50 !rounded-[var(--panel-radius)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold capitalize text-slate-100">{day}</span>
                          <div className="flex gap-1.5">
                            {Object.entries(summary).map(([s, count]) =>
                              count > 0 ? (
                                <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  <span className={`w-2 h-2 rounded-full mr-1 inline-block ${STATUS_CONFIG[s]?.dot}`} />
                                  {count}h
                                </Badge>
                              ) : null
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1.5 flex-wrap">
                            {STATUSES.map(s => (
                              <Button
                                key={s}
                                variant="outline"
                                size="sm"
                                onClick={() => fillDay(day, s)}
                                className="!rounded-[var(--button-radius)] text-xs h-7 px-2"
                              >
                                All {STATUS_CONFIG[s].label}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => clearDay(day)}
                              className="!rounded-[var(--button-radius)] text-xs h-7 px-2 text-slate-400"
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                        {TIME_SLOTS.map(time => {
                          const status = dayData[time] || null;
                          const cfg = status ? STATUS_CONFIG[status] : null;
                          return (
                            <button
                              key={time}
                              onClick={() => handleSlotClick(day, time)}
                              disabled={!canEdit}
                              title={`${time} — ${status ? STATUS_CONFIG[status].label : 'Unset'}`}
                              className={`p-1.5 rounded-md text-[10px] font-medium transition-all duration-150 border ${
                                cfg
                                  ? `${cfg.color} shadow-sm`
                                  : 'bg-slate-700/40 text-slate-500 border-slate-700/30 hover:bg-slate-600/40 hover:text-slate-300'
                              } ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            >
                              {time.split(':')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        )}

        {!selectedMember && (
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a Team Member</h3>
              <p>Choose a team member from the dropdown to view or edit their availability.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}