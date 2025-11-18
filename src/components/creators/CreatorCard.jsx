
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Mail, Trash2 } from 'lucide-react';
import StatusChip from '../shared/StatusChip';

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

export default function CreatorCard({ creator, onEdit, onDelete, onClick }) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)] hover:border-slate-700 cursor-pointer"
      onClick={() => onClick(creator)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback>
                {creator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{creator.name}</h3>
              <p className="text-sm text-slate-400">@{creator.handle}</p>
              {creator.discord_handle && (
                <p className="text-sm text-blue-400">{creator.discord_handle}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {e.stopPropagation(); onEdit(creator);}}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`mailto:${creator.email}`} onClick={(e) => e.stopPropagation()}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {e.stopPropagation(); onDelete(creator);}} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusChip status={creator.status} />
            <Badge className={`${platformColors[creator.platform]} font-medium !rounded-full text-xs`}>
              {creator.platform?.toUpperCase()}
            </Badge>
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <div className="font-semibold text-slate-100">
                {formatFollowerCount(creator.follower_count)}
              </div>
              <div className="text-slate-400">Followers</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-100">
                {creator.engagement_rate ? `${creator.engagement_rate}%` : 'N/A'}
              </div>
              <div className="text-slate-400">Engagement</div>
            </div>
          </div>

          {(creator.tags && creator.tags.length > 0) && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex flex-wrap gap-2">
                {creator.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
