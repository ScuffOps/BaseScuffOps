import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, User, Mail, MessageSquare, Twitter, Instagram, Globe, Phone, Link as LinkIcon, Users } from 'lucide-react';

const linkIcons = {
  email: Mail,
  discord: MessageSquare,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
  phone: Phone
};

export default function ContactDetailModal({ isOpen, onClose, contact, onEdit, currentUser, allContacts }) {
  if (!contact) return null;

  const isSelf = currentUser && contact.links?.email === currentUser.email;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isAdmin || isSelf;

  const getBacklinkName = (contactId) => {
    return allContacts.find(c => c.id === contactId)?.name || 'Unknown Contact';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Contact Profile</span>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(contact)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Left Column */}
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <Avatar className="w-28 h-28 mb-4">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>
                {contact.avatar ? contact.name.charAt(0) : <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{contact.name}</h2>
            <p className="text-slate-400">{contact.category}</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {Object.entries(contact.links || {}).map(([platform, link]) => {
                const Icon = linkIcons[platform.toLowerCase()] || LinkIcon;
                const href = platform.toLowerCase() === 'email' ? `mailto:${link}` : link;
                return (
                  <a key={platform} href={href} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <Icon className="w-4 h-4" />
                    </Button>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Bio</h4>
              <p className="text-slate-300">{contact.bio || 'No bio provided.'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tags & Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(contact.tags || []).map(tag => <Badge key={tag}>{tag}</Badge>)}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{contact.notes || 'No notes for this contact.'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Connections
              </h4>
              <ul className="list-disc list-inside text-slate-300">
                {(contact.backlinks || []).map(id => (
                  <li key={id}>{getBacklinkName(id)}</li>
                ))}
                {(contact.backlinks || []).length === 0 && <p className="text-sm text-slate-500">No connections linked.</p>}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}