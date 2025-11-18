
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPI } from '@/entities/KPI';
import { DollarSign, Activity, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils'; // Added import

const KPI_CONFIGS = {
  revenue: { icon: DollarSign, color: 'text-emerald-400', label: 'Revenue' },
  productivity: { icon: Activity, color: 'text-blue-400', label: 'Productivity' },
  engagement: { icon: TrendingUp, color: 'text-purple-400', label: 'Engagement' }
};

function KPICard({ category, value, previousValue, onUpdate }) {
  const config = KPI_CONFIGS[category];
  const Icon = config.icon;
  const change = previousValue ? ((value - previousValue) / previousValue * 100) : 0;
  const isPositive = change >= 0;

  return (
    <Card
      onClick={() => (window.location.href = createPageUrl('Dashboard'))}
      role="button"
      tabIndex={0}
      className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_18px_rgba(245,158,11,0.22)]"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-slate-800 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()} // Stop propagation here
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}> {/* Stop propagation here */}
              <DialogHeader>
                <DialogTitle>Update {config.label}</DialogTitle>
              </DialogHeader>
              <KPIUpdateForm category={category} currentValue={value} onSave={onUpdate} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-slate-100">
            {category === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-400">{config.label}</div>
          {previousValue > 0 && (
            <div className="flex items-center text-sm">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-rose-500" />
              )}
              <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KPIUpdateForm({ category, currentValue, onSave }) {
  const [value, setValue] = useState(currentValue.toString());
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(category, parseFloat(value), notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">New Value</label>
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes (optional)</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What changed?"
        />
      </div>
      <Button type="submit" className="w-full">Update KPI</Button>
    </form>
  );
}

export default function KPIDashboard() {
  const [kpis, setKpis] = useState({
    revenue: { value: 0, previousValue: 0 },
    productivity: { value: 0, previousValue: 0 },
    engagement: { value: 0, previousValue: 0 }
  });

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allKpis = await KPI.list('-date');
      
      const latestKpis = {};
      ['revenue', 'productivity', 'engagement'].forEach(category => {
        const categoryKpis = allKpis.filter(kpi => kpi.category === category);
        if (categoryKpis.length > 0) {
          latestKpis[category] = {
            value: categoryKpis[0].value,
            previousValue: categoryKpis[1]?.value || 0
          };
        } else {
          latestKpis[category] = { value: 0, previousValue: 0 };
        }
      });
      
      setKpis(latestKpis);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    }
  };

  const handleKPIUpdate = async (category, newValue, notes) => {
    try {
      await KPI.create({
        metric_name: KPI_CONFIGS[category].label,
        value: newValue,
        previous_value: kpis[category].value,
        date: new Date().toISOString().split('T')[0],
        category,
        notes
      });
      
      await loadKPIs();
    } catch (error) {
      console.error('Failed to update KPI:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(kpis).map(([category, data]) => (
        <KPICard
          key={category}
          category={category}
          value={data.value}
          previousValue={data.previousValue}
          onUpdate={handleKPIUpdate}
        />
      ))}
    </div>
  );
}
