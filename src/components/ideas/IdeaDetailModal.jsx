
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Sparkles, Loader2, Clock, FileText, X } from 'lucide-react';
import StatusChip from '../shared/StatusChip';
import CommentSection from './CommentSection';
import PostSection from './PostSection';
import { Idea } from '@/entities/Idea';
import { User } from '@/entities/User';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, CheckCircle2 } from 'lucide-react';


const STAGES = ["Draft", "Proposal", "Review", "Voting", "Approved", "Implemented", "On Hold", "Vetoed"];

export default function IdeaDetailModal({ idea, isOpen, onClose, onUpdate, onEdit, onGenerateOverview, onGenerateSuggestions }) {
  const [currentIdea, setCurrentIdea] = useState(idea);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [voteFlash, setVoteFlash] = useState("");

  // Update currentIdea when the prop 'idea' changes (e.g., after an external update)
  React.useEffect(() => {
    setCurrentIdea(idea);
  }, [idea]);

  React.useEffect(() => {
    User.me().then(setCurrentUser).catch(() => {});
  }, []);

  if (!idea) return null;

  const handleVote = async (type) => {
    const user = await User.me();
    const updatedIdea = { ...currentIdea };
    if (type === 'up') updatedIdea.votesUp += 1;
    else updatedIdea.votesDown += 1;
    updatedIdea.history = [
      ...(updatedIdea.history || []),
      { user: user.email, timestamp: new Date().toISOString(), action: `Voted ${type}` }
    ];
    await Idea.update(idea.id, updatedIdea);
    setCurrentIdea(updatedIdea);
    onUpdate();
    setVoteFlash(type === 'up' ? 'Upvote recorded' : 'Downvote recorded');
    setTimeout(() => setVoteFlash(""), 2000);
  };

  const handleStageChange = async (newStage) => {
    const user = await User.me();
    const updatedIdea = { ...currentIdea, stage: newStage };
    updatedIdea.history = [
      ...(updatedIdea.history || []),
      { user: user.email, timestamp: new Date().toISOString(), action: `Changed stage to ${newStage}` }
    ];
    await Idea.update(idea.id, updatedIdea);
    setCurrentIdea(updatedIdea);
    onUpdate();
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    await onGenerateOverview(idea);
    setIsGenerating(false);
  };

  const handleSuggestionsClick = async () => {
    setIsSuggesting(true);
    await onGenerateSuggestions(idea);
    setIsSuggesting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col popup-surface">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-100 mb-2 pr-12">{idea.title}</DialogTitle>
              <div className="prose prose-invert max-w-none text-slate-300">
                 <ReactMarkdown>{idea.content}</ReactMarkdown>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {voteFlash && (
          <div className="px-4">
            <Alert className="bg-emerald-500/10 border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <AlertDescription>{voteFlash}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3 md:col-span-2 space-y-6">

              {/* Project Overview Section */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-200 text-lg">Project Overview</h3>
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateClick} disabled={isGenerating} variant="outline" size="sm">
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Overview
                    </Button>
                    <Button onClick={handleSuggestionsClick} disabled={isSuggesting} size="sm">
                      {isSuggesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                      AI Suggestions
                    </Button>
                  </div>
                </div>

                {(idea.ai_synopsis || idea.ai_estimated_rollout_time) ? (
                  <div className="space-y-3">
                    {idea.ai_synopsis && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 mt-1 text-slate-400 flex-shrink-0" />
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                          <ReactMarkdown>{idea.ai_synopsis}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {idea.ai_estimated_rollout_time && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-1 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-slate-400 font-medium">Estimated Rollout:</p>
                          <p className="text-slate-200 font-semibold">{idea.ai_estimated_rollout_time}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">No AI overview generated yet.</div>
                )}
              </div>

              {/* Suggestions Section */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <h3 className="font-semibold text-slate-200 text-lg mb-3">AI Suggestions</h3>
                {Array.isArray(currentIdea.ai_suggestions) && currentIdea.ai_suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentIdea.ai_suggestions.map((s, idx) => (
                      <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="font-semibold text-slate-100 mb-1">{s.title}</div>
                        <p className="text-sm text-slate-300 mb-2">{s.description}</p>
                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-400 mb-2">
                          {(s.platforms || []).map(p => <span key={p} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{p}</span>)}
                        </div>
                        {s.caption && <p className="text-sm text-slate-300 italic mb-1">“{s.caption}”</p>}
                        <div className="text-xs text-slate-400">
                          {(s.hashtags || s.tags)?.length ? <div className="mb-1">Tags: {((s.hashtags || s.tags) || []).join(" · ")}</div> : null}
                          {s.keywords?.length ? <div>Keywords: {s.keywords.join(", ")}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">No suggestions yet. Click “AI Suggestions”.</div>
                )}
              </div>
              
              <Tabs defaultValue="discussion" className="w-full">
                <TabsList>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  <TabsTrigger value="posts">Working Docs</TabsTrigger>
                </TabsList>
                <TabsContent value="discussion" className="mt-4">
                  <CommentSection ideaId={currentIdea.id} currentUser={currentUser} />
                </TabsContent>
                <TabsContent value="posts" className="mt-4">
                  <PostSection ideaId={currentIdea.id} currentUser={currentUser} />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Sidebar */}
            <div className="col-span-3 md:col-span-1 space-y-6">
              
              <div className="flex flex-col gap-3">
                <StatusChip status={currentIdea.stage} />
                <Select value={currentIdea.stage} onValueChange={handleStageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={() => handleVote('up')}>
                  <ArrowUp className="w-4 h-4 mr-2 text-emerald-400" />
                  {currentIdea.votesUp}
                </Button>
                <Button variant="outline" className="flex-1" size="sm" onClick={() => handleVote('down')}>
                  <ArrowDown className="w-4 h-4 mr-2 text-rose-400" />
                  {currentIdea.votesDown}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
