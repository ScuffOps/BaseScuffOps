import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle } from 'lucide-react';
import { TeamMember } from '@/entities/all';

const ONBOARDING_TASKS_TEMPLATE = [
  { title: "Fill out your team member profile", deepLink: "/team" },
  { title: "Set your weekly availability", deepLink: "/team?tab=schedule" },
  { title: "Read the Mod Handbook", deepLink: "/team?tab=handbook" },
  { title: "Create a test task", deepLink: "/tasks" }
];

export default function OnboardingTracker({ teamMembers, currentUser, onUpdate }) {
  const handleTaskToggle = async (member, taskTitle) => {
    const existingTasks = member.onboarding_tasks || ONBOARDING_TASKS_TEMPLATE.map(t => ({...t, completed: false}));
    const newTasks = existingTasks.map(task => 
      task.title === taskTitle ? { ...task, completed: !task.completed } : task
    );
    await TeamMember.update(member.id, { onboarding_tasks: newTasks });
    onUpdate();
  };

  const getProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return (completed / tasks.length) * 100;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamMembers.map(member => (
        <Card key={member.id} className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
          <CardHeader>
            <CardTitle>{member.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={getProgress(member.onboarding_tasks)} className="w-full" />
              <span className="text-sm font-semibold">{getProgress(member.onboarding_tasks).toFixed(0)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(member.onboarding_tasks || ONBOARDING_TASKS_TEMPLATE).map(task => (
              <div key={task.title} className="flex items-center gap-3">
                <button 
                  onClick={() => currentUser?.role === 'admin' && handleTaskToggle(member, task.title)}
                  disabled={currentUser?.role !== 'admin'}
                  className="disabled:cursor-not-allowed"
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                {task.deepLink ? (
                  <Link to={createPageUrl(task.deepLink.substring(1))} className="text-slate-300 hover:text-slate-100 flex-1">
                    {task.title}
                  </Link>
                ) : (
                  <span className="text-slate-300 flex-1">{task.title}</span>
                )}
              </div>
            ))}
            {(!member.onboarding_tasks && currentUser?.role === 'admin') && (
                 <Button size="sm" onClick={() => handleTaskToggle(member, '')}>Assign Tasks</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}