import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Save, Search, Loader2, Info, Eye, Edit, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const ROLE_COLORS = {
  admin:   'bg-rose-500/20 text-rose-300 border-rose-500/30',
  leadmod: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  mod:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  viewer:  'bg-slate-500/20 text-slate-300 border-slate-500/30',
  user:    'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function TeamUserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [edits, setEdits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();

  const isAdmin = currentUser?.role === 'admin';
  const isLeadMod = currentUser?.role === 'admin' || currentUser?.role === 'leadmod';

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await base44.auth.list ? base44.auth.list() : base44.entities.User?.list?.() || [];
    const userList = Array.isArray(data) ? data : [];
    setUsers(userList);
    const initial = {};
    userList.forEach(u => {
      initial[u.id] = {
        role: u.role || 'user',
        active: u.active !== false,
        bio: u.bio || '',
        user_notes: u.user_notes || '',
      };
    });
    setEdits(initial);
    setIsLoading(false);
  };

  const setField = (userId, field, value) => {
    setEdits(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  };

  const saveAll = async () => {
    setIsSaving(true);
    const changed = users.filter(u => {
      const e = edits[u.id];
      return e && (
        e.role !== (u.role || 'user') ||
        e.active !== (u.active !== false) ||
        e.bio !== (u.bio || '') ||
        e.user_notes !== (u.user_notes || '')
      );
    });
    if (!changed.length) {
      toast({ title: 'No changes to save.' });
      setIsSaving(false);
      return;
    }
    try {
      await Promise.all(changed.map(u => base44.entities.User?.update?.(u.id, edits[u.id])));
      toast({ title: 'Saved', description: `Updated ${changed.length} user(s).` });
      await loadUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message || 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const matchesQ = !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || (u.role || 'user') === roleFilter;
      return matchesQ && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openDetail = (user) => { setSelectedUser(user); setDetailOpen(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage roles, bios, and status for all users. Notes are visible to Admin / LeadMod only.</CardDescription>
            </div>
            <Button onClick={saveAll} disabled={isSaving} className="!rounded-[var(--button-radius)]">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Changes
            </Button>
          </div>
          <Alert className="mt-4 bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Deactivating a user prevents app access. They'll be logged out on next action.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leadmod">Lead Mod</SelectItem>
                <SelectItem value="mod">Mod</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Bio</TableHead>
                  {isLeadMod && <TableHead>Notes (Staff Only)</TableHead>}
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user.id} className="hover:bg-slate-800/30 align-top">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-100 text-sm">{user.full_name || '—'}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={edits[user.id]?.role || 'user'}
                        onValueChange={v => setField(user.id, 'role', v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="leadmod">Lead Mod</SelectItem>
                          <SelectItem value="mod">Mod</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={edits[user.id]?.active ?? true}
                          onCheckedChange={v => setField(user.id, 'active', v)}
                          id={`active-${user.id}`}
                        />
                        <label htmlFor={`active-${user.id}`} className="text-xs text-slate-400">
                          {edits[user.id]?.active ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={edits[user.id]?.bio || ''}
                        onChange={e => setField(user.id, 'bio', e.target.value)}
                        placeholder="Short bio…"
                        className="text-xs min-h-[60px] w-48 resize-none"
                      />
                    </TableCell>
                    {isLeadMod && (
                      <TableCell>
                        <Textarea
                          value={edits[user.id]?.user_notes || ''}
                          onChange={e => setField(user.id, 'user_notes', e.target.value)}
                          placeholder="Internal notes…"
                          className="text-xs min-h-[60px] w-48 resize-none bg-amber-500/5 border-amber-500/20"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Joined {user.created_date ? formatDistanceToNow(new Date(user.created_date), { addSuffix: true }) : '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>Login {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                          {user.role || 'user'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => openDetail(user)} title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={isLeadMod ? 7 : 6} className="text-center text-slate-400 py-8">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedUser && (
          <DialogContent className="popup-surface max-w-lg">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-xl">{(selectedUser.full_name || selectedUser.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-slate-100">{selectedUser.full_name || '—'}</p>
                  <p className="text-sm text-slate-400">{selectedUser.email}</p>
                  <Badge variant="outline" className={`mt-1 text-xs ${ROLE_COLORS[selectedUser.role] || ROLE_COLORS.user}`}>
                    {selectedUser.role || 'user'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">Status</p>
                  <p className="text-slate-100">{selectedUser.active !== false ? '✅ Active' : '🚫 Inactive'}</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">Joined</p>
                  <p className="text-slate-100">{selectedUser.created_date ? new Date(selectedUser.created_date).toLocaleDateString() : '—'}</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">Last Login</p>
                  <p className="text-slate-100">{selectedUser.lastLogin ? formatDistanceToNow(new Date(selectedUser.lastLogin), { addSuffix: true }) : 'Never'}</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">Timezone</p>
                  <p className="text-slate-100">{selectedUser.timezone || '—'}</p>
                </div>
              </div>
              {selectedUser.bio && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Bio</p>
                  <p className="text-sm text-slate-200 bg-slate-800/40 rounded-lg p-3">{selectedUser.bio}</p>
                </div>
              )}
              {isLeadMod && edits[selectedUser.id]?.user_notes && (
                <div>
                  <p className="text-xs text-amber-400 mb-1">Staff Notes (confidential)</p>
                  <p className="text-sm text-slate-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    {edits[selectedUser.id]?.user_notes}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}