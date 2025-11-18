import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export default function ContactCard({ contact, onClick }) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)] hover:border-slate-700"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback>
            {contact.avatar ? contact.name.charAt(0) : <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-slate-100 truncate w-full">{contact.name}</h3>
        <p className="text-sm text-slate-400 capitalize mb-3">{contact.category}</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {(contact.tags || []).slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
          {(contact.tags?.length || 0) > 2 && <Badge variant="secondary">...</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}