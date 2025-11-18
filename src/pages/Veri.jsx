import React, { useEffect, useMemo, useState } from "react";
import { VeriProfile } from "@/entities/VeriProfile";
import { VeriFolder } from "@/entities/VeriFolder";
import { VeriAsset } from "@/entities/VeriAsset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from
"@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderPlus, ImagePlus, ArrowLeft, ChevronRight, Edit2, Music, Calendar, Heart } from "lucide-react";

const PALETTE = [
"#c7a89c", "#753243", "#612529", "#3c5693", "#4c6f91", "#476e8c",
"#553052", "#3a4b5b", "#755665", "#6b2035", "#c0abb2", "#47698d"];


function Pill({ children, color = PALETTE[5] }) {
  return (
    <Badge variant="outline" className="rounded-full border text-white" style={{ backgroundColor: color, borderColor: color }}>
      {children}
    </Badge>);

}

export default function VeriPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [path, setPath] = useState([]); // array of folder objects to build breadcrumbs
  const currentParentId = path.length ? path[path.length - 1].id : null;
  const [folders, setFolders] = useState([]);
  const [assets, setAssets] = useState([]);

  // Dialogs
  const [profileOpen, setProfileOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({
    name: "Veri",
    avatar: "",
    theme_song_url: "",
    likes: [],
    dislikes: [],
    lore: "",
    skills: [],
    birthday: "",
    aliases: [],
    color_palette: [],
    notes: ""
  });

  const [folderForm, setFolderForm] = useState({
    name: "",
    section: "Custom",
    cover_url: "",
    description: ""
  });

  const [assetForm, setAssetForm] = useState({
    title: "",
    url: "",
    thumb_url: "",
    notes: "",
    tags: []
  });

  const SECTIONS = useMemo(() => [
  { id: "Tattoos", label: "Tattoos" },
  { id: "Seals", label: "Seals" },
  { id: "AltHairstyles", label: "Alt Hairstyles" },
  { id: "AltOutfits", label: "Alt Outfits" },
  { id: "Misc", label: "Misc" },
  { id: "Custom", label: "Custom" }],
  []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profiles = await VeriProfile.list();
      if (profiles && profiles.length) {
        const p = profiles[0];
        setProfile(p);
        setProfileForm({
          name: p.name || "Veri",
          avatar: p.avatar || "",
          theme_song_url: p.theme_song_url || "",
          likes: p.likes || [],
          dislikes: p.dislikes || [],
          lore: p.lore || "",
          skills: p.skills || [],
          birthday: p.birthday || "",
          aliases: p.aliases || [],
          color_palette: p.color_palette || [],
          notes: p.notes || ""
        });
        loadChildren(p.id, null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadChildren(characterId, parentId) {
    const folderList = await VeriFolder.filter(
      parentId ? { character_id: characterId, parent_id: parentId } : { character_id: characterId, parent_id: null },
      "-created_date"
    );
    setFolders(folderList);
    if (parentId) {
      const assetList = await VeriAsset.filter({ folder_id: parentId }, "-created_date");
      setAssets(assetList);
    } else {
      setAssets([]);
    }
  }

  async function saveProfile() {
    if (profile) {
      const updated = await VeriProfile.update(profile.id, profileForm);
      setProfile(updated);
    } else {
      const created = await VeriProfile.create(profileForm);
      setProfile(created);
      await loadChildren(created.id, null);
    }
    setProfileOpen(false);
  }

  async function createFolder() {
    if (!profile) return;
    const newFolder = await VeriFolder.create({
      character_id: profile.id,
      name: folderForm.name,
      section: folderForm.section,
      parent_id: currentParentId || null,
      cover_url: folderForm.cover_url,
      description: folderForm.description
    });
    setFolderOpen(false);
    setFolderForm({ name: "", section: "Custom", cover_url: "", description: "" });
    loadChildren(profile.id, currentParentId);
  }

  async function createAsset() {
    if (!currentParentId) return;
    await VeriAsset.create({
      folder_id: currentParentId,
      title: assetForm.title,
      url: assetForm.url,
      thumb_url: assetForm.thumb_url || assetForm.url,
      notes: assetForm.notes,
      tags: assetForm.tags?.filter(Boolean) || []
    });
    setAssetOpen(false);
    setAssetForm({ title: "", url: "", thumb_url: "", notes: "", tags: [] });
    if (profile) loadChildren(profile.id, currentParentId);
  }

  function openFolder(folder) {
    const newPath = [...path, folder];
    setPath(newPath);
    if (profile) loadChildren(profile.id, folder.id);
  }

  function goUp(index) {
    const newPath = path.slice(0, index);
    setPath(newPath);
    const parent = newPath.length ? newPath[newPath.length - 1] : null;
    if (profile) loadChildren(profile.id, parent ? parent.id : null);
  }

  if (loading) {
    return <div className="p-6">Loading Veri…</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Veri</h1>
        <div className="flex gap-2">
          <Button onClick={() => setProfileOpen(true)} className="!rounded-[var(--button-radius)]">
            {profile ? "Edit Profile" : "Create Profile"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-slate-900/70 border-slate-800 !rounded-[var(--panel-radius)]">
            <CardHeader>
              <CardTitle>Character Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-800">
                  {profile?.avatar ?
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> :

                  <div className="w-full h-full grid place-items-center text-slate-500">No avatar</div>
                  }
                </div>
                {profile?.theme_song_url &&
                <a href={profile.theme_song_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#4c6f91] hover:text-[#47698d]">
                    <Music className="w-4 h-4" />
                    Theme Song
                  </a>
                }
                {profile?.birthday &&
                <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    {new Date(profile.birthday).toLocaleDateString()}
                  </div>
                }
                {profile?.color_palette?.length > 0 &&
                <div className="flex flex-wrap gap-2">
                    {profile.color_palette.map((hex, i) =>
                  <span
                    key={i}
                    className="w-6 h-6 rounded-md border"
                    title={hex}
                    style={{ backgroundColor: hex, borderColor: "rgba(255,255,255,0.2)" }} />

                  )}
                  </div>
                }
              </div>

              <div className="space-y-4 md:col-span-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">Details</h3>
                  <p className="text-slate-300">{profile?.notes || "Add notes and details (skills overview, quick bio, etc.)"}</p>
                </div>

                {profile?.lore &&
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Lore</h3>
                    <div className="prose prose-invert text-slate-300 max-w-none" dangerouslySetInnerHTML={{ __html: profile.lore }} />
                  </div>
                }

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      Likes
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(profile?.likes || []).map((l, i) => <Pill key={i} color={PALETTE[i % PALETTE.length]}>{l}</Pill>)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200">Dislikes</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(profile?.dislikes || []).map((d, i) => <Pill key={i} color={PALETTE[(i + 3) % PALETTE.length]}>{d}</Pill>)}
                    </div>
                  </div>
                </div>

                {profile?.skills?.length > 0 &&
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.skills.map((s, i) => <Pill key={i} color={PALETTE[(i + 6) % PALETTE.length]}>{s}</Pill>)}
                    </div>
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="bg-slate-900/70 border-slate-800 !rounded-[var(--panel-radius)]">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[var(--pal-5)]" />
                Gallery
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFolderOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New {currentParentId ? "Subfolder" : "Section/Folder"}
                </Button>
                <Button disabled={!currentParentId} onClick={() => setAssetOpen(true)}>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <button className="hover:text-slate-200 flex items-center gap-1" onClick={() => goUp(0)}>
                  <ArrowLeft className="w-4 h-4" /> Root
                </button>
                {path.map((f, idx) =>
                <React.Fragment key={f.id}>
                    <ChevronRight className="w-4 h-4" />
                    <button className="hover:text-slate-200" onClick={() => goUp(idx + 1)}>{f.name}</button>
                  </React.Fragment>
                )}
              </div>

              {/* Folders */}
              {folders.length > 0 &&
              <div className="mb-6">
                  <h4 className="text-slate-300 mb-2">Folders</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {folders.map((f) =>
                  <button key={f.id} onClick={() => openFolder(f)} className="text-left group">
                        <div className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-800">
                          {f.cover_url ?
                      <img src={f.cover_url} alt={f.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" /> :

                      <div className="w-full h-full grid place-items-center text-slate-500">No cover</div>
                      }
                        </div>
                        <div className="mt-2">
                          <div className="font-medium text-slate-100">{f.name}</div>
                          {f.section && <div className="text-xs text-slate-400">{f.section}</div>}
                          {f.description && <div className="text-xs text-slate-500 line-clamp-2">{f.description}</div>}
                        </div>
                      </button>
                  )}
                  </div>
                </div>
              }

              {/* Assets */}
              {currentParentId &&
              <>
                  <h4 className="text-slate-300 mb-2">Assets</h4>
                  {assets.length === 0 ?
                <div className="text-slate-500 py-8 text-center">No assets here yet.</div> :

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {assets.map((a) =>
                  <div key={a.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60">
                          <a href={a.url} target="_blank" rel="noreferrer">
                            <img
                        src={a.thumb_url || a.url}
                        alt={a.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => {e.currentTarget.src = a.url;}} />

                          </a>
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-slate-100 text-sm">{a.title}</div>
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </div>
                            {a.notes && <div className="text-xs text-slate-400 mt-1">{a.notes}</div>}
                          </div>
                        </div>
                  )}
                    </div>
                }
                </>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-2xl form-container popup-surface">
          <DialogHeader>
            <DialogTitle>{profile ? "Edit" : "Create"} Veri Profile</DialogTitle>
            <DialogDescription>Details, Theme Song, Likes, Dislikes, Lore, Skills, Birthday, etc.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Avatar URL</label>
              <Input value={profileForm.avatar} onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Theme Song URL</label>
              <Input value={profileForm.theme_song_url} onChange={(e) => setProfileForm({ ...profileForm, theme_song_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Birthday</label>
              <Input type="date" value={profileForm.birthday} onChange={(e) => setProfileForm({ ...profileForm, birthday: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Likes (comma separated)</label>
              <Input value={(profileForm.likes || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, likes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Dislikes (comma separated)</label>
              <Input value={(profileForm.dislikes || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, dislikes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Skills (comma separated)</label>
              <Input value={(profileForm.skills || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Lore (HTML allowed)</label>
              <Textarea value={profileForm.lore} onChange={(e) => setProfileForm({ ...profileForm, lore: e.target.value })} className="min-h-[150px]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-50 mb-1 text-sm lowercase block"> ˑ.˚⊹ Notes ⊹˚.ˑ</label>
              <Textarea value={profileForm.notes} onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent className="sm:max-w-md form-container popup-surface">
          <DialogHeader>
            <DialogTitle>New {currentParentId ? "Subfolder" : "Section/Folder"}</DialogTitle>
            <DialogDescription>Create folders for Tattoos, Seals, Alt Hairstyles, Alt Outfits, Misc, etc.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Section</label>
              <Select value={folderForm.section} onValueChange={(v) => setFolderForm({ ...folderForm, section: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="menu-surface">
                  {SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Cover URL</label>
              <Input value={folderForm.cover_url} onChange={(e) => setFolderForm({ ...folderForm, cover_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Description / Notes</label>
              <Textarea value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
        <DialogContent className="sm:max-w-md form-container popup-surface">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
            <DialogDescription>Upload via URL and add notes (e.g., tattoo meanings, hairstyle variations).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <Input value={assetForm.title} onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">URL</label>
              <Input value={assetForm.url} onChange={(e) => setAssetForm({ ...assetForm, url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Thumbnail URL (optional)</label>
              <Input value={assetForm.thumb_url} onChange={(e) => setAssetForm({ ...assetForm, thumb_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Notes</label>
              <Textarea value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Tags (comma separated)</label>
              <Input value={(assetForm.tags || []).join(", ")} onChange={(e) => setAssetForm({ ...assetForm, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAssetOpen(false)}>Cancel</Button>
            <Button onClick={createAsset} disabled={!currentParentId}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}