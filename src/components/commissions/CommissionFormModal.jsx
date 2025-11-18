
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Loader2, FileIcon, Image as ImageIcon } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function CommissionFormModal({ commission, isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    artist: commission?.artist || '',
    artist_handles: commission?.artist_handles || {
      discord: '',
      vgen: '',
      twitter: '',
      deviantart: '',
      email: ''
    },
    platform: commission?.platform || '',
    type: commission?.type || '',
    status: commission?.status || 'requested',
    payment: commission?.payment || 0,
    budget: commission?.budget || 0,
    deadline: commission?.deadline || '',
    usage_rights: commission?.usage_rights || 'streaming',
    category: commission?.category || 'Other',
    description: commission?.description || '',
    notes: commission?.notes || '',
    reference_links: commission?.reference_links || [],
    commission_links: commission?.commission_links || [],
    thumbnail: commission?.thumbnail || '',
    files: commission?.files || []
  });

  // Sync form when editing a different commission or creating a new one
  useEffect(() => {
    if (!commission) {
      // Reset form for a new commission
      setFormData({
        artist: '',
        artist_handles: {
          discord: '',
          vgen: '',
          twitter: '',
          deviantart: '',
          email: ''
        },
        platform: '',
        type: '',
        status: 'requested', // Default status for new commissions
        payment: 0,
        budget: 0,
        deadline: '',
        usage_rights: 'streaming',
        category: 'Other',
        description: '',
        notes: '',
        reference_links: [],
        commission_links: [],
        thumbnail: '',
        files: []
      });
      return;
    }
    // Populate form with existing commission data
    setFormData({
      artist: commission.artist || '',
      artist_handles: commission.artist_handles || { discord: '', vgen: '', twitter: '', deviantart: '', email: '' },
      platform: commission.platform || '',
      type: commission.type || '',
      status: commission.status || 'requested',
      payment: commission.payment || 0,
      budget: commission.budget || 0,
      deadline: commission.deadline || '',
      usage_rights: commission.usage_rights || 'streaming',
      category: commission.category || 'Other',
      description: commission.description || '',
      notes: commission.notes || '',
      reference_links: commission.reference_links || [],
      commission_links: commission.commission_links || [],
      thumbnail: commission.thumbnail || '',
      files: commission.files || []
    });
  }, [commission]); // Depend on 'commission' prop

  const [newReferenceLink, setNewReferenceLink] = useState('');
  const [newCommissionLink, setNewCommissionLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleHandleChange = (platform, value) => {
    setFormData({
      ...formData,
      artist_handles: {
        ...formData.artist_handles,
        [platform]: value
      }
    });
  };

  const addReferenceLink = () => {
    if (newReferenceLink.trim()) {
      handleInputChange('reference_links', [...formData.reference_links, newReferenceLink.trim()]);
      setNewReferenceLink('');
    }
  };

  const addCommissionLink = () => {
    if (newCommissionLink.trim()) {
      handleInputChange('commission_links', [...formData.commission_links, newCommissionLink.trim()]);
      setNewCommissionLink('');
    }
  };

  const removeReferenceLink = (index) => {
    const updated = formData.reference_links.filter((_, i) => i !== index);
    handleInputChange('reference_links', updated);
  };

  const removeCommissionLink = (index) => {
    const updated = formData.commission_links.filter((_, i) => i !== index);
    handleInputChange('commission_links', updated);
  };

  const handleFileDrop = async (acceptedFiles) => {
    setIsUploading(true);
    const currentFiles = formData.files || [];
    let uploadedFiles = [...currentFiles];

    for (const file of acceptedFiles) {
      try {
        const { file_url } = await UploadFile({ file });
        uploadedFiles.push({
          id: file_url, // Using file_url as a unique ID for simplicity, assuming it's unique
          name: file.name,
          url: file_url,
          type: 'reference', // Default type
          thumbnail: file.type.startsWith('image/') ? file_url : null // Set thumbnail for images
        });
      } catch (error) {
        console.error("File upload failed:", error);
      }
    }

    handleInputChange('files', uploadedFiles);
    setIsUploading(false);
  };

  const handleDragEnter = (e) => {e.preventDefault();e.stopPropagation();setIsDragging(true);};
  const handleDragLeave = (e) => {e.preventDefault();e.stopPropagation();setIsDragging(false);};
  const handleDragOver = (e) => {e.preventDefault();e.stopPropagation();};
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const removeFile = (fileUrl) => {
    const updated = formData.files.filter((f) => f.url !== fileUrl);
    handleInputChange('files', updated);
  };

  const updateFileType = (fileUrl, newType) => {
    const updated = formData.files.map((f) => {
      if (f.url === fileUrl) {
        return { ...f, type: newType };
      }
      return f;
    });
    handleInputChange('files', updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto form-container popup-surface">
        <DialogHeader>
          <DialogTitle>{commission ? 'Edit Commission' : 'New Commission'}</DialogTitle>
          <DialogDescription>
            {commission ? 'Update commission details' : 'Track a new art commission'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-pink-900 text-slate-50 p-1 h-10 items-center justify-center rounded-md grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Artist Name</label>
                  <Input
                    value={formData.artist}
                    onChange={(e) => handleInputChange('artist', e.target.value)}
                    placeholder="Artist name"
                    required />

                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Skeb">Skeb</SelectItem>
                      <SelectItem value="VGen">VGen</SelectItem>
                      <SelectItem value="Twitter">Twitter</SelectItem>
                      <SelectItem value="Discord">Discord</SelectItem>
                      <SelectItem value="DeviantArt">DeviantArt</SelectItem>
                      <SelectItem value="Fiverr">Fiverr</SelectItem>
                      <SelectItem value="Etsy">Etsy</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Commission Type</label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L2D">L2D</SelectItem>
                      <SelectItem value="CG">CG</SelectItem>
                      <SelectItem value="PfP">PfP</SelectItem>
                      <SelectItem value="Bust">Bust</SelectItem>
                      <SelectItem value="Waist">Waist Up</SelectItem>
                      <SelectItem value="Thigh-Up">Thigh Up</SelectItem>
                      <SelectItem value="Full">Full Body</SelectItem>
                      <SelectItem value="GFX">GFX</SelectItem>
                      <SelectItem value="Brand">Branding</SelectItem>
                      <SelectItem value="Outfit">Outfit</SelectItem>
                      <SelectItem value="Banner">Banner</SelectItem>
                      <SelectItem value="Emote">Emote</SelectItem>
                      <SelectItem value="Overlay">Overlay</SelectItem>
                      <SelectItem value="Logo">Logo</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="sketch">Sketch</SelectItem>
                      <SelectItem value="wip">WIP</SelectItem>
                      <SelectItem value="revisions">Revisions</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you want commissioned..."
                  rows={3} />

              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment ($)</label>
                  <Input
                    type="number"
                    value={formData.payment}
                    onChange={(e) => handleInputChange('payment', parseFloat(e.target.value) || 0)}
                    placeholder="0" />

                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Budget ($)</label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    placeholder="0" />

                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Usage Rights</label>
                  <Select value={formData.usage_rights} onValueChange={(value) => handleInputChange('usage_rights', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage rights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_commercial">Full Commercial</SelectItem>
                      <SelectItem value="streaming">Streaming Only</SelectItem>
                      <SelectItem value="personal">Personal Use</SelectItem>
                      <SelectItem value="limited_commercial">Limited Commercial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veri_1_5">Veri 1.5</SelectItem>
                      <SelectItem value="Veri_2_0">Veri 2.0</SelectItem>
                      <SelectItem value="GFX">GFX</SelectItem>
                      <SelectItem value="Branding">Branding</SelectItem>
                      <SelectItem value="Merch">Merch</SelectItem>
                      <SelectItem value="Mascot">Mascot</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)} />

              </div>

              <div>
                <label className="text-slate-50 mb-2 text-sm font-medium block">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Internal notes..."
                  rows={3} />

              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Artist Handles</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={formData.artist_handles.discord}
                    onChange={(e) => handleHandleChange('discord', e.target.value)}
                    placeholder="Discord handle" />

                  <Input
                    value={formData.artist_handles.twitter}
                    onChange={(e) => handleHandleChange('twitter', e.target.value)}
                    placeholder="Twitter handle" />

                  <Input
                    value={formData.artist_handles.vgen}
                    onChange={(e) => handleHandleChange('vgen', e.target.value)}
                    placeholder="VGen profile" />

                  <Input
                    value={formData.artist_handles.email}
                    onChange={(e) => handleHandleChange('email', e.target.value)}
                    placeholder="Email" />

                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reference Links</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newReferenceLink}
                    onChange={(e) => setNewReferenceLink(e.target.value)}
                    placeholder="Add reference link..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReferenceLink())} />

                  <Button type="button" onClick={addReferenceLink}>Add</Button>
                </div>
                <div className="space-y-2">
                  {formData.reference_links.map((link, index) =>
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded">
                      <span className="flex-1 text-sm truncate">{link}</span>
                      <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReferenceLink(index)}>

                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Commission Links</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newCommissionLink}
                    onChange={(e) => setNewCommissionLink(e.target.value)}
                    placeholder="Add commission link..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCommissionLink())} />

                  <Button type="button" onClick={addCommissionLink}>Add</Button>
                </div>
                <div className="space-y-2">
                  {formData.commission_links.map((link, index) =>
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded">
                      <span className="flex-1 text-sm truncate">{link}</span>
                      <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCommissionLink(index)}>

                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                <Input
                  value={formData.thumbnail}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  placeholder="https://..." />

              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileDrop(Array.from(e.target.files))}
                className="hidden"
                multiple />

              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200
                  ${isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600'}`}>

                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Upload className="w-12 h-12 mb-3 text-slate-600" />
                  <p className="text-lg font-semibold">Drop files here or click to upload</p>
                  <p className="text-sm">References, sketches, WIPs, and final pieces</p>
                </div>
                {isUploading &&
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                }
              </div>
              
              {(formData.files || []).length > 0 &&
              <div className="space-y-3 pt-4">
                  <h4 className="font-semibold text-slate-300">Uploaded Files</h4>
                  {formData.files.map((file) =>
                <div key={file.id || file.url} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                      {file.thumbnail ?
                  <ImageIcon className="w-6 h-6 text-slate-400 flex-shrink-0" /> :

                  <FileIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  }
                      <span className="flex-1 text-sm font-medium text-slate-200 truncate">{file.name}</span>
                      <Select value={file.type} onValueChange={(value) => updateFileType(file.url, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reference">Reference</SelectItem>
                          <SelectItem value="sketch">Sketch</SelectItem>
                          <SelectItem value="wip">WIP</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.url)}>

                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                )}
                </div>
              }
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {commission ? 'Update Commission' : 'Create Commission'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}