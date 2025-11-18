import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIORITIES = ['High', 'Medium', 'Low'];
const IMPACTS = ['High', 'Medium', 'Low'];

export default function IdeaPriorityMatrix({ ideas, onIdeaClick }) {
  const buckets = useMemo(() => {
    const map = {};
    IMPACTS.forEach(i => {
      PRIORITIES.forEach(p => {
        map[`${i}-${p}`] = [];
      });
    });
    ideas.forEach(idea => {
      const p = PRIORITIES.includes(idea.priority) ? idea.priority : 'Medium';
      const i = IMPACTS.includes(idea.impact) ? idea.impact : 'Medium';
      map[`${i}-${p}`].push(idea);
    });
    return map;
  }, [ideas]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-2">
        {/* Header row */}
        <div />
        {PRIORITIES.map(p => (
          <div key={p} className="text-center text-xs uppercase tracking-wider text-slate-300">{p} Priority</div>
        ))}
        {/* Rows for impact */}
        {IMPACTS.map(impact => (
          <React.Fragment key={impact}>
            <div className="flex items-center justify-center text-xs uppercase tracking-wider text-slate-300">
              {impact} Impact
            </div>
            {PRIORITIES.map(priority => {
              const key = `${impact}-${priority}`;
              const list = buckets[key] || [];
              return (
                <Card key={key} className="min-h-[160px] bg-slate-900/50 border-slate-800/60 !rounded-[var(--panel-radius)]">
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs font-medium text-slate-400">
                      {list.length} item{list.length !== 1 ? 's' : ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col gap-2">
                      {list.slice(0, 6).map(idea => (
                        <button
                          key={idea.id}
                          onClick={() => onIdeaClick && onIdeaClick(idea)}
                          className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          <div className="text-sm text-slate-100 truncate">{idea.title}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {(idea.tags || []).slice(0, 3).join(' • ')}
                          </div>
                        </button>
                      ))}
                      {list.length > 6 && (
                        <div className="text-xs text-slate-500">+{list.length - 6} more</div>
                      )}
                      {list.length === 0 && (
                        <div className="text-xs text-slate-500">No items</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}