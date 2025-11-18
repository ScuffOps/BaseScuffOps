
import { useState, useEffect } from 'react';
import { BrandAsset, License } from '@/entities/all';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FolderKanban, KeyRound } from 'lucide-react';
import AssetLibrary from '../components/brand/AssetLibrary';
import LicenseLog from '../components/brand/LicenseLog';

const PASSWORD = "Scuff0x";

// Updated: generic, closable PasswordGate used only for Debut
function PasswordGate({ open, onUnlock, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === PASSWORD) {
      onUnlock();
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel?.(); }}>
      <DialogContent className="max-w-md form-container popup-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-yellow-400" />
            Debut Section Locked
          </DialogTitle>
          <DialogDescription>
            Enter the password to access Debut assets only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Unlock</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BrandPage() {
  const [assets, setAssets] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [activeTab, setActiveTab] = useState('library');
  const [isDebutUnlocked, setIsDebutUnlocked] = useState(sessionStorage.getItem('debut-unlocked') === 'true');
  const [showDebutGate, setShowDebutGate] = useState(false);

  const loadData = async () => {
    const [assetsData, licensesData] = await Promise.all([
      BrandAsset.list(),
      License.list()
    ]);
    setAssets(assetsData);
    setLicenses(licensesData);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-blue-400" />
            Brand Library
          </h1>
          <p className="text-slate-400 mt-1">Your central hub for all brand assets and licenses.</p>
        </div>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v === 'debut' && !isDebutUnlocked) {
            setShowDebutGate(true);
            return;
          }
          setActiveTab(v);
        }}
      >
        <TabsList>
          <TabsTrigger value="library">Asset Library</TabsTrigger>
          <TabsTrigger value="licenses">License Log</TabsTrigger>
          <TabsTrigger value="debut">Debut</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <AssetLibrary assets={assets} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="licenses" className="mt-6">
          <LicenseLog licenses={licenses} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="debut" className="mt-6">
          {isDebutUnlocked ? (
            <AssetLibrary assets={assets.filter(a => a.board === 'Debut')} onUpdate={loadData} />
          ) : (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300">
              This section is locked — select Debut again to unlock.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showDebutGate && (
        <PasswordGate
          open={showDebutGate}
          onUnlock={() => {
            sessionStorage.setItem('debut-unlocked', 'true');
            setIsDebutUnlocked(true);
            setShowDebutGate(false);
            setActiveTab('debut');
          }}
          onCancel={() => {
            setShowDebutGate(false);
            setActiveTab('library');
          }}
        />
      )}
    </div>
  );
}
