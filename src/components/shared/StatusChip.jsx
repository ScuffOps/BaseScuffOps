import { Badge } from "@/components/ui/badge";

const chipColors = {
  // Creator statuses
  active: "bg-emerald-900/50 text-emerald-300 border-emerald-500/20",
  pending: "bg-amber-900/50 text-amber-300 border-amber-500/20", 
  paused: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  inactive: "bg-rose-900/50 text-rose-300 border-rose-500/20",
  
  // Content statuses
  draft: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  in_review: "bg-blue-900/50 text-blue-300 border-blue-500/20",
  approved: "bg-emerald-900/50 text-emerald-300 border-emerald-500/20",
  scheduled: "bg-purple-900/50 text-purple-300 border-purple-500/20",
  published: "bg-green-900/50 text-green-300 border-green-500/20",
  rejected: "bg-rose-900/50 text-rose-300 border-rose-500/20",
  
  // Commission statuses
  requested: "bg-blue-900/50 text-blue-300 border-blue-500/20",
  accepted: "bg-sky-900/50 text-sky-300 border-sky-500/20",
  sketch: "bg-purple-900/50 text-purple-300 border-purple-500/20",
  wip: "bg-yellow-900/50 text-yellow-300 border-yellow-500/20",
  revisions: "bg-orange-900/50 text-orange-300 border-orange-500/20",
  final: "bg-indigo-900/50 text-indigo-300 border-indigo-500/20",

  // New Statuses
  todo: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  inprogress: "bg-yellow-900/50 text-yellow-300 border-yellow-500/20",
  done: "bg-sky-900/50 text-sky-300 border-sky-500/20",

  // Campaign statuses  
  planning: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  completed: "bg-emerald-900/50 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-rose-900/50 text-rose-300 border-rose-500/20",
  
  // Priority levels
  low: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  normal: "bg-green-900/50 text-green-300 border-green-500/20",
  medium: "bg-amber-900/50 text-amber-300 border-amber-500/20",
  high: "bg-orange-900/50 text-orange-300 border-orange-500/20", 
  urgent: "bg-red-900/50 text-red-300 border-red-500/20",
  
  // Tiers
  bronze: "bg-amber-900/50 text-amber-300 border-amber-500/20",
  silver: "bg-slate-700/50 text-slate-300 border-slate-500/20",
  gold: "bg-yellow-900/50 text-yellow-300 border-yellow-500/20",
  platinum: "bg-purple-900/50 text-purple-300 border-purple-500/20",
  
  // Roles
  admin: "bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-navy)] text-white border-transparent",
  leadmod: "bg-yellow-900/50 text-yellow-300 border-yellow-500/20",
  mod: "bg-red-900/80 text-red-200 border-red-500/20",
  viewer: "bg-blue-900/50 text-blue-300 border-blue-500/20"
};

export default function StatusChip({ status, className = "" }) {
  const normalizedStatus = (status || "").toLowerCase().replace(/ /g, "");
  const colorClass = chipColors[normalizedStatus] || chipColors.inactive;
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} font-semibold px-2.5 py-1 text-xs rounded-full border ${className}`}
    >
      {status?.replace(/_/g, ' ').toUpperCase()}
    </Badge>
  );
}