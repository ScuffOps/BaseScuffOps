import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandAsset } from '@/entities/BrandAsset';
import { UploadFile } from '@/integrations/Core';
import { Loader2, Upload } from 'lucide-react';

export default function AssetFormModal({ isOpen, onClose, onUpdate, asset, boards }) {
  const [formData, setFormData] = useState({
    title: asset?.title || '',
    board: asset?.board || '',
    category: asset?.category || '',
    tags: asset?.tags?.join(', ') || '',
    artist: asset?.artist || '',
    platform: asset?.platform || '',
    url: asset?.url || '',
    thumb500: asset?.thumb500 || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        url: file_url,
        thumb500: file_url // Using same for both for simplicity
      }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const dataToSubmit = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (asset) {
      await BrandAsset.update(asset.id, dataToSubmit);
    } else {
      await BrandAsset.create(dataToSubmit);
    }
    onUpdate();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Upload New Asset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            placeholder="Asset Title" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
          />
          <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg text-center">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {formData.url ? 'Change File' : 'Upload File'}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            {formData.url && <p className="text-xs text-slate-400 mt-2">File uploaded successfully.</p>}
          </div>
          <Select value={formData.board} onValueChange={value => setFormData({...formData, board: value})}>
            <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
            <SelectContent>
              {boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          <Input placeholder="Tags (comma-separated)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
          <Input placeholder="Artist" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? 'Uploading...' : (asset ? 'Save Changes' : 'Create Asset')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}