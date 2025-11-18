
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BrainDumpItem, WaterIntake, User } from '@/entities/all';
import {
  Brain,
  FileText,
  Palette,
  MessageCircle,
  Droplets,
  Image,
  Archive,
  Trash2,
  Check,
  Plus,
  Pencil } from
'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from
'@/components/ui/dialog';
import { UploadFile } from '@/integrations/Core'; // NEW: for uploading pasted/selected images

const STICKY_COLORS = [
'#fef3c7', '#fecaca', '#a7f3d0', '#bfdbfe', '#e9d5ff', '#fed7d7', '#d1fae5', '#fde68a'];

// NEW: user-provided swatches (invalid hex values will be ignored gracefully)
const STICKY_SWATCHES = [
'#1f42ad', 
'#c7a89c',
'#753243',
'#612529',
'#3c5693',
'#4c6f91',
'#476e8c',
'#553052',
'#3a4b5b',
'#755665',
'#6b2035',
'#c0abb2',
'#47698d'];


export default function BrainDump() {
  const [notepadContent, setNotepadContent] = useState('');
  const [stickyNotes, setStickyNotes] = useState([]);
  const [sortLaterItems, setSortLaterItems] = useState([]);
  const [waterIntake, setWaterIntake] = useState({ cups_completed: 0, target_cups: 8 });
  const [dmTrackers, setDmTrackers] = useState([]);
  const [newDm, setNewDm] = useState({ name: '', platform: '', status: 'pending' });
  const [newSticky, setNewSticky] = useState('');

  // NEW: authorship and edit permissions related states
  const [currentUser, setCurrentUser] = useState(null);
  const [notepadItem, setNotepadItem] = useState(null); // To store the full notepad item object
  const [newStickyColor, setNewStickyColor] = useState(STICKY_COLORS[0]); // For color picker

  // Sticky editor states
  const [editingSticky, setEditingSticky] = useState(null);
  const [stickyEditor, setStickyEditor] = useState({ content: '', color: STICKY_COLORS[0] });
  const [stickyEditOpen, setStickyEditOpen] = useState(false);

  // DM editor states
  const [editingDm, setEditingDm] = useState(null);
  const [dmEditor, setDmEditor] = useState({ name: '', platform: '', status: 'pending' });
  const [dmEditOpen, setDmEditOpen] = useState(false);

  // Gallery pins states
  const [galleryPins, setGalleryPins] = useState([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryNote, setNewGalleryNote] = useState('');
  const [editingPin, setEditingPin] = useState(null);
  const [pinEditor, setPinEditor] = useState({ url: '', note: '' });
  const [pinEditOpen, setPinEditOpen] = useState(false);

  const [resizing, setResizing] = useState(null); // {id, startX, startY, startW, startH}
  const galleryFileRef = React.useRef(null); // NEW
  const stickyFileRef = React.useRef(null); // NEW

  useEffect(() => {
    loadBrainDumpData();
    loadWaterIntake();
    // NEW: fetch current user
    User.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // Derive stable primitives for hook dependencies
  const userRole = currentUser?.role;
  const userEmail = currentUser?.email;

  // Utility function to check if the current user can edit an item (memoized)
  const canEdit = useCallback((item) => {
    if (!userRole && !userEmail) return false;
    return userRole === 'admin' || userRole === 'leadmod' || item.created_by === userEmail;
  }, [userRole, userEmail]);

  // Attach global mouse handlers while resizing
  useEffect(() => {
    if (!resizing) return;

    const onMove = (e) => {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      const nextW = Math.max(160, Math.round(resizing.startW + dx));
      const nextH = Math.max(120, Math.round(resizing.startH + dy));
      setStickyNotes((prev) =>
      prev.map((s) => s.id === resizing.id ? { ...s, width: nextW, height: nextH } : s)
      );
    };

    const onUp = async () => {
      const updated = stickyNotes.find((s) => s.id === resizing.id);
      if (updated && canEdit(updated)) {
        await BrainDumpItem.update(updated.id, { width: updated.width, height: updated.height });
      }
      setResizing(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, stickyNotes, canEdit]);

  // Helpers: detect image URL (http(s) or data URL)
  function isImageUrl(text) {
    if (!text || typeof text !== 'string') return false;
    if (text.startsWith('data:image/')) return true;
    const u = text.trim();
    return /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u);
  }

  function extractImageUrlFromText(text) {
    if (!text) return null;
    // basic grab of a url-looking token
    const match = text.match(/https?:\/\/[^\s)]+/i);
    if (!match) return null;
    const url = match[0];
    return isImageUrl(url) ? url : null;
  }

  // NEW: Upload to Gallery
  const handleGalleryFiles = async (files) => {
    if (!files?.length || !currentUser) return;
    for (const file of files) {
      const { file_url } = await UploadFile({ file });
      const pin = await BrainDumpItem.create({
        type: 'gallery_pin',
        content: file_url,
        metadata: { note: '' },
        created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email
      });
      setGalleryPins((prev) => [...prev, pin]);
      setSortLaterItems((prev) => [...prev, pin]);
    }
  };

  // NEW: Upload to Stickies (image sticky)
  const handleStickyFiles = async (files) => {
    if (!files?.length || !currentUser) return;
    const DEFAULT_W = 260;
    const DEFAULT_H = 180;
    for (const file of files) {
      const { file_url } = await UploadFile({ file });
      const sticky = await BrainDumpItem.create({
        type: 'sticky',
        content: file_url, // store image URL as content
        color: '#ffffff', // neutral bg for image
        position: { x: Math.random() * 300, y: Math.random() * 200 },
        created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email,
        width: DEFAULT_W,
        height: DEFAULT_H
      });
      setStickyNotes((prev) => [...prev, sticky]);
      setSortLaterItems((prev) => [...prev, sticky]);
    }
  };

  // NEW: Paste handlers
  const onPasteGallery = async (e) => {
    const items = e.clipboardData?.items || [];
    let handled = false;

    // If image files present
    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) {
          handled = true;
          await handleGalleryFiles([file]);
        }
      }
    }
    // If not handled, try text containing image URL
    if (!handled) {
      const text = e.clipboardData?.getData('text') || '';
      const url = extractImageUrlFromText(text);
      if (url) {
        handled = true;
        if (!currentUser) return;
        const pin = await BrainDumpItem.create({
          type: 'gallery_pin',
          content: url,
          metadata: { note: '' },
          created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email
        });
        setGalleryPins((prev) => [...prev, pin]);
        setSortLaterItems((prev) => [...prev, pin]);
      }
    }
    if (handled) e.preventDefault();
  };

  const onPasteStickies = async (e) => {
    const items = e.clipboardData?.items || [];
    let handled = false;

    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) {
          handled = true;
          await handleStickyFiles([file]);
        }
      }
    }
    if (!handled) {
      const text = e.clipboardData?.getData('text') || '';
      const url = extractImageUrlFromText(text);
      if (url) {
        handled = true;
        if (!currentUser) return;
        const DEFAULT_W = 260;
        const DEFAULT_H = 180;
        const sticky = await BrainDumpItem.create({
          type: 'sticky',
          content: url,
          color: '#ffffff',
          position: { x: Math.random() * 300, y: Math.random() * 200 },
          created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email,
          width: DEFAULT_W,
          height: DEFAULT_H
        });
        setStickyNotes((prev) => [...prev, sticky]);
        setSortLaterItems((prev) => [...prev, sticky]);
      }
    }
    if (handled) e.preventDefault();
  };

  const loadBrainDumpData = async () => {
    try {
      const items = await BrainDumpItem.list('-created_date');

      setStickyNotes(items.filter((item) => item.type === 'sticky'));
      setSortLaterItems(items.filter((item) => item.unsorted));
      setDmTrackers(items.filter((item) => item.type === 'dm_tracker'));
      setGalleryPins(items.filter((item) => item.type === 'gallery_pin')); // Load gallery pins

      // Load notepad content and item
      const np = items.find((item) => item.type === 'note');
      if (np) {
        setNotepadItem(np); // Store the full item object
        setNotepadContent(np.content);
      } else {
        setNotepadItem(null);
        setNotepadContent('');
      }
    } catch (error) {
      console.error('Failed to load brain dump data:', error);
    }
  };

  const loadWaterIntake = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const intakes = await WaterIntake.filter({ date: today });

      if (intakes.length > 0) {
        setWaterIntake(intakes[0]);
      } else {
        // Create today's entry
        const newIntake = await WaterIntake.create({
          date: today,
          cups_completed: 0,
          target_cups: 8
        });
        setWaterIntake(newIntake);
      }
    } catch (error) {
      console.error('Failed to load water intake:', error);
    }
  };

  const saveNotepad = useCallback(async (content) => {
    try {
      const existing = await BrainDumpItem.filter({ type: 'note' });

      if (existing.length > 0) {
        const target = existing[0];
        // Only allow edit if owner or admin/leadmod
        if (canEdit(target)) {
          await BrainDumpItem.update(target.id, { content });
          setNotepadItem({ ...target, content }); // Update notepadItem state
        }
      } else if (currentUser) {// Only create if a user is logged in
        const created = await BrainDumpItem.create({
          type: 'note',
          content,
          unsorted: false,
          // NEW: Add authorship
          created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email
        });
        setNotepadItem(created); // Store the full item object
      }
    } catch (error) {
      console.error('Failed to save notepad:', error);
    }
  }, [currentUser, setNotepadItem, canEdit]); // Dependencies for useCallback

  const addStickyNote = async () => {
    if (!newSticky.trim() || !currentUser) return; // Require current user to create

    // Validate color (hex #RRGGBB)
    const hexOk = /^#([0-9a-f]{6})$/i.test(newStickyColor);
    const color = hexOk ? newStickyColor : STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    const DEFAULT_W = 260;
    const DEFAULT_H = 180;

    try {
      const sticky = await BrainDumpItem.create({
        type: 'sticky',
        content: newSticky,
        color,
        position: { x: Math.random() * 300, y: Math.random() * 200 },
        // NEW: Add authorship
        created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email,
        width: DEFAULT_W,
        height: DEFAULT_H
      });

      setStickyNotes([...stickyNotes, sticky]);
      setSortLaterItems([...sortLaterItems, sticky]);
      setNewSticky('');
      setNewStickyColor(STICKY_COLORS[0]); // Reset color selection
    } catch (error) {
      console.error('Failed to add sticky note:', error);
    }
  };

  // Sticky editing functions
  const openEditSticky = (sticky) => {
    if (!canEdit(sticky)) return;
    setEditingSticky(sticky);
    setStickyEditor({ content: sticky.content, color: sticky.color || STICKY_COLORS[0] });
    setStickyEditOpen(true);
  };

  const saveEditSticky = async () => {
    if (!editingSticky || !canEdit(editingSticky)) return;
    try {
      await BrainDumpItem.update(editingSticky.id, {
        content: stickyEditor.content,
        color: stickyEditor.color
      });
      setStickyEditOpen(false);
      setEditingSticky(null);
      loadBrainDumpData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Failed to save sticky edit:', error);
    }
  };

  const addDmTracker = async () => {
    if (!newDm.name.trim() || !currentUser) return; // Require current user to create

    try {
      const dm = await BrainDumpItem.create({
        type: 'dm_tracker',
        content: newDm.name,
        metadata: {
          platform: newDm.platform,
          status: newDm.status
        },
        // NEW: Add authorship
        created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email
      });

      setDmTrackers([...dmTrackers, dm]);
      setSortLaterItems([...sortLaterItems, dm]);
      setNewDm({ name: '', platform: '', status: 'pending' });
    } catch (error) {
      console.error('Failed to add DM tracker:', error);
    }
  };

  // DM editing functions
  const openEditDm = (dm) => {
    if (!canEdit(dm)) return;
    setEditingDm(dm);
    setDmEditor({
      name: dm.content || '',
      platform: dm.metadata?.platform || '',
      status: dm.metadata?.status || 'pending'
    });
    setDmEditOpen(true);
  };

  const saveEditDm = async () => {
    if (!editingDm || !canEdit(editingDm)) return;
    try {
      await BrainDumpItem.update(editingDm.id, {
        content: dmEditor.name,
        metadata: { platform: dmEditor.platform, status: dmEditor.status }
      });
      setDmEditOpen(false);
      setEditingDm(null);
      loadBrainDumpData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Failed to save DM edit:', error);
    }
  };

  // Gallery Pins functions
  const addGalleryPin = async () => {
    if (!newGalleryUrl.trim() || !currentUser) return; // Require current user to create
    try {
      const pin = await BrainDumpItem.create({
        type: 'gallery_pin',
        content: newGalleryUrl,
        metadata: { note: newGalleryNote },
        // NEW: Add authorship
        created_by_name: currentUser.displayName || currentUser.full_name || currentUser.username || currentUser.email
      });
      setGalleryPins([...galleryPins, pin]);
      setNewGalleryUrl('');
      setNewGalleryNote('');
      setSortLaterItems([...sortLaterItems, pin]); // Gallery pins also go to "Sort Later"
    } catch (error) {
      console.error('Failed to add gallery pin:', error);
    }
  };

  const openEditPin = (pin) => {
    if (!canEdit(pin)) return;
    setEditingPin(pin);
    setPinEditor({ url: pin.content, note: pin.metadata?.note || '' });
    setPinEditOpen(true);
  };

  const saveEditPin = async () => {
    if (!editingPin || !canEdit(editingPin)) return;
    try {
      await BrainDumpItem.update(editingPin.id, {
        content: pinEditor.url,
        metadata: { note: pinEditor.note }
      });
      setPinEditOpen(false);
      setEditingPin(null);
      loadBrainDumpData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Failed to save pin edit:', error);
    }
  };

  const updateWaterIntake = async (cups) => {
    try {
      const updated = await WaterIntake.update(waterIntake.id, {
        cups_completed: cups
      });
      setWaterIntake(updated);
    } catch (error) {
      console.error('Failed to update water intake:', error);
    }
  };

  const markSorted = async (itemId) => {
    // For marking sorted, generally any user can mark any item as sorted for their view
    // However, if we want to restrict it only to the creator or mods, we'd need to fetch the item first
    // For now, assuming marking as sorted is a personal organization action
    try {
      await BrainDumpItem.update(itemId, { unsorted: false });
      setSortLaterItems(sortLaterItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Failed to mark as sorted:', error);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const itemToDelete = [...stickyNotes, ...dmTrackers, ...galleryPins, ...sortLaterItems].find((item) => item.id === itemId);
      if (!itemToDelete || !canEdit(itemToDelete)) {
        console.warn('Attempted to delete item without sufficient permissions or item not found.');
        return;
      }

      await BrainDumpItem.delete(itemId);
      setSortLaterItems(sortLaterItems.filter((item) => item.id !== itemId));
      setStickyNotes(stickyNotes.filter((item) => item.id !== itemId));
      setDmTrackers(dmTrackers.filter((item) => item.id !== itemId));
      setGalleryPins(galleryPins.filter((item) => item.id !== itemId)); // Also filter gallery pins
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  // Auto-save notepad
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if content has actually changed from loaded state AND user has permission
      if (notepadContent !== (notepadItem ? notepadItem.content : '') && (notepadItem ? canEdit(notepadItem) : currentUser)) {
        saveNotepad(notepadContent);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notepadContent, notepadItem, saveNotepad, currentUser, canEdit]); // Add saveNotepad, currentUser, canEdit to dependency array

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Brain Dump
          </h1>
          <p className="text-slate-400 mt-1">ADHD-friendly capture space for all your thoughts</p>
        </div>
      </div>

      <Tabs defaultValue="notepad" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="notepad">Notepad</TabsTrigger>
          <TabsTrigger value="sketch">Sketch</TabsTrigger>
          <TabsTrigger value="stickies">Stickies</TabsTrigger>
          <TabsTrigger value="dms">DMs</TabsTrigger>
          <TabsTrigger value="water">Water</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="notepad">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Freeform Notepad
                <span className="text-xs text-slate-500 font-normal ml-auto">
                  {notepadItem ? `Created by ${notepadItem.created_by_name || notepadItem.created_by}` : currentUser ? `You` : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Disable editing if not owner or admin/leadmod */}
              <Textarea
                value={notepadContent}
                onChange={(e) => setNotepadContent(e.target.value)}
                placeholder="Brain dump everything here... thoughts, ideas, random notes, whatever's on your mind!"
                className="min-h-[400px] text-base leading-relaxed"
                disabled={Boolean(notepadItem && !canEdit(notepadItem))} />

              {notepadItem && canEdit(notepadItem) &&
              <div className="text-right text-xs text-slate-500 mt-2">You can edit this note.</div>
              }
              {notepadItem && !canEdit(notepadItem) &&
              <div className="text-right text-xs text-slate-500 mt-2">Read-only • Owned by {notepadItem.created_by_name || notepadItem.created_by}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sketch">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Sketch Canvas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-slate-500">
                <Palette className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg">Canvas coming soon!</p>
                <p className="text-sm">Simple drawing tools for visual thinking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stickies">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight flex items-center gap-2">Stιϲƙყboιι's


              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" onPaste={onPasteStickies}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={newSticky}
                    onChange={(e) => setNewSticky(e.target.value)}
                    placeholder="Quick note..."
                    onKeyPress={(e) => e.key === 'Enter' && addStickyNote()}
                    className="flex-1 min-w-[220px]" />

                  <Button onClick={addStickyNote}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  {/* NEW: upload image to stickies */}
                  <input
                    ref={stickyFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleStickyFiles(Array.from(e.target.files || []))} />

                  <Button variant="outline" onClick={() => stickyFileRef.current?.click()}>
                    Upload Image
                  </Button>
                </div>
                {/* ... keep existing code (color swatches) ... */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">Color:</span>
                  {STICKY_SWATCHES.map((hex) => {
                    const valid = /^#([0-9a-f]{6})$/i.test(hex);
                    if (!valid) return null;
                    return (
                      <button
                        key={hex}
                        onClick={() => setNewStickyColor(hex)}
                        className={`w-6 h-6 rounded-md border ${newStickyColor === hex ? 'ring-2 ring-purple-400' : ''}`}
                        style={{ backgroundColor: hex, borderColor: 'rgba(255,255,255,0.2)' }}
                        title={hex} />);


                  })}
                  <span className="text-xs text-slate-500 ml-auto">Tip: Paste images directly here to create sticky images.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
                {stickyNotes.map((sticky) => {
                  const isImg = isImageUrl(sticky.content);
                  return (
                    <div
                      key={sticky.id}
                      className="relative p-3 rounded-lg shadow-sm border border-slate-700"
                      style={{
                        backgroundColor: sticky.color || (isImg ? '#ffffff' : '#fef3c7'),
                        color: isImg ? '#111' : '#000',
                        width: (sticky.width || 260) + 'px',
                        height: (sticky.height || 180) + 'px',
                        overflow: 'hidden'
                      }}>

                      {isImg ?
                      <div className="w-full h-full">
                          <img
                          src={sticky.content}
                          alt="sticky"
                          className="w-full h-full object-contain"
                          onError={(e) => {e.currentTarget.src = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=600&q=60&auto=format&fit=crop';}} />

                        </div> :

                      <p className="text-sm mb-6 whitespace-pre-wrap break-words overflow-auto h-full pr-2">{sticky.content}</p>
                      }

                      <div className="absolute bottom-2 left-3 right-9 flex items-center justify-between text-xs">
                        <span className="text-slate-700/80">
                          by {sticky.created_by_name || sticky.created_by}
                        </span>
                        {canEdit(sticky) &&
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditSticky(sticky)} className="p-1 h-auto text-slate-700/80 hover:text-slate-900">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteItem(sticky.id)} className="p-1 h-auto text-slate-700/80 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        }
                      </div>

                      {canEdit(sticky) &&
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setResizing({
                            id: sticky.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            startW: sticky.width || 260,
                            startH: sticky.height || 180
                          });
                        }}
                        title="Drag to resize"
                        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize">

                          <div className="w-full h-full bg-slate-900/40 border border-slate-700 rounded-sm" />
                        </div>
                      }
                    </div>);

                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dms">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                Return-DM Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={newDm.name}
                  onChange={(e) => setNewDm({ ...newDm, name: e.target.value })}
                  placeholder="Person's name..." />

                <Input
                  value={newDm.platform}
                  onChange={(e) => setNewDm({ ...newDm, platform: e.target.value })}
                  placeholder="Platform (Discord, Twitter...)" />

                <Button onClick={addDmTracker}>Add Reminder</Button>
              </div>

              <div className="space-y-2">
                {dmTrackers.map((dm) =>
                <div key={dm.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <span className="font-medium">{dm.content}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        on {dm.metadata?.platform} • by {dm.created_by_name || dm.created_by}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {canEdit(dm) &&
                    <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDm(dm)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                        onClick={() => deleteItem(dm.id)}
                        variant="ghost"
                        size="sm"
                        title="Delete">

                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                    }
                      <Button
                      onClick={() => markSorted(dm.id)}
                      variant="ghost"
                      size="sm"
                      title="Mark sorted">

                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="water">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                Water Intake Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="text-4xl font-bold text-slate-200">
                  {waterIntake.cups_completed} / {waterIntake.target_cups}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: waterIntake.target_cups }, (_, i) =>
                  <button
                    key={i}
                    onClick={() => updateWaterIntake(i + 1)}
                    className={`w-16 h-16 rounded-full border-2 transition-colors ${
                    i < waterIntake.cups_completed ?
                    'bg-blue-500 border-blue-400' :
                    'border-slate-600 hover:border-slate-500'}`
                    }>

                      <Droplets className={`w-8 h-8 mx-auto ${
                    i < waterIntake.cups_completed ? 'text-white' : 'text-slate-600'}`
                    } />
                    </button>
                  )}
                </div>
                <p className="text-slate-400">Click to mark cups as completed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/40 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-pink-400" />
                Gallery Pins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" onPaste={onPasteGallery}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="Image or page URL…"
                  className="md:col-span-2" />

                <Input
                  value={newGalleryNote}
                  onChange={(e) => setNewGalleryNote(e.target.value)}
                  placeholder="Note (optional)" />

                <div className="flex gap-2">
                  <Button onClick={addGalleryPin} className="flex-1">Add Pin</Button>
                  {/* NEW: upload image to gallery */}
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleGalleryFiles(Array.from(e.target.files || []))} />

                  <Button variant="outline" onClick={() => galleryFileRef.current?.click()} title="Upload images">
                    Upload
                  </Button>
                </div>
              </div>

              {galleryPins.length === 0 ?
              <div className="text-center py-16 text-slate-500">
                  <Image className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg">No pins yet</p>
                  <p className="text-sm">Drop links, upload, or paste images here</p>
                </div> :

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryPins.map((pin) =>
                <Card key={pin.id} className="bg-slate-900/40 border border-slate-800/60">
                      <CardContent className="p-3">
                        <a href={pin.content} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-800/60">
                          <img
                        src={pin.content}
                        alt={pin.metadata?.note || 'pin'}
                        className="w-full h-40 object-cover"
                        onError={(e) => {e.currentTarget.src = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=600&q=60&auto=format&fit=crop';}} // Placeholder image on error
                      />
                        </a>
                        {pin.metadata?.note && <p className="mt-2 text-sm text-slate-300">{pin.metadata.note}</p>}
                        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                          <span>by {pin.created_by_name || pin.created_by}</span>
                          {canEdit(pin) &&
                      <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditPin(pin)} className="p-1 h-auto text-slate-500 hover:text-slate-300">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteItem(pin.id)} className="p-1 h-auto text-slate-500 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                      }
                        </div>
                      </CardContent>
                    </Card>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sort Later Tray */}
      {sortLaterItems.length > 0 &&
      <Card className="bg-slate-800/30 backdrop-blur-xl border-dashed border-orange-500/50 !rounded-[var(--panel-radius)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-orange-400" />
              Sort Later - Pending Organization
              <span className="text-sm font-normal text-slate-400">({sortLaterItems.length} items)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortLaterItems.map((item) =>
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <span className="capitalize text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded mr-2">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span>{item.content?.slice(0, 50) || item.metadata?.note?.slice(0, 50) || item.content}...</span>
                    <span className="ml-2 text-xs text-slate-500">by {item.created_by_name || item.created_by}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                  onClick={() => markSorted(item.id)}
                  variant="ghost"
                  size="sm"
                  title="Mark as sorted">

                      <Check className="w-4 h-4" />
                    </Button>
                    {canEdit(item) && // Only show delete if user can edit
                <Button
                  onClick={() => deleteItem(item.id)}
                  variant="ghost"
                  size="sm"
                  title="Delete">

                        <Trash2 className="w-4 h-4" />
                      </Button>
                }
                  </div>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      }

      {/* EDIT DIALOGS */}
      {/* Sticky Edit Dialog */}
      <Dialog open={stickyEditOpen} onOpenChange={(v) => {if (!v) {setStickyEditOpen(false);setEditingSticky(null);}}}>
        <DialogContent className="sm:max-w-md form-container">
          <DialogHeader>
            <DialogTitle>Edit Sticky Note</DialogTitle>
            <DialogDescription>Update the text and color of your sticky note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea value={stickyEditor.content} onChange={(e) => setStickyEditor((s) => ({ ...s, content: e.target.value }))} />
            <div className="flex flex-wrap gap-2">
              {STICKY_SWATCHES.map((hex) => {
                const valid = /^#([0-9a-f]{6})$/i.test(hex);
                if (!valid) return null;
                return (
                  <button
                    key={hex}
                    onClick={() => setStickyEditor((s) => ({ ...s, color: hex }))}
                    className={`w-7 h-7 rounded-md border ${stickyEditor.color === hex ? 'ring-2 ring-purple-400' : ''}`}
                    style={{ backgroundColor: hex, borderColor: 'rgba(255,255,255,0.2)' }}
                    title={hex} />);


              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setStickyEditOpen(false);setEditingSticky(null);}}>Cancel</Button>
              <Button onClick={saveEditSticky}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DM Edit Dialog */}
      <Dialog open={dmEditOpen} onOpenChange={(v) => {if (!v) {setDmEditOpen(false);setEditingDm(null);}}}>
        <DialogContent className="sm:max-w-md form-container">
          <DialogHeader>
            <DialogTitle>Edit DM Reminder</DialogTitle>
            <DialogDescription>Change person's name, platform, or status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={dmEditor.name} onChange={(e) => setDmEditor((s) => ({ ...s, name: e.target.value }))} placeholder="Person's Name" />
            <Input value={dmEditor.platform} onChange={(e) => setDmEditor((s) => ({ ...s, platform: e.target.value }))} placeholder="Platform (e.g., Discord, Twitter)" />
            <Input value={dmEditor.status} onChange={(e) => setDmEditor((s) => ({ ...s, status: e.target.value }))} placeholder="Status (e.g., pending, completed)" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setDmEditOpen(false);setEditingDm(null);}}>Cancel</Button>
              <Button onClick={saveEditDm}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Pin Edit Dialog */}
      <Dialog open={pinEditOpen} onOpenChange={(v) => {if (!v) {setPinEditOpen(false);setEditingPin(null);}}}>
        <DialogContent className="sm:max-w-md form-container">
          <DialogHeader>
            <DialogTitle>Edit Gallery Pin</DialogTitle>
            <DialogDescription>Update the URL and note for this pin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={pinEditor.url} onChange={(e) => setPinEditor((s) => ({ ...s, url: e.target.value }))} placeholder="Image or Page URL" />
            <Input value={pinEditor.note} onChange={(e) => setPinEditor((s) => ({ ...s, note: e.target.value }))} placeholder="Note (optional)" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {setPinEditOpen(false);setEditingPin(null);}}>Cancel</Button>
              <Button onClick={saveEditPin}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}