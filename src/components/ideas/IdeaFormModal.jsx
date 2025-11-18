
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '../shared/RichTextEditor';

export default function IdeaFormModal({ isOpen, onClose, onSubmit, idea }) {
  const [title, setTitle] = useState(idea?.title || '');
  const [content, setContent] = useState(idea?.content || '');
  const [category, setCategory] = useState(idea?.category || 'Content');
  const [tags, setTags] = useState(idea?.tags?.join(', ') || '');

  const handleSubmit = () => {
    const formData = {
      title,
      content,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl form-container">
        <DialogHeader>
          <DialogTitle>{idea ? 'Edit Idea' : 'Create New Idea'}</DialogTitle>
          <DialogDescription>
            {idea ? 'Refine the details of this idea.' : 'Shape the future. Share your brilliant ideas with the team.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            placeholder="Idea Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="text-lg"
          />
          <RichTextEditor 
            value={content} 
            onChange={setContent} 
            placeholder="Describe your idea in detail..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Tags (comma-separated)" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {idea ? 'Save Changes' : 'Submit Idea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
