import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Save, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editableUsers, setEditableUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const usersData = await User.list();
    setUsers(usersData);
    
    const editable = usersData.reduce((acc, user) => {
      acc[user.id] = { role: user.role, active: user.active };
      return acc;
    }, {});
    setEditableUsers(editable);
    
    setIsLoading(false);
  };

  const handleFieldChange = (userId, field, value) => {
    setEditableUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const changedUsers = users.filter(user => {
      const edited = editableUsers[user.id];
      return edited && (edited.role !== user.role || edited.active !== user.active);
    });

    if (changedUsers.length === 0) {
      toast({
        title: "No changes",
        description: "No user data was modified.",
      });
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all(
        changedUsers.map(user => User.update(user.id, editableUsers[user.id]))
      );
      
      toast({
        title: "Success",
        description: `Updated ${changedUsers.length} user${changedUsers.length > 1 ? 's' : ''} successfully.`,
      });
      
      setHasChanges(false);
      await loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to save changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="mx-auto w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>
              Edit roles and status for all users in the system. New users must be invited via the platform settings.
            </CardDescription>
          </div>
          <Button 
            onClick={handleSaveAll} 
            disabled={!hasChanges || isSaving}
            className="glass-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Deactivating a user will prevent them from accessing the application. They will be logged out on their next action.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editableUsers[user.id]?.role || user.role}
                      onValueChange={(value) => handleFieldChange(user.id, 'role', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editableUsers[user.id]?.active ?? user.active}
                        onCheckedChange={(value) => handleFieldChange(user.id, 'active', value)}
                        id={`active-${user.id}`}
                      />
                      <label htmlFor={`active-${user.id}`}>
                        {editableUsers[user.id]?.active ?? user.active ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}