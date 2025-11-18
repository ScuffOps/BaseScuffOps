
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, Loader2, FileJson, AlertTriangle } from 'lucide-react';
import { 
    User, Task, Idea, LogEntry, Commission, BrandAsset, License, TeamMember, Contact, 
    MedDose, Settings, Content, Campaign 
} from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


const allEntities = { 
    User, Task, Idea, LogEntry, Commission, BrandAsset, License, TeamMember, Contact, 
    MedDose, Settings, Content, Campaign 
};

const ENTITY_MAP = {
  users: 'User',
  tasks: 'Task',
  ideas: 'Idea',
  logs: 'LogEntry',
  commissions: 'Commission',
  brandAssets: 'BrandAsset',
  licenses: 'License',
  teamMembers: 'TeamMember',
  contacts: 'Contact',
  medDoses: 'MedDose',
  settings: 'Settings',
  content: 'Content',
  campaigns: 'Campaign'
};


export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // NEW: profile state
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    timezone: '',
    accent_primary: '#be185d',
    accent_secondary: '#f59e0b',
    avatar: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef(null);
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });

  // NEW: auth state
  const [authForm, setAuthForm] = useState({
    allow_password_login: false,
    require_email_domain: false,
    allowed_email_domains_text: ''
  });
  const [authSaving, setAuthSaving] = useState(false);
  const [authStatus, setAuthStatus] = useState({ type: '', message: '' });
  const [appSettingsRec, setAppSettingsRec] = useState(null);

  React.useEffect(() => {
    User.me()
      .then((u) => {
        setCurrentUser(u);
        setProfileForm({
          displayName: u.displayName || '',
          bio: u.bio || '',
          timezone: u.timezone || '',
          accent_primary: u.accent_primary || '#be185d',
          accent_secondary: u.accent_secondary || '#f59e0b',
          avatar: u.avatar || ''
        });
      })
      .catch(() => setCurrentUser(null));
  }, []);

  React.useEffect(() => {
    // Load Settings record to prefill auth card
    (async () => {
      try {
        const recs = await Settings.list();
        const rec = recs && recs.length ? recs[0] : null;
        setAppSettingsRec(rec);
        if (rec) {
          setAuthForm({
            allow_password_login: !!rec.allow_password_login,
            require_email_domain: !!rec.require_email_domain,
            allowed_email_domains_text: Array.isArray(rec.allowed_email_domains) ? rec.allowed_email_domains.join(', ') : ''
          });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const TIMEZONES = [
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'America/Chicago',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Singapore',
    'Australia/Sydney'
  ];

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await UploadFile({ file });
      setProfileForm((p) => ({ ...p, avatar: file_url }));
      setProfileStatus({ type: 'success', message: 'Avatar uploaded. Don’t forget to Save.' });
    } catch (error) {
      console.error("Avatar upload failed:", error);
      setProfileStatus({ type: 'error', message: `Avatar upload failed: ${error.message}` });
    }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileStatus({ type: '', message: '' });
    try {
      await User.updateMyUserData({
        displayName: profileForm.displayName || undefined,
        avatar: profileForm.avatar || undefined,
        bio: profileForm.bio || '',
        timezone: profileForm.timezone || '',
        accent_primary: profileForm.accent_primary || '#be185d',
        accent_secondary: profileForm.accent_secondary || '#f59e0b'
      });
      setProfileStatus({ type: 'success', message: 'Profile updated! Applying your theme…' });
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Profile save failed:", error);
      setProfileStatus({ type: 'error', message: `Profile save failed: ${error.message}` });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveAuthSettings = async () => {
    setAuthSaving(true);
    setAuthStatus({ type: '', message: '' });
    try {
      // Parse comma-separated domains
      const domains = authForm.allowed_email_domains_text
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        allow_password_login: false, // Platform limitation, keep false
        require_email_domain: !!authForm.require_email_domain,
        allowed_email_domains: domains
      };

      let rec;
      if (appSettingsRec?.id) {
        rec = await Settings.update(appSettingsRec.id, payload);
      } else {
        rec = await Settings.create({
          tipsEnabled: false, 
          medReminders: false,
          ...payload
        });
      }
      setAppSettingsRec(rec);
      setAuthStatus({ type: 'success', message: 'Authentication settings saved.' });
    } catch (e) {
      setAuthStatus({ type: 'error', message: e?.message || 'Failed to save authentication settings.' });
    } finally {
      setAuthSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setImportStatus({ type: '', message: '' });

    try {
      const appState = {};
      for (const key in ENTITY_MAP) {
        const entityName = ENTITY_MAP[key];
        if (allEntities[entityName]) {
          console.log(`Exporting ${entityName}...`);
          const records = await allEntities[entityName].list();
          appState[key] = records;
        }
      }

      const jsonString = JSON.stringify(appState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foxfam-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      setImportStatus({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: '', message: '' });

    try {
      const text = await file.text();
      const appState = JSON.parse(text);

      let importSummary = [];

      for (const key in appState) {
        const entityName = ENTITY_MAP[key];
        const records = appState[key];

        if (allEntities[entityName] && Array.isArray(records) && records.length > 0) {
           console.log(`Importing ${records.length} records into ${entityName}...`);
           // Note: bulkCreate might not exist on all entity SDKs.
           // This is a conceptual implementation. The platform might require record-by-record creation.
           // Also, this doesn't handle updates, just creation.
           if (allEntities[entityName].bulkCreate) {
             await allEntities[entityName].bulkCreate(records);
             importSummary.push(`${records.length} ${key}`);
           } else {
             // Fallback to creating one by one
             for (const record of records) {
                await allEntities[entityName].create(record);
             }
             importSummary.push(`${records.length} ${key}`);
           }
        }
      }

      setImportStatus({ type: 'success', message: `Successfully imported: ${importSummary.join(', ')}.` });

    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus({ type: 'error', message: `Import failed: ${error.message}. Make sure the JSON file is valid.` });
    } finally {
      setIsImporting(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-50">Settings</h1>

      {/* NEW: Profile & Personalization */}
      <Card className="backdrop-blur-md bg-slate-900/50 border border-slate-700 !rounded-[var(--panel-radius)] shadow-xl">
        <CardHeader>
          <CardTitle>Profile & Personalization</CardTitle>
          <CardDescription>Update your avatar, bio, timezone, and accent colors used across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={profileForm.avatar || currentUser?.avatar || ''}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Button variant="outline" onClick={() => avatarInputRef.current?.click()} className="!rounded-[var(--button-radius)]">
                  Change Avatar
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-xs text-slate-400">Use a square image for best results.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <Select
                  value={profileForm.timezone || ''}
                  onValueChange={(v) => setProfileForm((p) => ({ ...p, timezone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="menu-surface max-h-64">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">About Me</label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell us a bit about yourself…"
                  className="min-h-[90px]"
                />
              </div>
              <div className="flex items-center gap-6 sm:col-span-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={profileForm.accent_primary}
                      onChange={(e) => setProfileForm((p) => ({ ...p, accent_primary: e.target.value }))}
                      className="h-10 w-14 rounded-md bg-transparent border border-white/10"
                    />
                    <span className="text-xs text-slate-400">{profileForm.accent_primary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={profileForm.accent_secondary}
                      onChange={(e) => setProfileForm((p) => ({ ...p, accent_secondary: e.target.value }))}
                      className="h-10 w-14 rounded-md bg-transparent border border-white/10"
                    />
                    <span className="text-xs text-slate-400">{profileForm.accent_secondary}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {profileStatus.message && (
            <Alert variant={profileStatus.type === 'error' ? 'destructive' : 'default'}>
              {profileStatus.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
              <AlertTitle>{profileStatus.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription>{profileStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={isSavingProfile} className="!rounded-[var(--button-radius)]">
              {isSavingProfile ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="backdrop-blur-md bg-slate-900/50 border border-slate-700 !rounded-[var(--panel-radius)] shadow-xl">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Sign-in is managed by Base44 using Google. Password login is not supported.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-900/40">
              <p className="text-sm text-slate-300 mb-3">Sign-in Actions</p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => User.loginWithRedirect(window.location.href)} className="!rounded-[var(--button-radius)]">
                  Sign in with Google
                </Button>
                <Button variant="outline" onClick={() => User.logout()} className="!rounded-[var(--button-radius)]">
                  Log out
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                To invite users, open Dashboard → Users → Invite. Assign roles like admin, leadmod, mod, viewer.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-900/40">
              <p className="text-sm text-slate-300 mb-3">Email Domain Restriction</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300">Require allowed email domain</span>
                <Switch
                  checked={authForm.require_email_domain}
                  onCheckedChange={(v) => setAuthForm((f) => ({ ...f, require_email_domain: v }))}
                />
              </div>
              <label className="block text-sm font-medium mb-2">Allowed domains (comma separated)</label>
              <Input
                placeholder="example.com, partner.org"
                value={authForm.allowed_email_domains_text}
                onChange={(e) => setAuthForm((f) => ({ ...f, allowed_email_domains_text: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-2">
                Users with emails not matching these domains will be blocked at login if restriction is enabled.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-900/40">
            <p className="text-sm text-slate-300 mb-2">Password Login</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Allow username & password sign-in</span>
              <Switch checked={false} disabled />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Not supported by Base44. Use Google sign-in. If you need this, request it via the Feedback button.
            </p>
          </div>

          {authStatus.message && (
            <Alert variant={authStatus.type === 'error' ? 'destructive' : 'default'}>
              {authStatus.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
              <AlertTitle>{authStatus.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription>{authStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={saveAuthSettings} disabled={authSaving} className="!rounded-[var(--button-radius)]">
              {authSaving ? 'Saving…' : 'Save Auth Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Data Management */}
      <Card className="backdrop-blur-md bg-slate-900/50 border border-slate-700 !rounded-[var(--panel-radius)] shadow-xl">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export all your application data to a single JSON file or import a previously saved backup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} disabled={isExporting} className="flex-1 !rounded-[var(--button-radius)]">
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export All Data
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="flex-1 !rounded-[var(--button-radius)]">
               {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import from JSON
            </Button>
          </div>
          
          {importStatus.message && (
             <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
                {importStatus.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
                <AlertTitle>{importStatus.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Importing data is an additive process. It will create new records but will not delete or update existing ones. Use with caution.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
}
