
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const PEAK_HOURS = ['18:00', '19:00', '20:00', '21:00', '22:00']; // define peak for "working" count

export default function ScheduleChecker({ teamMembers }) {
  const [selectedDay, setSelectedDay] = useState('monday');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1); // Set to the first day of the current month
    return d;
  });

  const scheduleMatrix = useMemo(() => {
    const matrix = {};
    
    DAYS.forEach(day => {
      matrix[day] = {};
      TIME_SLOTS.forEach(time => {
        matrix[day][time] = teamMembers.filter(member => 
          member.availability && 
          member.availability[day] && 
          member.availability[day].includes(time) &&
          member.status === 'active'
        );
      });
    });
    
    return matrix;
  }, [teamMembers]);

  const getCoverageLevel = (memberCount) => {
    if (memberCount === 0) return 'none';
    if (memberCount === 1) return 'minimal';
    if (memberCount === 2) return 'adequate';
    return 'optimal';
  };

  const getCoverageColor = (level) => {
    switch (level) {
      case 'none': return 'bg-red-500/20 border-red-500/40 text-red-300';
      case 'minimal': return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      case 'adequate': return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'optimal': return 'bg-green-500/20 border-green-500/40 text-green-300';
      default: return 'bg-slate-500/20 border-slate-500/40 text-slate-300';
    }
  };

  const dayStats = useMemo(() => {
    return DAYS.map(day => {
      const dayData = scheduleMatrix[day];
      const totalSlots = TIME_SLOTS.length;
      const coveredSlots = TIME_SLOTS.filter(time => dayData[time].length > 0).length;
      const averageCoverage = TIME_SLOTS.reduce((acc, time) => acc + dayData[time].length, 0) / totalSlots;
      
      return {
        day,
        coverage: (coveredSlots / totalSlots) * 100,
        averageMods: averageCoverage,
        uncoveredSlots: totalSlots - coveredSlots
      };
    });
  }, [scheduleMatrix]);

  // Helpers for Month view
  const weekdayIndexToName = (idx) => {
    // 0: Sunday, 1: Monday, ..., 6: Saturday
    const map = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    return map[idx];
  };

  function getWeekdaySummary(dayName) {
    const data = scheduleMatrix[dayName] || {};
    const totalSlots = TIME_SLOTS.length;
    if (totalSlots === 0) return { coveragePct: 0, availableCount: 0, workingCount: 0 }; // Avoid division by zero

    const coveredSlots = TIME_SLOTS.filter(t => (data[t] || []).length > 0).length;

    const availableSet = new Set();
    const workingSet = new Set();
    TIME_SLOTS.forEach(t => {
      const members = data[t] || [];
      members.forEach(m => availableSet.add(m.id));
      if (PEAK_HOURS.includes(t)) {
        members.forEach(m => workingSet.add(m.id));
      }
    });

    return {
      coveragePct: (coveredSlots / totalSlots) * 100,
      availableCount: availableSet.size,
      workingCount: workingSet.size
    };
  }

  const monthMeta = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // Last day of the current month
    const daysInMonth = end.getDate();
    const firstWeekday = start.getDay(); // 0=Sun..6=Sat

    const cells = [];
    // Leading blanks for days before the 1st of the month
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    // Actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // Trailing blanks to fill the last row (ensure 6 rows if needed, or just fill out the current week)
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    // Adjust to have maximum 6 rows (42 cells) to keep calendar consistent for all months.
    // While this isn't strictly necessary for a functional calendar, it prevents layout shifts.
    while (cells.length < 42) {
        cells.push(null);
    }


    return { year, month, daysInMonth, firstWeekday, cells };
  }, [currentMonth]);

  const coverageToBg = (pct) => {
    if (pct >= 80) return 'bg-green-500/15 border-green-500/20';
    if (pct >= 60) return 'bg-blue-500/15 border-blue-500/20';
    if (pct >= 40) return 'bg-amber-500/15 border-amber-500/20';
    if (pct > 0) return 'bg-red-500/15 border-red-500/20';
    return 'bg-slate-800/40 border-slate-700/40';
  };

  const changeMonth = (delta) => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const next = new Date(y, m + delta, 1);
    setCurrentMonth(next);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="week" className="space-y-6">
        <TabsList className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <TabsTrigger value="week" className="!rounded-[var(--button-radius)]">Week</TabsTrigger>
          <TabsTrigger value="month" className="!rounded-[var(--button-radius)]">Month</TabsTrigger>
        </TabsList>

        {/* WEEK VIEW */}
        <TabsContent value="week" className="space-y-6">
          {/* Day Selection */}
          <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Weekly Schedule Overview
              </CardTitle>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-300">View Day:</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-40 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 !rounded-[var(--button-radius)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>
                        <span className="capitalize">{day}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Coverage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dayStats.map(stat => (
              <Card
                key={stat.day}
                onClick={() => setSelectedDay(stat.day)}
                className={`bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 !rounded-[var(--panel-radius)] cursor-pointer hover:ring-2 hover:ring-purple-500/40 transition ${
                  stat.day === selectedDay ? 'ring-2 ring-purple-500/60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold capitalize text-slate-100">{stat.day}</h3>
                    {stat.uncoveredSlots > 0 && (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Coverage:</span>
                      <span className="text-slate-200">{stat.coverage.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Avg Mods:</span>
                      <span className="text-slate-200">{stat.averageMods.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Uncovered:</span>
                      <span className="text-slate-200">{stat.uncoveredSlots}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Schedule */}
          <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="capitalize">{selectedDay} Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {TIME_SLOTS.map(time => {
                  const assignedMembers = scheduleMatrix[selectedDay][time];
                  const coverageLevel = getCoverageLevel(assignedMembers.length);
                  return (
                    <Card 
                      key={time} 
                      className={`border transition-all duration-200 !rounded-[var(--panel-radius)] ${getCoverageColor(coverageLevel)}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold font-mono">{time}</h4>
                          <Badge variant="outline" className={getCoverageColor(coverageLevel)}>
                            {assignedMembers.length} mod{assignedMembers.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {assignedMembers.length > 0 ? (
                            assignedMembers.map(member => (
                              <div key={member.id} className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={member.profileUrl} />
                                  <AvatarFallback className="text-xs">
                                    {member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">No coverage</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MONTH VIEW */}
        <TabsContent value="month" className="space-y-6">
          <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>
                    {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/40"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/40"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 text-xs font-medium text-slate-400 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="px-2 py-1 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthMeta.cells.map((date, idx) => {
                  if (!date) {
                    return <div key={`blank-${idx}`} className="h-24 rounded-lg bg-slate-900/20 border border-slate-800/30" />;
                  }
                  const weekdayName = weekdayIndexToName(date.getDay());
                  const { coveragePct, availableCount, workingCount } = getWeekdaySummary(weekdayName);
                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-24 rounded-lg p-2 border ${coverageToBg(coveragePct)} hover:bg-white/5 transition-colors cursor-pointer`}
                      onClick={() => setSelectedDay(weekdayName)}
                      title={`Available: ${availableCount} | Working (peak): ${workingCount}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{date.getDate()}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {coveragePct.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 rounded bg-slate-800/60 overflow-hidden">
                          <div
                            className="h-2 bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-gold)]"
                            style={{ width: `${Math.min(100, Math.max(0, coveragePct))}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {availableCount} avail • {workingCount} working
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Tip: Click a day cell to update the Week view's selected day.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
