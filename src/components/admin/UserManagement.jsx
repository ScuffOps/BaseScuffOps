
import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editableUsers, setEditableUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState({ id: null, loading: false, success: false, error: "" });

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
  };

  const handleUpdateUser = async (userId) => {
    setUpdateStatus({ id: userId, loading: true, success: false, error: "" });
    try {
      const dataToUpdate = editableUsers[userId];
      await User.update(userId, dataToUpdate);
      setUpdateStatus({ id: userId, loading: false, success: true, error: "" });
      setTimeout(() => setUpdateStatus({ id: null, loading: false, success: false, error: "" }), 1500);
    } catch (error) {
      console.error("Failed to update user:", error);
      setUpdateStatus({ id: userId, loading: false, success: false, error: error?.message || "Update failed" });
    } finally {
      loadUsers(); // Refresh data
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
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>
          Edit roles and status for all users in the system. New users must be invited via the platform settings.
        </CardDescription>
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
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <Button 
                      onClick={() => handleUpdateUser(user.id)} 
                      disabled={updateStatus.loading && updateStatus.id === user.id}
                      size="sm"
                    >
                      {updateStatus.loading && updateStatus.id === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    {updateStatus.id === user.id && updateStatus.success && !updateStatus.loading && (
                      <span className="ml-2 text-xs text-emerald-400">Saved</span>
                    )}
                    {updateStatus.id === user.id && updateStatus.error && !updateStatus.loading && (
                      <span className="ml-2 text-xs text-rose-400">{updateStatus.error}</span>
                    )}
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
