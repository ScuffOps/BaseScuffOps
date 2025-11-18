import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { License } from '@/entities/License';

export default function LicenseFormModal({ isOpen, onClose, onUpdate, license }) {
  const [formData, setFormData] = useState({
    item_name: license?.item_name || '',
    owner: license?.owner || '',
    scope: license?.scope || '',
    proof_link: license?.proof_link || '',
    expiry_date: license?.expiry_date || ''
  });

  const handleSubmit = async () => {
    if (license) {
      await License.update(license.id, formData);
    } else {
      await License.create(formData);
    }
    onUpdate();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{license ? 'Edit License' : 'Add New License'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Item Name (e.g., Font, Music)" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
          <Input placeholder="Owner/Creator" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
          <Textarea placeholder="Scope of use..." value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} />
          <Input placeholder="Link to proof/license" value={formData.proof_link} onChange={e => setFormData({...formData, proof_link: e.target.value})} />
          <div>
            <label className="text-sm text-slate-400">Expiry Date (optional)</label>
            <Input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{license ? 'Save Changes' : 'Add License'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}