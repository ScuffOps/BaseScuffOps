import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image } from 'lucide-react';

export default function AssetCard({ asset, onCardClick }) {
  return (
    <Card 
      className="cursor-pointer group overflow-hidden bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-colors"
      onClick={() => onCardClick(asset)}
    >
      <CardContent className="p-0">
        <div className="aspect-square w-full bg-slate-800 flex items-center justify-center">
          {asset.thumb500 ? (
            <img src={asset.thumb500} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <Image className="w-16 h-16 text-slate-600" />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold truncate text-slate-100">{asset.title}</h3>
          <p className="text-sm text-slate-400 truncate">{asset.artist || 'N/A'}</p>
          {asset.tags && asset.tags.length > 0 && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">{asset.tags[0]}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}