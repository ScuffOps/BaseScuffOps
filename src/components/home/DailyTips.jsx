
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tip } from '@/entities/Tip';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';

export default function DailyTips() {
  const [tips, setTips] = useState({});
  const [currentTip, setCurrentTip] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, []);

  useEffect(() => {
    if (Object.keys(tips).length > 0) {
      const availableTips = selectedCategory === 'all' 
        ? Object.values(tips).flat()
        : tips[selectedCategory] || [];
        
      if (availableTips.length > 0) {
        const randomTip = availableTips[Math.floor(Math.random() * availableTips.length)];
        setCurrentTip(randomTip);
      } else {
        setCurrentTip(null); // No tips in the selected category
      }
    } else {
      setCurrentTip(null); // No tips loaded at all
    }
  }, [tips, selectedCategory]);

  const loadTips = async () => {
    try {
      const allTips = await Tip.list();
      const groupedTips = allTips.reduce((acc, tip) => {
        if (!acc[tip.category]) acc[tip.category] = [];
        acc[tip.category].push(tip);
        return acc;
      }, {});
      
      setTips(groupedTips);
    } catch (error) {
      console.error('Failed to load tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectRandomTip = () => {
    const availableTips = selectedCategory === 'all' 
      ? Object.values(tips).flat()
      : tips[selectedCategory] || [];
      
    if (availableTips.length > 0) {
      const randomTip = availableTips[Math.floor(Math.random() * availableTips.length)];
      setCurrentTip(randomTip);
    } else {
      setCurrentTip(null);
    }
  };

  const categories = ['all', ...Object.keys(tips)];

  return (
    <Card
      onClick={() => (window.location.href = createPageUrl('Settings'))}
      role="button"
      tabIndex={0}
      className="cursor-pointer bg-slate-900/80 border-slate-800/60 hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.22)] transition-colors !rounded-[var(--panel-radius)]"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Daily Tips
        </CardTitle>
        <Button onClick={(e) => { e.stopPropagation(); selectRandomTip(); }} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="moderating">Mod</TabsTrigger>
            <TabsTrigger value="adhd">ADHD</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="people_handling">People</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {isLoading ? (
              <div className="animate-pulse bg-slate-800/50 h-24 rounded-lg"></div>
            ) : currentTip ? (
              <div className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="font-semibold text-slate-200 mb-2">{currentTip.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{currentTip.content}</p>
                <div className="mt-3">
                  <span className="inline-block bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs capitalize">
                    {currentTip.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No tips available for this category</p>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
