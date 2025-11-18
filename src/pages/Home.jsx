
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Brain, 
  AlertTriangle, 
  Play, 
  Lightbulb, 
  ArrowRight
} from 'lucide-react';
import MostImportantTasks from '../components/home/MostImportantTasks';
import KPIDashboard from '../components/home/KPIDashboard';
import DailyTips from '../components/home/DailyTips';
import MedicationReminders from '../components/home/MedicationReminders';

export default function Home() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Good morning! 👋</h1>
          <p className="text-slate-400 mt-1">Here's what needs your attention today</p>
        </div>
        <Button asChild size="lg" className="bg-[#1b61d1]/50 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-[#1b61d1]/70 transition-all duration-300 !rounded-[var(--button-radius)]">
          <Link to={createPageUrl('BrainDump')}>
            <Brain className="w-5 h-5 mr-2" />
            Brain Dump
          </Link>
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Key Performance Indicators</h2>
        <KPIDashboard />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Most Important Tasks */}
          <MostImportantTasks />

          {/* Priority Alerts */}
          <Card
            onClick={() => (window.location.href = createPageUrl('Tasklist'))}
            role="button"
            tabIndex={0}
            className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_22px_rgba(245,158,11,0.22)] !rounded-[var(--panel-radius)]"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Priority Alerts
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to={createPageUrl('Tasklist')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No critical alerts right now</p>
                <p className="text-sm">You're doing great!</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Stream Activity */}
          <Card
            onClick={() => (window.location.href = createPageUrl('Logs'))}
            role="button"
            tabIndex={0}
            className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_22px_rgba(245,158,11,0.18)] !rounded-[var(--panel-radius)]"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-400" />
                Recent Stream Activity
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to={createPageUrl('Logs')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Play className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No recent streams logged</p>
                <p className="text-sm">Time for your next stream?</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Daily Tips */}
          <DailyTips />

          {/* Top Ideas */}
          <Card
            onClick={() => (window.location.href = createPageUrl('Ideas'))}
            role="button"
            tabIndex={0}
            className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_22px_rgba(245,158,11,0.22)] !rounded-[var(--panel-radius)]"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Top 3 Ideas
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to={createPageUrl('Ideas')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No ideas yet</p>
                <p className="text-sm">Got something brewing?</p>
              </div>
            </CardContent>
          </Card>

          {/* Medication Reminders */}
          <MedicationReminders />
        </div>
      </div>
    </div>
  );
}
