
import React, { useState } from 'react';
import { TeamMember } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, Trash2, Mail, MessageSquare, User, Phone } from 'lucide-react';
import StatusChip from '../shared/StatusChip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Search as SearchIcon } from 'lucide-react';

export default function TeamMemberManager({ teamMembers, currentUser, onUpdate, isAdmin, onMemberSaved, onMemberDeleted }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'mod',
    status: 'active',
    bio: '',
    profileUrl: '',
    contacts: []
  });
  const [newContact, setNewContact] = useState({ type: 'discord', value: '' });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false); // NEW: prevent duplicate submits

  // NEW: local filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMembers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamMembers.filter((m) => {
      const matchesQ =
        !q ||
        (m.name || "").toLowerCase().includes(q) ||
        (m.bio || "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || (m.role || "") === roleFilter;
      const matchesStatus = statusFilter === "all" || (m.status || "") === statusFilter;
      return matchesQ && matchesRole && matchesStatus;
    });
  }, [teamMembers, query, roleFilter, statusFilter]);

  const handleOpenForm = (member = null) => {
    setFormError("");
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name || '',
        role: member.role || 'mod',
        status: member.status || 'active',
        bio: member.bio || '',
        profileUrl: member.profileUrl || '',
        contacts: member.contacts || []
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: 'mod',
        status: 'active',
        bio: '',
        profileUrl: '',
        contacts: []
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      setFormError("Please enter a name.");
      return;
    }
    if (!formData.role) {
      setFormError("Please select a role.");
      return;
    }
    if (!formData.status) {
      setFormError("Please select a status.");
      return;
    }

    setFormError("");
    setIsSaving(true);
    try {
      let saved;
      if (editingMember) {
        saved = await TeamMember.update(editingMember.id, formData);
      } else {
        saved = await TeamMember.create(formData);
      }
      // Optimistic update in parent immediately
      onMemberSaved && onMemberSaved(saved || { ...(editingMember || {}), ...formData });

      // Close form and reload from server to avoid cache staleness
      setIsFormOpen(false);
      setEditingMember(null);
      await Promise.resolve(onUpdate && onUpdate());
    } catch (error) {
      console.error("Failed to save team member:", error);
      setFormError(error?.message || "Could not save member. You may not have permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      try {
        await TeamMember.delete(memberId);
        // Optimistically remove from UI
        onMemberDeleted && onMemberDeleted(memberId);
        // Reload from server to confirm
        await Promise.resolve(onUpdate && onUpdate());
      } catch (error) {
        console.error("Failed to delete team member:", error);
      }
    }
  };

  const addContact = () => {
    if (newContact.value.trim()) {
      setFormData({
        ...formData,
        contacts: [...formData.contacts, { ...newContact, id: Date.now().toString() }]
      });
      setNewContact({ type: 'discord', value: '' });
    }
  };

  const removeContact = (contactId) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter(c => c.id !== contactId)
    });
  };

  const getContactIcon = (type) => {
    switch (type) {
      case 'email': return Mail;
      case 'discord': return MessageSquare;
      case 'phone': return Phone;
      default: return User;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 !rounded-[var(--panel-radius)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-50">Team Members</CardTitle>
          {isAdmin && (
            <Button onClick={() => handleOpenForm()} className="!rounded-[var(--button-radius)]">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* NEW: Filters row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or bio…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="leadmod">Lead Mod</SelectItem>
                  <SelectItem value="mod">Moderator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(member => (
              <Card key={member.id} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 !rounded-[var(--panel-radius)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.profileUrl} />
                        <AvatarFallback>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-slate-100">{member.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <StatusChip status={member.role} />
                          <StatusChip status={member.status} />
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(member)}
                          className="!rounded-[var(--button-radius)]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                          className="text-red-400 hover:text-red-300 !rounded-[var(--button-radius)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {member.bio && (
                    <p className="text-sm text-slate-300 mb-4">{member.bio}</p>
                  )}
                  
                  {member.contacts && member.contacts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contact Info</h4>
                      <div className="space-y-1">
                        {member.contacts.slice(0, 3).map(contact => {
                          const Icon = getContactIcon(contact.type);
                          return (
                            <div key={contact.id} className="flex items-center gap-2 text-sm text-slate-300">
                              <Icon className="w-3 h-3" />
                              <span className="capitalize">{contact.type}:</span>
                              <span className="font-mono">{contact.value}</span>
                            </div>
                          );
                        })}
                        {member.contacts.length > 3 && (
                          <p className="text-xs text-slate-500">+{member.contacts.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!filteredMembers.length && (
              <div className="col-span-full text-center text-slate-400 py-8">
                No team members match your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Couldn’t save</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="leadmod">Lead Mod</SelectItem>
                    <SelectItem value="mod">Moderator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image URL</label>
              <Input
                value={formData.profileUrl}
                onChange={(e) => setFormData({...formData, profileUrl: e.target.value})}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Brief description about this team member"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Contact Information</label>
              <div className="space-y-2">
                {formData.contacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                    <span className="capitalize text-sm">{contact.type}:</span>
                    <span className="flex-1 text-sm font-mono">{contact.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContact(contact.id)}
                      className="h-6 w-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Select value={newContact.type} onValueChange={(value) => setNewContact({...newContact, type: value})}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={newContact.value}
                    onChange={(e) => setNewContact({...newContact, value: e.target.value})}
                    placeholder="Contact info"
                    className="flex-1"
                  />
                  <Button onClick={addContact} size="sm">Add</Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
