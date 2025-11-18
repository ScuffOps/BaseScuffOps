import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusChip from '../components/shared/StatusChip';
import { Plus, Settings } from 'lucide-react';

export default function DesignSystem() {
  const Section = ({ title, children }) => (
    <Card className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-50">Design System</h1>

      <Section title="Colors & Theme">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-lg bg-slate-950 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-950 mb-2 border-2 border-slate-700"></div>
            <p className="font-semibold">Background</p>
            <p className="text-sm text-slate-400">slate-950</p>
          </div>
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-900 mb-2 border-2 border-slate-700"></div>
            <p className="font-semibold">Card</p>
            <p className="text-sm text-slate-400">slate-900</p>
          </div>
          <div className="p-6 rounded-lg bg-gradient-to-br from-[var(--color-burgundy)] to-[var(--color-navy)]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-burgundy)] to-[var(--color-navy)] mb-2 border-2 border-white/50"></div>
            <p className="font-semibold text-white">Accent</p>
            <p className="text-sm text-slate-200">Burgundy → Navy</p>
          </div>
          <div className="p-6 rounded-lg bg-blue-500">
            <div className="w-10 h-10 rounded-full bg-blue-500 mb-2 border-2 border-white/50"></div>
            <p className="font-semibold text-white">Primary Action</p>
            <p className="text-sm text-blue-100">blue-500</p>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="icon"><Settings className="w-4 h-4" /></Button>
          <Button><Plus className="w-4 h-4 mr-2" />With Icon</Button>
        </div>
      </Section>

      <Section title="Form Elements">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="input-example" className="text-sm font-medium">Input</label>
            <Input id="input-example" placeholder="e.g., Creator Name" />
          </div>
          <div className="space-y-2">
            <label htmlFor="select-example" className="text-sm font-medium">Select</label>
            <Select>
              <SelectTrigger id="select-example">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="textarea-example" className="text-sm font-medium">Textarea</label>
            <Textarea id="textarea-example" placeholder="Type your notes here..." />
          </div>
        </div>
      </Section>

      <Section title="Chip System">
        <div>
          <h3 className="font-semibold mb-3">Priority</h3>
          <div className="flex flex-wrap gap-3">
            <StatusChip status="Urgent" />
            <StatusChip status="High" />
            <StatusChip status="Normal" />
            <StatusChip status="Low" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Status</h3>
          <div className="flex flex-wrap gap-3">
            <StatusChip status="Done" />
            <StatusChip status="In Progress" />
            <StatusChip status="Todo" />
            <StatusChip status="In Review" />
            <StatusChip status="Rejected" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Roles</h3>
          <div className="flex flex-wrap gap-3">
            <StatusChip status="Admin" />
            <StatusChip status="Lead Mod" />
            <StatusChip status="Mod" />
            <StatusChip status="Viewer" />
          </div>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal Title</DialogTitle>
              </DialogHeader>
              <p className="text-slate-300">This is the content of the modal dialog. It overlays the main content.</p>
            </DialogContent>
          </Dialog>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="p-4 border-t border-slate-800 mt-2">
            This is the overview tab content.
          </TabsContent>
          <TabsContent value="analytics" className="p-4 border-t border-slate-800 mt-2">
            This is the analytics tab content.
          </TabsContent>
          <TabsContent value="settings" className="p-4 border-t border-slate-800 mt-2">
            This is the settings tab content.
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}