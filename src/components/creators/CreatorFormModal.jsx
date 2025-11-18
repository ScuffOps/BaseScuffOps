
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Upload, Loader2 } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function CreatorFormModal({ creator, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: creator?.name || '',
    handle: creator?.handle || '',
    avatar: creator?.avatar || '',
    email: creator?.email || '',
    discord_handle: creator?.discord_handle || '',
    platform: creator?.platform || 'twitch',
    status: creator?.status || 'pending',
    tier: creator?.tier || 'bronze',
    follower_count: creator?.follower_count || 0,
    engagement_rate: creator?.engagement_rate || 0,
    tags: creator?.tags || [],
    notes: creator?.notes || '',
  });
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      handleInputChange('tags', [...formData.tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('avatar', file_url);
    } catch (error) {
      console.error("Avatar upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl form-container popup-surface">
        <DialogHeader>
          <DialogTitle>{creator ? 'Edit Creator' : 'Add New Creator'}</DialogTitle>
          <DialogDescription>Fill in the details for the creator.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            <Button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Avatar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Full Name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
            <Input placeholder="@handle" value={formData.handle} onChange={e => handleInputChange('handle', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Email Address" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
            <Input placeholder="Discord Handle" value={formData.discord_handle} onChange={e => handleInputChange('discord_handle', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={formData.platform} onValueChange={value => handleInputChange('platform', value)}>
              <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twitch">Twitch</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.status} onValueChange={value => handleInputChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Follower Count" type="number" value={formData.follower_count} onChange={e => handleInputChange('follower_count', parseInt(e.target.value, 10) || 0)} />
            <Input placeholder="Engagement Rate (%)" type="number" step="0.1" value={formData.engagement_rate} onChange={e => handleInputChange('engagement_rate', parseFloat(e.target.value) || 0)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a tag" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <Button type="button" onClick={addTag}>Add Tag</Button>
            </div>
          </div>

          <Textarea placeholder="Notes..." value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} />

          <div className="flex justify-end pt-4">
            <Button type="submit">Save Creator</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
