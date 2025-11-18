
import { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import UserManagement from '../components/admin/UserManagement';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    User.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-10 bg-slate-800 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-12 bg-slate-800 rounded w-full animate-pulse"></div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto bg-slate-900/60 border border-slate-700/60 backdrop-blur-lg shadow-xl !rounded-[var(--panel-radius)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-red-400">
              <Shield className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You do not have permission to view this page.</p>
            <Button asChild className="!rounded-[var(--button-radius)]">
              <Link to={createPageUrl('Home')}>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-400" />
          Admin Control Center
        </h1>
        <p className="text-slate-400 mt-1">Manage users, roles, and schedules.</p>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-1 bg-slate-900/60 border border-slate-700/60 backdrop-blur-lg shadow-xl !rounded-[var(--panel-radius)]">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="mt-6 p-6 bg-slate-900/60 border border-slate-700/60 backdrop-blur-lg shadow-xl !rounded-[var(--panel-radius)]">
            <UserManagement />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
