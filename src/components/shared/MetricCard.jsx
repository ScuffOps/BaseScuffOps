
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color = "blue" 
}) {
  const isPositive = change > 0;
  
  return (
    <Card className="relative overflow-hidden gold-frame !rounded-[var(--panel-radius)]">
      <div className="absolute top-0 right-0 w-36 h-36 opacity-10 rounded-full"
           style={{ background: 'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.35), transparent 60%)' }} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-300">
          {title}
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
          <Icon className="h-4 w-4 text-amber-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-50 mb-2">
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-sm">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1 text-rose-400" />
            )}
            <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-slate-500 ml-1">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
