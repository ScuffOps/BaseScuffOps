
import React, { useState } from 'react';
import { TeamMember } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Save } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AvailabilityManager({ teamMembers, currentUser, onUpdate }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [availability, setAvailability] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);
  const currentUserName =
    currentUser?.displayName || currentUser?.full_name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '');

  // Broaden canEdit so members can update their own availability
  const canEdit =
    !!currentUser &&
    !!selectedMember &&
    (
      currentUser.role === 'admin' ||
      currentUser.role === 'leadmod' ||
      selectedMember.created_by === currentUser.email || // record owner
      selectedMember.user_email === currentUser.email || // optional field if present
      selectedMember.name === currentUserName // name match fallback
    );

  React.useEffect(() => {
    if (selectedMember) {
      setAvailability(selectedMember.availability || {});
    }
  }, [selectedMember]);

  const handleSlotToggle = (day, time) => {
    if (!canEdit) return;
    
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const isSelected = daySlots.includes(time);
      
      return {
        ...prev,
        [day]: isSelected 
          ? daySlots.filter(t => t !== time)
          : [...daySlots, time].sort()
      };
    });
  };

  const handleSave = async () => {
    if (!selectedMember || !canEdit) return;
    
    setIsSaving(true);
    try {
      await TeamMember.update(selectedMember.id, { availability });
      onUpdate();
    } catch (error) {
      console.error("Failed to save availability:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: []
    }));
  };

  const fillDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...TIME_SLOTS]
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Availability Management
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <label className="text-sm font-medium text-slate-300">Select Team Member:</label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 !rounded-[var(--button-radius)]">
                <SelectValue placeholder="Choose a team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && canEdit && (
              <Button onClick={handleSave} disabled={isSaving} className="!rounded-[var(--button-radius)]">
                {isSaving ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        
        {selectedMember && (
          <CardContent>
            {!canEdit && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-300 text-sm">You can only view this schedule. Contact an admin or lead mod to make changes.</p>
              </div>
            )}
            
            <div className="grid gap-6">
              {DAYS.map(day => (
                <Card key={day} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 !rounded-[var(--panel-radius)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize text-slate-100">{day}</CardTitle>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearDay(day)}
                            className="!rounded-[var(--button-radius)]"
                          >
                            Clear All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fillDay(day)}
                            className="!rounded-[var(--button-radius)]"
                          >
                            Select All
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                      {TIME_SLOTS.map(time => {
                        const isSelected = (availability[day] || []).includes(time);
                        return (
                          <button
                            key={time}
                            onClick={() => handleSlotToggle(day, time)}
                            disabled={!canEdit}
                            className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-gold)] text-white shadow-lg'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                            } ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(availability[day] || []).map(time => (
                        <Badge key={time} variant="secondary" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                      {!(availability[day] || []).length && (
                        <span className="text-slate-500 text-sm">No availability set for {day}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
