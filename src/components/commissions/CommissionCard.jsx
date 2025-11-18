import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, User } from "lucide-react";

const statusColors = {
  requested: "bg-yellow-900/50 text-yellow-300 border-yellow-500/20",
  waitlisted: "bg-orange-900/50 text-orange-300 border-orange-500/20",
  accepted: "bg-blue-900/50 text-blue-300 border-blue-500/20",
  sketch: "bg-purple-900/50 text-purple-300 border-purple-500/20",
  wip: "bg-indigo-900/50 text-indigo-300 border-indigo-500/20",
  revisions: "bg-amber-900/50 text-amber-300 border-amber-500/20",
  final: "bg-cyan-900/50 text-cyan-300 border-cyan-500/20",
  completed: "bg-emerald-900/50 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-rose-900/50 text-rose-300 border-rose-500/20"
};

export default function CommissionCard({ commission, onClick }) {
  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD';
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)] hover:border-slate-700 group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="aspect-square bg-slate-800/50 rounded-t-[var(--panel-radius)] overflow-hidden relative">
          {commission.thumbnail ? (
            <img
              src={commission.thumbnail}
              alt={`${commission.type} by ${commission.artist}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <User className="w-16 h-16" />
            </div>
          )}
          
          {/* Status overlay */}
          <div className="absolute top-3 left-3">
            <Badge className={`${statusColors[commission.status]} font-medium !rounded-full text-xs`}>
              {commission.status.toUpperCase()}
            </Badge>
          </div>

          {/* Deadline warning */}
          {commission.deadline && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-slate-900/80 border-slate-600 text-slate-300">
                {formatDeadline(commission.deadline)}
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-slate-100 truncate">{commission.artist}</h3>
            <p className="text-sm text-slate-400 capitalize">{commission.type} • {commission.platform}</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <DollarSign className="w-3 h-3" />
              <span>{formatCurrency(commission.payment)}</span>
            </div>
            {commission.usage_rights && (
              <Badge variant="outline" className="text-xs">
                {commission.usage_rights.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {commission.category && (
            <div className="pt-2 border-t border-slate-800">
              <Badge className="bg-slate-700/50 text-slate-300 text-xs">
                {commission.category.replace('_', ' ')}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}