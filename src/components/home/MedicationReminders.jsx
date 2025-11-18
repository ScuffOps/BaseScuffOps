
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedDose, Medication } from '@/entities/all';
import { Pill, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isWithinInterval, subHours, addHours } from 'date-fns';

export default function MedicationReminders() {
  const [upcomingMeds, setUpcomingMeds] = useState([]);
  const [lastTaken, setLastTaken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMedicationData();
  }, []);

  const loadMedicationData = async () => {
    try {
      const [doses, medications] = await Promise.all([
        MedDose.list('-scheduled_time'),
        Medication.list()
      ]);
      
      const now = new Date();
      const oneHourFromNow = addHours(now, 1);
      const oneHourAgo = subHours(now, 1);
      
      // Find meds due within ±1 hour
      const upcoming = doses.filter(dose => {
        const scheduledTime = new Date(dose.scheduled_time);
        return isWithinInterval(scheduledTime, {
          start: oneHourAgo,
          end: oneHourFromNow
        }) && !dose.taken_time && !dose.skipped;
      });
      
      setUpcomingMeds(upcoming);
      
      // Find most recently taken medication
      const takenDoses = doses
        .filter(dose => dose.taken_time)
        .sort((a, b) => new Date(b.taken_time) - new Date(a.taken_time));
      
      if (takenDoses.length > 0) {
        setLastTaken(takenDoses[0]);
      }
      
    } catch (error) {
      console.error('Failed to load medication data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <Card
      onClick={() => (window.location.href = createPageUrl('Meds'))}
      role="button"
      tabIndex={0}
      className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.22)] transition-colors !rounded-[var(--panel-radius)]"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-green-400" />
          Medication Reminders
        </CardTitle>
        <Button
          asChild
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Link to={createPageUrl('Meds')}>
            Manage <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse bg-slate-800/50 h-16 rounded-lg"></div>
        ) : upcomingMeds.length > 0 ? (
          <div className="space-y-3">
            {upcomingMeds.slice(0, 3).map((med) => (
              <div key={med.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-200">{med.name}</h4>
                  <p className="text-sm text-slate-400">
                    Due: {format(new Date(med.scheduled_time), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            {lastTaken && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-sm text-slate-400">
                  Last taken: <span className="text-slate-300">{lastTaken.name}</span> • {getRelativeTime(lastTaken.taken_time)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Pill className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>All caught up!</p>
            <p className="text-sm">No meds due within the hour</p>
            {lastTaken && (
              <p className="text-sm mt-2 text-slate-400">
                Last taken: {getRelativeTime(lastTaken.taken_time)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
