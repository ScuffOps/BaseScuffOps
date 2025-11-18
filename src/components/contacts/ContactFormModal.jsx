
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

export default function ContactFormModal({ isOpen, onClose, onSubmit, contact, allContacts }) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    category: contact?.category || 'Other',
    links: contact?.links || {},
    bio: contact?.bio || '',
    avatar: contact?.avatar || '',
    tags: contact?.tags || [],
    notes: contact?.notes || '',
    backlinks: contact?.backlinks || []
  });
  const [newLinkPlatform, setNewLinkPlatform] = useState('');
  const [newLinkValue, setNewLinkValue] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    // Reset form data when contact prop changes
    setFormData({
      name: contact?.name || '',
      category: contact?.category || 'Other',
      links: contact?.links || {},
      bio: contact?.bio || '',
      avatar: contact?.avatar || '',
      tags: contact?.tags || [],
      notes: contact?.notes || '',
      backlinks: contact?.backlinks || []
    });
  }, [contact]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      links: { ...prev.links, [platform]: value }
    }));
  };

  const addLink = () => {
    if (newLinkPlatform && newLinkValue) {
      handleLinkChange(newLinkPlatform, newLinkValue);
      setNewLinkPlatform('');
      setNewLinkValue('');
    }
  };

  const removeLink = (platform) => {
    const newLinks = { ...formData.links };
    delete newLinks[platform];
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      handleInputChange('tags', [...formData.tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleInputChange('tags', formData.tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const contactOptions = allContacts.
  filter((c) => c.id !== contact?.id) // Exclude self
  .map((c) => ({ value: c.id, label: c.name }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl form-container">
        <DialogHeader>
          <DialogTitle className="text-2xl text-lg font-extralight lowercase leading-none tracking-tight">{contact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
          <DialogDescription>Fill in the details for your contact.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {["Artist", "Mod", "Homies", "VTuber", "Business", "Memory", "Brand", "Manager", "Other"].map((cat) =>
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Avatar URL" value={formData.avatar} onChange={(e) => handleInputChange('avatar', e.target.value)} />
          <Textarea placeholder="Bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} />
          <Textarea placeholder="Notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) =>
              <Badge key={tag} variant="secondary">
                  {tag} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
              <Button type="button" onClick={addTag}>Add Tag</Button>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <label className="block text-sm font-medium mb-2">Links</label>
            <div className="space-y-2">
              {Object.entries(formData.links).map(([platform, link]) =>
              <div key={platform} className="flex items-center gap-2">
                  <span className="font-semibold capitalize w-20">{platform}</span>
                  <Input value={link} onChange={(e) => handleLinkChange(platform, e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(platform)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Platform (e.g., Discord)" value={newLinkPlatform} onChange={(e) => setNewLinkPlatform(e.target.value)} />
                <Input placeholder="Username or URL" value={newLinkValue} onChange={(e) => setNewLinkValue(e.target.value)} />
                <Button type="button" onClick={addLink}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
          
          {/* Connections */}
          <div>
            <label className="block text-sm font-medium mb-2">Connections</label>
            <MultiSelect
              options={contactOptions}
              selected={formData.backlinks}
              onChange={(selected) => handleInputChange('backlinks', selected)}
              placeholder="Select connected contacts..." />

          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Save Contact</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}
