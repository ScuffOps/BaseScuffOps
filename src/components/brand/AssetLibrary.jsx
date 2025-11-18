
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { BrandAsset } from '@/entities/BrandAsset';
import AssetCard from './AssetCard';
import AssetFormModal from './AssetFormModal';
import AssetDetailModal from './AssetDetailModal';

const BOARDS = ["Logos", "Palettes", "Lore", "Artist Refs", "Character Sheets", "Tattoos", "Overlays", "Media Kits", "Other", "Debut"];

export default function AssetLibrary({ assets, onUpdate }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [viewingAsset, setViewingAsset] = useState(null);

  const handleEdit = (asset) => {
    setViewingAsset(null);
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleArchive = async (asset) => {
    await BrandAsset.update(asset.id, { status: 'archived' });
    onUpdate();
    setViewingAsset(null);
  };
  
  const filteredAssets = assets
    .filter(asset => asset.status !== 'archived')
    .filter(asset => filter === 'All' || asset.board === filter)
    .filter(asset => 
      !search || 
      asset.title.toLowerCase().includes(search.toLowerCase()) ||
      (asset.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
      asset.artist?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Card className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Boards</SelectItem>
                {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditingAsset(null); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} onCardClick={() => setViewingAsset(asset)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <p>No assets found for this board.</p>
          </div>
        )}
      </CardContent>
      {isFormOpen && (
        <AssetFormModal 
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingAsset(null); }}
          onUpdate={onUpdate}
          asset={editingAsset}
          boards={BOARDS}
        />
      )}
      {viewingAsset && (
        <AssetDetailModal
          asset={viewingAsset}
          isOpen={!!viewingAsset}
          onClose={() => setViewingAsset(null)}
          onEdit={handleEdit}
          onArchive={handleArchive}
        />
      )}
    </Card>
  );
}
