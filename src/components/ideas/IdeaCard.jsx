
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import StatusChip from '../shared/StatusChip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function IdeaCard({ idea, onClick, onEdit, onDelete, canModify = false, ...props }) {
  const commentCount = idea.comments?.length || 0;

  return (
    <Card 
      className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)] hover:border-slate-700 cursor-pointer flex flex-col"
      onClick={() => onClick(idea)}
      {...props}
    >
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <StatusChip status={idea.stage} />
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span>{idea.votesUp}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown className="w-4 h-4 text-rose-400" />
              <span>{idea.votesDown}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{commentCount}</span>
            </div>
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded-md hover:bg-white/10"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Idea actions"
                    title="Actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="menu-surface" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit?.(idea)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-rose-400" onClick={() => onDelete?.(idea)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        <h3 className="font-bold text-slate-100 mb-2 flex-1">{idea.title}</h3>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-purple-300 border-purple-500/30 bg-purple-900/30">
            {idea.category}
          </Badge>
          {(idea.tags || []).slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
          {(idea.tags || []).length > 2 && (
            <Badge variant="secondary">+{idea.tags.length - 2} more</Badge>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-3">
          <Avatar className="w-7 h-7">
            <AvatarImage src={idea.authorAvatar} />
            <AvatarFallback>{idea.createdBy ? idea.createdBy.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-slate-300">{idea.createdBy || 'Unknown User'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
