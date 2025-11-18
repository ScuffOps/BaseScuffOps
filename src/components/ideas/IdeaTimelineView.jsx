import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export default function IdeaTimelineView({ ideas, onIdeaClick }) {
  const items = useMemo(() => {
    // Prefer updatedAt if available, else created_date
    return [...ideas]
      .map(i => ({
        ...i,
        ts: i.updatedAt ? new Date(i.updatedAt).getTime() : new Date(i.created_date || Date.now()).getTime()
      }))
      .sort((a, b) => b.ts - a.ts);
  }, [ideas]);

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700/40" />
      <div className="space-y-4">
        {items.map((idea) => (
          <div key={idea.id} className="relative">
            <div className="absolute -left-[7px] top-4 w-3 h-3 rounded-full bg-[var(--color-gold)] shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            <Card
              onClick={() => onIdeaClick && onIdeaClick(idea)}
              className="cursor-pointer bg-slate-900/60 border-slate-800/60 hover:border-slate-700/70 transition-colors !rounded-[var(--panel-radius)]"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-100">{idea.title}</h3>
                  <span className="text-xs text-slate-400">{formatDate(idea.ts)}</span>
                </div>
                {idea.ai_synopsis && (
                  <p className="text-sm text-slate-300 mt-2 line-clamp-2">{idea.ai_synopsis}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {idea.category && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {idea.category}
                    </span>
                  )}
                  {idea.priority && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {idea.priority} priority
                    </span>
                  )}
                  {idea.impact && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {idea.impact} impact
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-slate-500 py-12">No ideas to show on the timeline.</div>
        )}
      </div>
    </div>
  );
}