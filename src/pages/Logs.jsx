
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LogEntry, User } from '@/entities/all';
import {
  Play,
  Plus,
  Clock,
  Users,
  Star,
  Video,
  Link,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const MOMENT_TAGS = [
  'tech issue', 'clip', 'funny moments', 'audio issue',
  'heartfelt segment', 'collab', 'viewer interaction',
  'raid', 'donation', 'subscriber', 'game highlight'
];

const GAME_CATEGORIES = [
  'Variety', 'FPS', 'RPG', 'Strategy', 'Puzzle', 'Horror',
  'Indie', 'MMO', 'Fighting', 'Racing', 'Just Chatting', 'Art/Creative'
];

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  // NEW: drafts for adding moments per log
  const [momentDrafts, setMomentDrafts] = useState({});

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    start: '',
    end: '',
    collaborators: [],
    game: '',
    notes: '',
    vodUrl: '',
    clipUrls: [],
    moments: [],
    tz: 'PST',
    rating: 0,
    avg_ccv: 0,
    peak_ccv: 0, // NEW
    twitch_engagement: 0,
    thumbnail: '' // NEW
  });

  const [newMoment, setNewMoment] = useState({
    t: '',
    note: '',
    tags: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsData, userData] = await Promise.all([
        LogEntry.list('-date'),
        User.me()
      ]);

      setLogs(logsData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle next day scenarios
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const duration = endMinutes - startMinutes;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours}h ${minutes}m`;
  };

  const formatStreamTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // NEW: permission helper
  const canEditLog = (log) => {
    if (!user) return false;
    const role = user.role;
    // Allow admin or leadmod to edit any log, or the user who created it
    return role === 'admin' || role === 'leadmod' || (log.created_by === user.email && log.created_by !== null);
  };

  const addLogEntry = async () => {
    try {
      const logData = {
        ...newLog,
        // CRITICAL CHANGE: Use user.displayName instead of user.email for new logs
        loggedBy: user?.displayName || 'unknown',
        created_by: user?.email || 'unknown', // NEW: Store user email for permission checks
        collaborators: newLog.collaborators.filter(c => c.trim()),
        clipUrls: newLog.clipUrls.filter(c => c.trim())
      };

      await LogEntry.create(logData);

      setNewLog({
        date: new Date().toISOString().split('T')[0],
        start: '',
        end: '',
        collaborators: [],
        game: '',
        notes: '',
        vodUrl: '',
        clipUrls: [],
        moments: [],
        tz: 'PST',
        rating: 0,
        avg_ccv: 0, // Reset
        peak_ccv: 0, // NEW: Reset
        twitch_engagement: 0, // Reset
        thumbnail: '' // NEW: Reset
      });

      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to add log entry:', error);
    }
  };

  const addMomentToLog = (logId, moment) => {
    // This function is not used in the current outline, quick add moment handles it
    if (editingLog?.id === logId) {
      setEditingLog({
        ...editingLog,
        moments: [...(editingLog.moments || []), moment]
      });
    }
  };

  const toggleLogExpansion = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // NEW: utilities for Quick Add Moment
  const pad2 = (n) => String(n).padStart(2, '0');
  const hhmmss = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
  };

  const secondsSinceStart = (log) => {
    if (!log?.date || !log?.start) return 0;
    const [sh, sm] = log.start.split(':').map(Number);
    const startDate = new Date(log.date);
    startDate.setHours(sh || 0, sm || 0, 0, 0); // Set time to log's start time
    
    const now = new Date(); // Current time

    // Adjust 'now' to match the log's date for accurate calculation of time difference within the same day
    // This ensures we're calculating time elapsed *since the start of the stream on that specific day*
    // If the stream date is in the past, calculate difference from stream end or max out at 24 hours from start.
    let effectiveNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    
    if (effectiveNow.getTime() < startDate.getTime()) {
      // If current time is before stream start date (e.g., stream tomorrow), return 0
      return 0;
    }

    const diffMs = effectiveNow.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  const setMomentDraft = (logId, draft) => {
    setMomentDrafts((prev) => ({ ...prev, [logId]: { ...(prev[logId] || { t: '', note: '', tags: [] }), ...draft } }));
  };

  const toggleMomentTag = (logId, tag) => {
    const draft = momentDrafts[logId] || { t: '', note: '', tags: [] };
    const tags = new Set(draft.tags || []);
    if (tags.has(tag)) tags.delete(tag); else tags.add(tag);
    setMomentDraft(logId, { tags: Array.from(tags) });
  };

  const addMomentNow = (log) => {
    const secs = secondsSinceStart(log);
    setMomentDraft(log.id, { t: hhmmss(secs) });
  };

  const submitMoment = async (log) => {
    const draft = momentDrafts[log.id] || {};
    if (!draft.t || !draft.note) return;
    
    const newMomentEntry = { t: draft.t, note: draft.note, tags: draft.tags || [] };
    const moments = [...(log.moments || []), newMomentEntry];
    
    // Create a temporary log object for update, ensuring all relevant fields are present
    // This is important because LogEntry.update expects an object that might contain many fields.
    // For partial updates, we explicitly send only the changed 'moments' field.
    await LogEntry.update(log.id, { moments: moments });

    // clear draft for this log
    setMomentDrafts((prev) => ({ ...prev, [log.id]: { t: '', note: '', tags: [] } }));
    loadData(); // Reload data to show the updated log with new moment
  };

  const startEditing = (log) => {
    if (!canEditLog(log)) return;
    setEditingLog({ ...log });
  };

  const saveEdits = async () => {
    try {
      await LogEntry.update(editingLog.id, editingLog);
      setEditingLog(null);
      loadData();
    } catch (error) {
      console.error('Failed to save edits:', error);
    }
  };

  const renderStarRating = (rating, onRate = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={onRate ? () => onRate(star) : undefined}
            className={`${
              star <= rating
                ? 'text-yellow-400'
                : 'text-slate-600'
            } ${onRate ? 'hover:text-yellow-300' : ''}`}
            disabled={!onRate}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  // New utility function to map stored 'loggedBy' value to a display name
  const nameFrom = (loggedByValue) => {
    // If the stored value matches the current user's email (for legacy logs),
    // and the user object has a displayName, use that.
    if (user && loggedByValue === user.email && user.displayName) {
      return user.displayName;
    }
    // Otherwise, return the value as is. This handles cases where
    // loggedBy already contains a display name (for new logs),
    // or if it's a non-email identifier, or if it's another user's email
    // (which we cannot resolve to a display name without more user data).
    return loggedByValue || 'Unknown User'; // Fallback for null/empty
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <Play className="w-8 h-8 text-purple-400" />
            Stream Logs
          </h1>
          <p className="text-slate-400 mt-1">Track your streaming sessions and memorable moments</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="!rounded-[var(--button-radius)]">
              <Plus className="w-5 h-5 mr-2" />
              Log New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto form-container popup-surface rounded-lg">
            <DialogHeader>
              <DialogTitle>Log Stream Session</DialogTitle>
              <DialogDescription>
                Record details about your streaming session
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Game/Category</label>
                  <Input
                    placeholder="Enter game or category..."
                    value={newLog.game}
                    onChange={(e) => setNewLog({...newLog, game: e.target.value})}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time (PST)</label>
                  <Input
                    type="time"
                    value={newLog.start}
                    onChange={(e) => setNewLog({...newLog, start: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time (PST)</label>
                  <Input
                    type="time"
                    value={newLog.end}
                    onChange={(e) => setNewLog({...newLog, end: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <div className="px-3 py-2 bg-white/10 rounded-lg text-slate-300 border border-white/10">
                    {calculateDuration(newLog.start, newLog.end)}
                  </div>
                </div>
              </div>

              {/* NEW: Twitch metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Average CCV</label>
                  <Input
                    type="number"
                    value={newLog.avg_ccv}
                    onChange={(e) => setNewLog({ ...newLog, avg_ccv: Number(e.target.value) || 0 })}
                    placeholder="e.g., 120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Peak CCV</label>
                  <Input
                    type="number"
                    value={newLog.peak_ccv}
                    onChange={(e) => setNewLog({ ...newLog, peak_ccv: Number(e.target.value) || 0 })}
                    placeholder="e.g., 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Engagement (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newLog.twitch_engagement}
                    onChange={(e) => setNewLog({ ...newLog, twitch_engagement: Number(e.target.value) || 0 })}
                    placeholder="e.g., 4.2"
                  />
                </div>
              </div>

              {/* Collaborators */}
              <div>
                <label className="block text-sm font-medium mb-2">Collaborators</label>
                <Input
                  placeholder="Enter collaborator names (comma separated)"
                  value={newLog.collaborators.join(', ')}
                  onChange={(e) => setNewLog({
                    ...newLog,
                    collaborators: e.target.value.split(',').map(c => c.trim())
                  })}
                />
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                  <Input
                    placeholder="https://..."
                    value={newLog.thumbnail}
                    onChange={(e) => setNewLog({ ...newLog, thumbnail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">VOD URL</label>
                  <Input
                    placeholder="https://twitch.tv/videos/..."
                    value={newLog.vodUrl}
                    onChange={(e) => setNewLog({...newLog, vodUrl: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Clip URLs</label>
                  <Textarea
                    placeholder="One URL per line"
                    value={newLog.clipUrls.join('\n')}
                    onChange={(e) => setNewLog({
                      ...newLog,
                      clipUrls: e.target.value.split('\n').filter(url => url.trim())
                    })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Stream Notes</label>
                <Textarea
                  placeholder="What happened during this stream? Key moments, interactions, technical issues, etc."
                  value={newLog.notes}
                  onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                  className="min-h-[120px]"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Session Rating</label>
                {renderStarRating(newLog.rating, (rating) => setNewLog({...newLog, rating}))}
              </div>

              <Button onClick={addLogEntry} className="w-full">
                Save Stream Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stream Logs List */}
      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.id} className="bg-white/5 border border-white/10 backdrop-blur-md shadow-lg !rounded-[var(--panel-radius)]">
              <Collapsible
                open={expandedLogs.has(log.id)}
                onOpenChange={() => toggleLogExpansion(log.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* NEW: thumbnail or icon */}
                        {log.thumbnail ? (
                          <img
                            src={log.thumbnail}
                            alt="thumbnail"
                            className="w-14 h-14 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Play className="w-6 h-6 text-purple-400" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <span>{log.game || 'Unlisted Game'}</span>
                            {renderStarRating(log.rating || 0)}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(log.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {log.start} - {log.end || 'Ongoing'} ({calculateDuration(log.start, log.end)})
                            </div>
                            {log.collaborators && log.collaborators.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {log.collaborators.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* NEW: only show edit controls if permitted */}
                        {editingLog?.id === log.id ? (
                          <div className="flex gap-2">
                            <Button onClick={saveEdits} size="sm" variant="outline">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingLog(null)} size="sm" variant="ghost">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          canEditLog(log) && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(log);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )
                        )}
                        {expandedLogs.has(log.id) ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {editingLog?.id === log.id ? (
                      // Editing Mode — now include ALL fields
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Date</label>
                            <Input
                              type="date"
                              value={editingLog.date || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Start</label>
                            <Input
                              type="time"
                              value={editingLog.start || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, start: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">End</label>
                            <Input
                              type="time"
                              value={editingLog.end || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, end: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Time Zone</label>
                            <Input
                              value={editingLog.tz || 'PST'}
                              onChange={(e) => setEditingLog({ ...editingLog, tz: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Game/Category</label>
                            <Input
                              value={editingLog.game || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, game: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                            <Input
                              value={editingLog.thumbnail || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, thumbnail: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Logged By</label>
                            <Input
                              value={editingLog.loggedBy || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, loggedBy: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Collaborators (comma separated)</label>
                          <Input
                            value={(editingLog.collaborators || []).join(', ')}
                            onChange={(e) =>
                              setEditingLog({
                                ...editingLog,
                                collaborators: e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                              })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">VOD URL</label>
                            <Input
                              value={editingLog.vodUrl || ''}
                              onChange={(e) => setEditingLog({ ...editingLog, vodUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Clip URLs (one per line)</label>
                            <Textarea
                              value={(editingLog.clipUrls || []).join('\n')}
                              onChange={(e) =>
                                setEditingLog({
                                  ...editingLog,
                                  clipUrls: e.target.value.split('\n').map((u) => u.trim()).filter(Boolean)
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Avg CCV</label>
                            <Input
                              type="number"
                              value={editingLog.avg_ccv || 0}
                              onChange={(e) => setEditingLog({ ...editingLog, avg_ccv: Number(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Peak CCV</label>
                            <Input
                              type="number"
                              value={editingLog.peak_ccv || 0}
                              onChange={(e) => setEditingLog({ ...editingLog, peak_ccv: Number(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Engagement (%)</label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editingLog.twitch_engagement || 0}
                              onChange={(e) => setEditingLog({ ...editingLog, twitch_engagement: Number(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Stream Notes</label>
                          <Textarea
                            value={editingLog.notes || ''}
                            onChange={(e) => setEditingLog({ ...editingLog, notes: e.target.value })}
                            className="min-h-[120px]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Rating</label>
                            {renderStarRating(editingLog.rating || 0, (rating) =>
                              setEditingLog({ ...editingLog, rating })
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Moments</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {(editingLog.moments || []).map((moment, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-white/10 rounded">
                                  <span className="text-sm font-mono text-slate-400">{moment.t}</span>
                                  <span className="flex-1 text-sm">{moment.note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-6">
                        {/* Stream Notes */}
                        {log.notes && (
                          <div>
                            <h4 className="font-semibold text-slate-200 mb-2">Stream Notes</h4>
                            <p className="text-slate-300 leading-relaxed">{log.notes}</p>
                          </div>
                        )}

                        {/* Metrics Display */}
                        {(log.avg_ccv > 0 || log.peak_ccv > 0 || log.twitch_engagement > 0) && (
                          <div>
                            <h4 className="font-semibold text-slate-200 mb-2">Metrics</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                              {log.avg_ccv > 0 && (
                                <p className="flex items-center gap-1">
                                  Avg. CCV: <Badge variant="outline">{log.avg_ccv}</Badge>
                                </p>
                              )}
                              {log.peak_ccv > 0 && (
                                <p className="flex items-center gap-1">
                                  Peak CCV: <Badge variant="outline">{log.peak_ccv}</Badge>
                                </p>
                              )}
                              {log.twitch_engagement > 0 && (
                                <p className="flex items-center gap-1">
                                  Engagement: <Badge variant="outline">{log.twitch_engagement}%</Badge>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Links */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {log.vodUrl && (
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                VOD
                              </h4>
                              <a
                                href={log.vodUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                              >
                                <Link className="w-3 h-3" />
                                Watch VOD
                              </a>
                            </div>
                          )}

                          {log.clipUrls && log.clipUrls.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Clips ({log.clipUrls.length})
                              </h4>
                              <div className="space-y-1">
                                {log.clipUrls.slice(0, 3).map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                  >
                                    <Link className="w-3 h-3" />
                                    Clip {idx + 1}
                                  </a>
                                ))}
                                {log.clipUrls.length > 3 && (
                                  <p className="text-xs text-slate-500">+{log.clipUrls.length - 3} more</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notable Moments */}
                        {log.moments && log.moments.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Notable Moments</h4>
                            <div className="space-y-2">
                              {log.moments.map((moment, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {moment.t}
                                  </Badge>
                                  <p className="text-sm text-slate-300 flex-1">{moment.note}</p>
                                  {moment.tags && moment.tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {moment.tags.map((tg) => (
                                        <Badge key={tg} className="text-xs">{tg}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* NEW: Quick Add Moment (visible if permitted) */}
                        {canEditLog(log) && (
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <h4 className="font-semibold text-slate-200 mb-3">Quick Add Moment</h4>
                            <div className="grid md:grid-cols-3 gap-3 items-end">
                              <div>
                                <label className="block text-sm font-medium mb-2">Timestamp (HH:MM:SS)</label>
                                <Input
                                  placeholder="MM:SS or HH:MM:SS"
                                  value={(momentDrafts[log.id]?.t) || ''}
                                  onChange={(e) => setMomentDraft(log.id, { t: e.target.value })}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-slate-400 hover:text-slate-200"
                                  onClick={() => addMomentNow(log)}
                                >
                                  Use Now (since start)
                                </Button>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Note</label>
                                <Input
                                  placeholder="Describe the moment..."
                                  value={(momentDrafts[log.id]?.note) || ''}
                                  onChange={(e) => setMomentDraft(log.id, { note: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {MOMENT_TAGS.map((tg) => {
                                const active = (momentDrafts[log.id]?.tags || []).includes(tg);
                                return (
                                  <button
                                    key={tg}
                                    onClick={() => toggleMomentTag(log.id, tg)}
                                    className={`px-2 py-1 text-xs rounded-full border ${active ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
                                  >
                                    {tg}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" onClick={() => submitMoment(log)}>Add Moment</Button>
                            </div>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
                          Logged by {nameFrom(log.loggedBy)} • Duration: {calculateDuration(log.start, log.end)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        ) : (
          <Card className="bg-white/5 border border-white/10 backdrop-blur-md shadow-lg !rounded-[var(--panel-radius)]">
            <CardContent className="text-center py-12">
              <Play className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No stream logs yet</h3>
              <p className="text-slate-400 mb-6">Start logging your streams to track progress and memorable moments</p>
              <Button onClick={() => setShowAddDialog(true)} className="!rounded-[var(--button-radius)]">
                <Plus className="w-4 h-4 mr-2" />
                Log First Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
