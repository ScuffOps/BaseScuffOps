import React, { useState, useEffect } from 'react';
import { TeamMember } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function ScheduleManager({ teamMember, onUpdate, isEditable }) {
  const [availability, setAvailability] = useState(teamMember?.availability || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragSelection, setDragSelection] = useState(new Set());

  useEffect(() => {
    // Update local state if the teamMember prop changes
    setAvailability(teamMember?.availability || {});
  }, [teamMember]);

  const getCellKey = (day, time) => `${day}-${time}`;

  const handleMouseDown = (day, time) => {
    if (!isEditable) return;
    
    setIsDragging(true);
    setDragStart({ day, time });
    setDragSelection(new Set([getCellKey(day, time)]));
  };

  const handleMouseEnter = (day, time) => {
    if (!isDragging || !dragStart) return;
    
    const startDayIndex = DAYS.indexOf(dragStart.day);
    const endDayIndex = DAYS.indexOf(day);
    const startTimeIndex = TIME_SLOTS.indexOf(dragStart.time);
    const endTimeIndex = TIME_SLOTS.indexOf(time);
    
    const minDay = Math.min(startDayIndex, endDayIndex);
    const maxDay = Math.max(startDayIndex, endDayIndex);
    const minTime = Math.min(startTimeIndex, endTimeIndex);
    const maxTime = Math.max(startTimeIndex, endTimeIndex);
    
    const selection = new Set();
    for (let dayIdx = minDay; dayIdx <= maxDay; dayIdx++) {
      for (let timeIdx = minTime; timeIdx <= maxTime; timeIdx++) {
        selection.add(getCellKey(DAYS[dayIdx], TIME_SLOTS[timeIdx]));
      }
    }
    setDragSelection(selection);
  };

  const handleMouseUp = () => {
    if (!isDragging || !isEditable) return;
    
    // Apply the selection to availability
    setAvailability(prev => {
      const newAvailability = { ...prev };
      
      // Check if we're adding or removing (based on first cell state)
      const firstCell = dragStart ? getCellKey(dragStart.day, dragStart.time) : null;
      const firstCellSelected = firstCell ? (prev[dragStart.day] || []).includes(dragStart.time) : false;
      const shouldAdd = !firstCellSelected;
      
      dragSelection.forEach(cellKey => {
        const [day, time] = cellKey.split('-');
        if (!newAvailability[day]) newAvailability[day] = [];
        
        if (shouldAdd) {
          if (!newAvailability[day].includes(time)) {
            newAvailability[day].push(time);
          }
        } else {
          newAvailability[day] = newAvailability[day].filter(t => t !== time);
        }
      });
      
      return newAvailability;
    });
    
    setIsDragging(false);
    setDragStart(null);
    setDragSelection(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await TeamMember.update(teamMember.id, { availability });
      onUpdate();
    } catch (error) {
      console.error("Failed to save schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCellStatus = (day, time) => {
    const cellKey = getCellKey(day, time);
    const isSelected = (availability[day] || []).includes(time);
    const isInDragSelection = dragSelection.has(cellKey);
    
    if (isInDragSelection && isDragging) {
      // Show drag preview
      const firstCellSelected = dragStart ? (availability[dragStart.day] || []).includes(dragStart.time) : false;
      return firstCellSelected ? 'drag-remove' : 'drag-add';
    }
    
    return isSelected ? 'selected' : 'unselected';
  };
  
  if (!teamMember) {
    return (
      <Alert>
        <Info className="w-4 h-4" />
        <AlertTitle>No Member Selected</AlertTitle>
        <AlertDescription>
          Please select a team member to view or edit their schedule.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Schedule for {teamMember.name}</CardTitle>
          {isEditable && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditable && (
          <Alert className="mb-4">
            <Info className="w-4 h-4" />
            <AlertTitle>View-Only</AlertTitle>
            <AlertDescription>
              You do not have permission to edit this schedule.
            </AlertDescription>
          </Alert>
        )}
        
        {isEditable && (
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> Click and drag to select multiple time slots. Drag over selected cells to unselect them.
            </p>
          </div>
        )}
        
        <div 
          className="overflow-x-auto select-none" 
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="grid grid-cols-8 gap-1 text-xs text-center min-w-[800px]">
            <div className="font-semibold p-2">Time</div>
            {DAYS.map(day => <div key={day} className="font-semibold p-2 capitalize">{day}</div>)}

            {TIME_SLOTS.map(time => (
              <React.Fragment key={time}>
                <div className="p-2 font-mono">{time}</div>
                {DAYS.map(day => {
                  const status = getCellStatus(day, time);
                  return (
                    <button
                      key={`${day}-${time}`}
                      onMouseDown={() => handleMouseDown(day, time)}
                      onMouseEnter={() => handleMouseEnter(day, time)}
                      disabled={!isEditable}
                      className={`p-2 rounded transition-colors ${
                        status === 'selected' ? 'bg-emerald-500' :
                        status === 'drag-add' ? 'bg-emerald-400' :
                        status === 'drag-remove' ? 'bg-red-400' :
                        'bg-slate-700'
                      } ${isEditable ? 'hover:bg-emerald-600 cursor-pointer' : 'cursor-not-allowed'}`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}