import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Edit, Archive } from 'lucide-react';

export default function AssetDetailModal({ asset, isOpen, onClose, onEdit, onArchive }) {
  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{asset.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <img src={asset.url} alt={asset.title} className="w-full h-auto max-h-[70vh] object-contain rounded-lg" />
          <div className="mt-4 space-y-2">
            <p><strong>Board:</strong> {asset.board}</p>
            <p><strong>Artist:</strong> {asset.artist}</p>
            <div className="flex flex-wrap gap-2">
              {asset.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </div>
        </div>
        <DialogFooter className="justify-between">
          <div>
            <Button variant="outline" onClick={() => onEdit(asset)}><Edit className="w-4 h-4 mr-2"/>Edit</Button>
            <Button variant="destructive" className="ml-2" onClick={() => onArchive(asset)}><Archive className="w-4 h-4 mr-2"/>Archive</Button>
          </div>
          <Button asChild>
            <a href={asset.url} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" /> Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}