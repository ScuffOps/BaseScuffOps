import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Clock, Users, AlertTriangle } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const PEAK_HOURS = ['18:00', '19:00', '20:00', '21:00', '22:00']; // 6-10 PM

export default function CoverageAnalytics({ teamMembers }) {
  const analytics = useMemo(() => {
    const activeMembers = teamMembers.filter(m => m.status === 'active');
    let totalCoverage = 0;
    let peakCoverage = 0;
    let totalSlots = 0;
    let peakSlots = 0;
    
    const hourlyStats = {};
    const dailyStats = {};
    const memberWorkloads = {};

    // Initialize stats
    TIME_SLOTS.forEach(time => {
      hourlyStats[time] = { total: 0, members: [] };
    });

    DAYS.forEach(day => {
      dailyStats[day] = { coverage: 0, totalSlots: TIME_SLOTS.length, averageMods: 0 };
    });

    activeMembers.forEach(member => {
      memberWorkloads[member.id] = { 
        name: member.name, 
        totalHours: 0, 
        peakHours: 0,
        days: {} 
      };
    });

    // Calculate coverage statistics
    DAYS.forEach(day => {
      TIME_SLOTS.forEach(time => {
        const assignedMembers = activeMembers.filter(member =>
          member.availability && 
          member.availability[day] && 
          member.availability[day].includes(time)
        );

        const memberCount = assignedMembers.length;
        totalSlots++;
        
        if (memberCount > 0) {
          totalCoverage++;
          dailyStats[day].coverage++;
        }

        // Peak hours analysis
        if (PEAK_HOURS.includes(time)) {
          peakSlots++;
          if (memberCount > 0) {
            peakCoverage++;
          }
        }

        // Hourly statistics
        hourlyStats[time].total += memberCount;
        hourlyStats[time].members.push(...assignedMembers.map(m => m.name));

        // Member workload
        assignedMembers.forEach(member => {
          memberWorkloads[member.id].totalHours++;
          if (PEAK_HOURS.includes(time)) {
            memberWorkloads[member.id].peakHours++;
          }
          if (!memberWorkloads[member.id].days[day]) {
            memberWorkloads[member.id].days[day] = 0;
          }
          memberWorkloads[member.id].days[day]++;
        });

        dailyStats[day].averageMods += memberCount;
      });
      
      dailyStats[day].averageMods /= TIME_SLOTS.length;
    });

    // Find peak and low coverage hours
    const sortedHours = TIME_SLOTS.map(time => ({
      time,
      coverage: hourlyStats[time].total,
      uniqueMembers: [...new Set(hourlyStats[time].members)].length
    })).sort((a, b) => b.coverage - a.coverage);

    const peakHours = sortedHours.slice(0, 5);
    const lowHours = sortedHours.slice(-5).reverse();

    return {
      overallCoverage: (totalCoverage / totalSlots) * 100,
      peakCoverage: (peakCoverage / peakSlots) * 100,
      totalActiveMembers: activeMembers.length,
      dailyStats,
      hourlyStats,
      memberWorkloads: Object.values(memberWorkloads),
      peakHours,
      lowHours,
      averageModsPerSlot: totalCoverage > 0 ? Object.values(hourlyStats).reduce((sum, h) => sum + h.total, 0) / totalSlots : 0
    };
  }, [teamMembers]);

  const getCoverageStatus = (percentage) => {
    if (percentage >= 80) return { status: 'excellent', color: 'text-green-400', icon: TrendingUp };
    if (percentage >= 60) return { status: 'good', color: 'text-blue-400', icon: TrendingUp };
    if (percentage >= 40) return { status: 'fair', color: 'text-amber-400', icon: TrendingDown };
    return { status: 'poor', color: 'text-red-400', icon: AlertTriangle };
  };

  const overallStatus = getCoverageStatus(analytics.overallCoverage);
  const peakStatus = getCoverageStatus(analytics.peakCoverage);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Overall Coverage</p>
                <p className="text-2xl font-bold text-slate-100">{analytics.overallCoverage.toFixed(1)}%</p>
              </div>
              <div className={`p-3 rounded-full bg-slate-800/50 ${overallStatus.color}`}>
                <overallStatus.icon className="w-6 h-6" />
              </div>
            </div>
            <Progress value={analytics.overallCoverage} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Peak Hours Coverage</p>
                <p className="text-2xl font-bold text-slate-100">{analytics.peakCoverage.toFixed(1)}%</p>
              </div>
              <div className={`p-3 rounded-full bg-slate-800/50 ${peakStatus.color}`}>
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <Progress value={analytics.peakCoverage} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Moderators</p>
                <p className="text-2xl font-bold text-slate-100">{analytics.totalActiveMembers}</p>
              </div>
              <div className="p-3 rounded-full bg-slate-800/50 text-blue-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Avg Mods/Hour</p>
                <p className="text-2xl font-bold text-slate-100">{analytics.averageModsPerSlot.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-full bg-slate-800/50 text-purple-400">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader>
          <CardTitle>Daily Coverage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DAYS.map(day => {
              const stats = analytics.dailyStats[day];
              const coveragePercent = (stats.coverage / stats.totalSlots) * 100;
              const status = getCoverageStatus(coveragePercent);
              
              return (
                <div key={day} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold capitalize text-slate-100">{day}</h3>
                    <Badge variant="outline" className={status.color}>
                      {coveragePercent.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={coveragePercent} className="mb-2" />
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Avg: {stats.averageMods.toFixed(1)} mods</span>
                    <span>{stats.coverage}/{stats.totalSlots} hours covered</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Peak vs Low Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Peak Coverage Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.peakHours.map((hour, index) => (
                <div key={hour.time} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-300 border-green-500/30">
                      #{index + 1}
                    </Badge>
                    <span className="font-mono text-slate-200">{hour.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">{hour.coverage} total assignments</div>
                    <div className="text-xs text-slate-500">{hour.uniqueMembers} unique mods</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Low Coverage Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.lowHours.map((hour, index) => (
                <div key={hour.time} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-red-300 border-red-500/30">
                      #{index + 1}
                    </Badge>
                    <span className="font-mono text-slate-200">{hour.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">{hour.coverage} total assignments</div>
                    <div className="text-xs text-slate-500">{hour.uniqueMembers} unique mods</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Workload Distribution */}
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader>
          <CardTitle>Member Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.memberWorkloads
              .sort((a, b) => b.totalHours - a.totalHours)
              .map(member => (
                <div key={member.name} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-100">{member.name}</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-300">
                        <strong>{member.totalHours}h</strong> total
                      </span>
                      <span className="text-amber-300">
                        <strong>{member.peakHours}h</strong> peak
                      </span>
                    </div>
                  </div>
                  <Progress value={(member.totalHours / (DAYS.length * TIME_SLOTS.length)) * 100} className="mb-2" />
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(member.days).map(([day, hours]) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {day.substr(0, 3)}: {hours}h
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}