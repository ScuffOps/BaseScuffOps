import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, BarChart3, BookOpen, ClipboardCheck, Shield, LayoutGrid } from 'lucide-react';
import TeamMemberManager from '../components/team/TeamMemberManager';
import AvailabilityManager from '../components/team/AvailabilityManager';
import ScheduleChecker from '../components/team/ScheduleChecker';
import CoverageAnalytics from '../components/team/CoverageAnalytics';
import Handbook from '../components/team/Handbook';
import OnboardingTracker from '../components/team/OnboardingTracker';
import TeamUserManagement from '../components/team/TeamUserManagement';
import DragScheduler from '../components/team/DragScheduler';

const TeamMemberEntity = base44.entities.TeamMember;
const Auth = base44.auth;

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'members';

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'leadmod';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [members, user] = await Promise.all([
        TeamMemberEntity.list(),
        Auth.me()
      ]);
      setTeamMembers(members);
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-bold text-slate-50">Mod Hub</h1>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-slate-900/60 backdrop-blur border border-slate-800/50 h-auto flex-wrap gap-1 p-1.5 !rounded-[var(--panel-radius)]">
          <TabsTrigger value="members" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <Calendar className="w-4 h-4" /> Availability
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <LayoutGrid className="w-4 h-4" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="handbook" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <BookOpen className="w-4 h-4" /> Handbook
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
            <ClipboardCheck className="w-4 h-4" /> Onboarding
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
              <Shield className="w-4 h-4" /> User Management
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="scheduler" className="flex items-center gap-2 !rounded-[var(--button-radius)]">
              <Calendar className="w-4 h-4" /> Shift Planner
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <TeamMemberManager
            teamMembers={teamMembers}
            currentUser={currentUser}
            onUpdate={loadData}
            isAdmin={isAdmin}
            onMemberSaved={loadData}
            onMemberDeleted={loadData}
          />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager
            teamMembers={teamMembers}
            currentUser={currentUser}
            onUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleChecker teamMembers={teamMembers} currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="analytics">
          <CoverageAnalytics teamMembers={teamMembers} />
        </TabsContent>

        <TabsContent value="handbook">
          <Handbook currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingTracker
            teamMembers={teamMembers}
            currentUser={currentUser}
            onUpdate={loadData}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <TeamUserManagement currentUser={currentUser} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="scheduler">
            <DragScheduler teamMembers={teamMembers} onUpdate={loadData} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}