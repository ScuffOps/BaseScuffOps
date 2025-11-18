
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Medication, MedDose, User } from '@/entities/all';
import { Pill, Plus, Clock, Check, X, History, Settings, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function Meds() {
  const [medications, setMedications] = useState([]);
  const [todaysDoses, setTodaysDoses] = useState([]);
  const [adherenceHistory, setAdherenceHistory] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [newMed, setNewMed] = useState({
    brand_name: '',
    generic_name: '',
    strength_mg: 15,
    dosage_schedule: 'every 6-8 hours',
    instructions: '',
    notes: ''
  });
  const [editDose, setEditDose] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'pending', // 'taken' | 'skipped' | 'pending'
    takenTimeLocal: '', // yyyy-MM-ddTHH:mm
    logged_by: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medsData, dosesData, userData] = await Promise.all([
        Medication.list(),
        MedDose.list('-scheduled_time'),
        User.me()
      ]);

      setMedications(medsData);
      setUser(userData);

      const today = new Date().toISOString().split('T')[0];
      const todayDoses = dosesData.filter((dose) =>
        dose.scheduled_time.startsWith(today)
      );
      setTodaysDoses(todayDoses);

      // Get last 7 days of doses for adherence
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentDoses = dosesData.filter((dose) =>
        new Date(dose.scheduled_time) >= sevenDaysAgo
      );
      setAdherenceHistory(recentDoses);
    } catch (error) {
      console.error('Failed to load medication data:', error);
    }
  };

  const addMedication = async () => {
    try {
      await Medication.create(newMed);
      setNewMed({
        brand_name: '',
        generic_name: '',
        strength_mg: 15,
        dosage_schedule: 'every 6-8 hours',
        instructions: '',
        notes: ''
      });
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to add medication:', error);
    }
  };

  const addTodaysDose = async (medicationId, medicationName) => {
    try {
      const now = new Date();
      await MedDose.create({
        medication_id: medicationId,
        name: medicationName,
        scheduled_time: now.toISOString(),
        logged_by: user?.displayName || user?.full_name || user?.username || user?.email || 'unknown'
      });
      loadData();
    } catch (error) {
      console.error('Failed to add dose:', error);
    }
  };

  const markDoseTaken = async (doseId, takenTime = null) => {
    try {
      const timestamp = takenTime || new Date().toISOString();
      await MedDose.update(doseId, {
        taken_time: timestamp,
        skipped: false, // Ensure skipped is false
        logged_by: user?.displayName || user?.full_name || user?.username || user?.email || 'unknown'
      });
      loadData();
    } catch (error) {
      console.error('Failed to mark dose taken:', error);
    }
  };

  const markDoseSkipped = async (doseId) => {
    try {
      await MedDose.update(doseId, {
        taken_time: null, // Ensure taken_time is null
        skipped: true,
        logged_by: user?.displayName || user?.full_name || user?.username || user?.email || 'unknown'
      });
      loadData();
    } catch (error) {
      console.error('Failed to mark dose skipped:', error);
    }
  };

  const openEditDose = (dose) => {
    const status = dose.taken_time ? 'taken' : dose.skipped ? 'skipped' : 'pending';
    const toLocalInput = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditDose(dose);
    setEditForm({
      status,
      takenTimeLocal: toLocalInput(dose.taken_time),
      logged_by: dose.logged_by || user?.displayName || user?.full_name || user?.username || user?.email || '',
      notes: dose.notes || ''
    });
    setEditOpen(true);
  };

  const saveEditDose = async () => {
    if (!editDose) return;
    const updates = { notes: editForm.notes || undefined };
    if (editForm.status === 'taken') {
      const iso = editForm.takenTimeLocal ?
        new Date(editForm.takenTimeLocal).toISOString() :
        new Date().toISOString();
      updates.taken_time = iso;
      updates.skipped = false;
      updates.logged_by = editForm.logged_by || user?.displayName || user?.full_name || user?.username || user?.email || 'unknown';
    } else if (editForm.status === 'skipped') {
      updates.taken_time = null;
      updates.skipped = true;
      updates.logged_by = editForm.logged_by || user?.displayName || user?.full_name || user?.username || user?.email || 'unknown';
    } else {
      // pending
      updates.taken_time = null;
      updates.skipped = false;
      if (editForm.logged_by) updates.logged_by = editForm.logged_by; // Only update if explicitly set
    }
    await MedDose.update(editDose.id, updates);
    setEditOpen(false);
    setEditDose(null);
    loadData();
  };

  const getTimeOptions = () => {
    const times = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let min of ['00', '30']) {
        times.push(`${hour}:${min} AM`);
      }
    }
    for (let hour = 1; hour <= 12; hour++) {
      for (let min of ['00', '30']) {
        times.push(`${hour}:${min} PM`);
      }
    }
    return times;
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';

    const now = new Date();
    const time = new Date(timestamp);
    const diffHours = Math.floor((now - time) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <Pill className="w-8 h-8 text-green-400" />
            Medication Tracker
          </h1>
          <p className="text-slate-400 mt-1">Track your daily medications and adherence</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-[#0025ff] text-slate-50 px-8 text-sm font-medium \u2BD50025ff] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-11 rounded-md !rounded-[var(--button-radius)]">
              <Plus className="w-5 h-5 mr-2" />
              Add New Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md form-container popup-surface shadow-xl rounded-lg">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Enter the details for a new medication to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Brand Name</label>
                  <Input
                    placeholder="e.g. Adderall"
                    value={newMed.brand_name}
                    onChange={(e) => setNewMed({ ...newMed, brand_name: e.target.value })} />

                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Generic Name</label>
                  <Input
                    placeholder="e.g. amphetamine"
                    value={newMed.generic_name}
                    onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })} />

                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Strength (mg)</label>
                  <Select value={newMed.strength_mg.toString()} onValueChange={(value) => setNewMed({ ...newMed, strength_mg: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5mg</SelectItem>
                      <SelectItem value="10">10mg</SelectItem>
                      <SelectItem value="15">15mg</SelectItem>
                      <SelectItem value="20">20mg</SelectItem>
                      <SelectItem value="25">25mg</SelectItem>
                      <SelectItem value="30">30mg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule</label>
                  <Select value={newMed.dosage_schedule} onValueChange={(value) => setNewMed({ ...newMed, dosage_schedule: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="every 6-8 hours">Every 6-8 hours</SelectItem>
                      <SelectItem value="twice daily">Twice daily</SelectItem>
                      <SelectItem value="once daily">Once daily</SelectItem>
                      <SelectItem value="before bed">Before bed</SelectItem>
                      <SelectItem value="as needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Instructions</label>
                <Input
                  placeholder="e.g. take with food"
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })} />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={newMed.notes}
                  onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })} />

              </div>
              
              <Button onClick={addMedication} className="w-full !rounded-[var(--button-radius)]">
                Add Medication
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
          <TabsTrigger value="today">Today's Doses</TabsTrigger>
          <TabsTrigger value="history">7-Day History</TabsTrigger>
          <TabsTrigger value="medications">Manage Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="space-y-6">
            {medications.map((med) =>
            <Card key={med.id} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg !rounded-[var(--panel-radius)]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Pill className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">{med.brand_name} {med.strength_mg}mg</h3>
                        <p className="text-sm text-slate-400">{med.generic_name} • {med.dosage_schedule}</p>
                      </div>
                    </div>
                    <Button
                    onClick={() => addTodaysDose(med.id, `${med.brand_name} ${med.strength_mg}mg`)}
                    size="sm" className="bg-[#0025ff] text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-9 rounded-md !rounded-[var(--button-radius)]">


                      <Plus className="w-4 h-4 mr-2" />
                      Add Dose
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaysDoses.
                  filter((dose) => dose.medication_id === med.id).
                  map((dose) =>
                  <div key={dose.id} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                      dose.taken_time ? 'bg-green-500' : dose.skipped ? 'bg-red-500' : 'bg-gray-500'}`
                      } />
                            <div>
                              <div className="font-medium text-slate-200">
                                Scheduled: {format(new Date(dose.scheduled_time), 'h:mm a')}
                              </div>
                              {dose.taken_time &&
                        <div className="text-sm text-green-400">
                                  Taken: {format(new Date(dose.taken_time), 'h:mm a')} • {getRelativeTime(dose.taken_time)}
                                  {dose.logged_by && <span className="text-slate-400"> • by {dose.logged_by}</span>}
                                </div>
                        }
                              {dose.skipped &&
                        <div className="text-sm text-red-400">
                                  Skipped
                                  {dose.logged_by && <span className="text-slate-400"> • by {dose.logged_by}</span>}
                                </div>
                        }
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!dose.taken_time && !dose.skipped &&
                      <>
                                <Button
                          onClick={() => markDoseTaken(dose.id)}
                          size="sm"
                          variant="outline"
                          className="text-green-400 border-green-400 hover:bg-green-400/10 !rounded-[var(--button-radius)]">

                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                          onClick={() => markDoseSkipped(dose.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-400 hover:bg-red-400/10 !rounded-[var(--button-radius)]">

                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                      }
                            <Button
                        onClick={() => openEditDose(dose)}
                        size="sm"
                        variant="ghost"
                        className="!rounded-[var(--button-radius)]"
                        title="Edit log">

                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                  )}
                    
                    {todaysDoses.filter((dose) => dose.medication_id === med.id).length === 0 &&
                  <div className="text-center py-8 text-slate-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p>No doses scheduled for today</p>
                        <p className="text-sm">Add a dose to get started</p>
                      </div>
                  }
                  </div>
                  
                  {med.instructions &&
                <div className="mt-4 p-3 bg-blue-500/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
                      <p className="text-sm text-blue-300"><strong>Instructions:</strong> {med.instructions}</p>
                    </div>
                }
                </CardContent>
              </Card>
            )}
            
            {medications.length === 0 &&
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg !rounded-[var(--panel-radius)]">
                <CardContent className="text-center py-12">
                  <Pill className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">No medications added yet</h3>
                  <p className="text-slate-400 mb-6">Add your first medication to start tracking</p>
                  <Button onClick={() => setShowAddDialog(true)} className="!rounded-[var(--button-radius)]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </CardContent>
              </Card>
            }
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                7-Day Adherence History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adherenceHistory.length > 0 ?
                adherenceHistory.map((dose) =>
                <div key={dose.id} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <div>
                        <div className="font-medium text-slate-200">{dose.name}</div>
                        <div className="text-sm text-slate-400">
                          {format(new Date(dose.scheduled_time), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {dose.taken_time ?
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Taken {format(new Date(dose.taken_time), 'h:mm a')}
                          </Badge> :
                    dose.skipped ?
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            Skipped
                          </Badge> :

                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                            Pending
                          </Badge>
                    }
                        {dose.logged_by &&
                    <span className="text-xs text-slate-500">by {dose.logged_by}</span>
                    }
                      </div>
                    </div>
                ) :

                <div className="text-center py-8 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>No medication history yet</p>
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <div className="space-y-4">
            {medications.map((med) =>
            <Card key={med.id} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg !rounded-[var(--panel-radius)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <Pill className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-lg">
                          {med.brand_name} {med.strength_mg}mg
                        </h3>
                        <p className="text-slate-300 mb-2">{med.generic_name}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-slate-400">
                            {med.dosage_schedule}
                          </Badge>
                          {med.instructions &&
                        <Badge variant="outline" className="text-blue-300">
                              {med.instructions}
                            </Badge>
                        }
                        </div>
                        {med.notes &&
                      <p className="text-sm text-slate-400">{med.notes}</p>
                      }
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="!rounded-[var(--button-radius)]">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dose Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => {if (!v) {setEditOpen(false);setEditDose(null);}}}>
        <DialogContent className="sm:max-w-md form-container popup-surface rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Dose Log</DialogTitle>
            <DialogDescription>Update taken status, time, and who logged it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="taken">Taken</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editForm.status === 'taken' &&
            <div>
                <label className="block text-sm font-medium mb-2">Taken Time</label>
                <Input
                type="datetime-local"
                value={editForm.takenTimeLocal}
                onChange={(e) => setEditForm((f) => ({ ...f, takenTimeLocal: e.target.value }))} />

                <p className="text-xs text-slate-400 mt-1">Leave empty to use current time.</p>
              </div>
            }

            <div>
              <label className="block text-sm font-medium mb-2">Logged By</label>
              <Input
                placeholder="email or name"
                value={editForm.logged_by}
                onChange={(e) => setEditForm((f) => ({ ...f, logged_by: e.target.value }))} />

            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Textarea
                placeholder="Optional notes about this dose"
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />

            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setEditOpen(false);setEditDose(null);}}>Cancel</Button>
              <Button onClick={saveEditDose}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
