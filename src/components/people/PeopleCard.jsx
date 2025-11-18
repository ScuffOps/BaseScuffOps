import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Archive, Undo } from "lucide-react";

export default function PeopleCard({ item, onClick, onEdit, onArchiveToggle, onDelete }) {
  const { type, name, subtitle, avatar, tags = [], archived } = item;

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)] hover:border-slate-700 ${archived ? "opacity-70" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={avatar} />
              <AvatarFallback>{(name || "?").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100">{name}</h3>
                <Badge variant="outline" className="rounded-full border text-xs">
                  {type === "creator" ? "Creator" : "Contact"}
                </Badge>
              </div>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                  {tags.length > 3 && <Badge variant="secondary">+{tags.length - 3}</Badge>}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="menu-surface">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchiveToggle(item); }}>
                {archived ? (<><Undo className="w-4 h-4 mr-2" /> Unarchive</>) : (<><Archive className="w-4 h-4 mr-2" /> Archive</>)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}