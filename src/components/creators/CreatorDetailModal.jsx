import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import StatusChip from '../shared/StatusChip';
import { Edit, Mail, BarChart2, Users, Tag, FileText, Bot } from 'lucide-react';

const platformColors = {
  youtube: "bg-red-900/50 text-red-300 border-red-500/20",
  tiktok: "bg-slate-200 text-slate-900 border-slate-400/20",
  instagram: "bg-pink-900/50 text-pink-300 border-pink-500/20",
  twitter: "bg-blue-900/50 text-blue-300 border-blue-500/20",
  twitch: "bg-purple-900/50 text-purple-300 border-purple-500/20",
  linkedin: "bg-sky-900/50 text-sky-300 border-sky-500/20"
};

const formatFollowerCount = (count) => {
  if (!count) return 'N/A';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export default function CreatorDetailModal({ creator, isOpen, onClose, onEdit }) {
  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{creator.name}</DialogTitle>
              <DialogDescription>
                <p className="text-slate-400">@{creator.handle}</p>
                {creator.discord_handle && (
                  <p className="text-blue-400 flex items-center gap-1"><Bot className="w-4 h-4" />{creator.discord_handle}</p>
                )}
                <a href={`mailto:${creator.email}`} className="text-sm text-slate-400 hover:underline flex items-center gap-1">
                  <Mail className="w-4 h-4" />{creator.email}
                </a>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 uppercase">Status</p>
              <StatusChip status={creator.status} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Platform</p>
              <Badge className={`${platformColors[creator.platform]} font-medium !rounded-full text-xs`}>
                {creator.platform?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Followers</p>
              <p className="font-bold text-lg flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-slate-400" />
                {formatFollowerCount(creator.follower_count)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Engagement</p>
              <p className="font-bold text-lg flex items-center justify-center gap-1">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                {creator.engagement_rate ? `${creator.engagement_rate}%` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Tags */}
          {(creator.tags && creator.tags.length > 0) && (
            <div>
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Tags</h4>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {creator.notes && (
            <div>
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</h4>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-slate-300 whitespace-pre-wrap">{creator.notes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => onEdit(creator)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Creator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}