
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task } from '@/entities/Task';
import StatusChip from '../shared/StatusChip';
import { CheckSquare, Calendar, User, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function MostImportantTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const allTasks = await Task.list();
      
      // Priority scoring: urgent=4, high=3, normal=2, low=1
      const priorityScore = { urgent: 4, high: 3, normal: 2, low: 1 };
      
      // Filter out completed tasks and sort by priority + due date
      const sortedTasks = allTasks
        .filter(task => task.status !== 'done')
        .sort((a, b) => {
          const scoreA = priorityScore[a.priority] || 0;
          const scoreB = priorityScore[b.priority] || 0;
          
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          // If same priority, sort by due date (earlier first)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          
          return 0;
        })
        .slice(0, 5);
        
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      onClick={() => (window.location.href = createPageUrl('Tasklist'))}
      role="button"
      tabIndex={0}
      className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-colors !rounded-[var(--panel-radius)]"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-orange-400" />
          Most Important Tasks
        </CardTitle>
        <Button
          onClick={(e) => { e.stopPropagation(); window.location.href = createPageUrl('Tasklist'); }}
          variant="ghost"
          size="sm"
        >
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-800/50 h-16 rounded-lg"></div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-200 truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusChip status={task.priority} />
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.assigneeId && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3 h-3" />
                        Assigned
                      </div>
                    )}
                  </div>
                </div>
                <StatusChip status={task.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>No tasks yet. You're all caught up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
