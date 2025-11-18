
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Commission } from '@/entities/Commission';
import { User } from '@/entities/User';
import {
  Edit,
  ExternalLink,
  User as UserIcon,
  Image,
  Link as LinkIcon,
  FileText } from
'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CommissionDetailModal({ commission, isOpen, onClose, onEdit, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const sanitizeCommissionPayload = (data) => {
    const cleaned = { ...data };
    if (cleaned.artist_handles && typeof cleaned.artist_handles === 'object') {
      const keep = {};
      ['discord', 'vgen', 'twitter', 'deviantart', 'email'].forEach((k) => {
        const v = cleaned.artist_handles[k];
        if (typeof v === 'string') keep[k] = v;
      });
      if (Object.keys(keep).length) cleaned.artist_handles = keep;else
      delete cleaned.artist_handles;
    }
    if (Array.isArray(cleaned.reference_links)) {
      cleaned.reference_links = cleaned.reference_links.filter((x) => typeof x === 'string' && x.trim().length > 0);
    }
    if (Array.isArray(cleaned.commission_links)) {
      cleaned.commission_links = cleaned.commission_links.filter((x) => typeof x === 'string' && x.trim().length > 0);
    }
    return cleaned;
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const payload = sanitizeCommissionPayload({ ...commission, status: newStatus });
      await Commission.update(commission.id, payload);
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      if (String(error?.message || "").toLowerCase().includes("permission") || String(error).includes("403")) {
        await User.loginWithRedirect(window.location.href);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD';
  };

  if (!commission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto popup-surface">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold text-slate-100">
              {commission.type} by {commission.artist}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onEdit(commission)} className="bg-blue-900 text-sky-50 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-6">
            <div className="aspect-square bg-slate-800/50 rounded-xl overflow-hidden">
              {commission.thumbnail ?
              <img
                src={commission.thumbnail}
                alt={`${commission.type} by ${commission.artist}`}
                className="w-full h-full object-cover" /> :


              <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Image className="w-24 h-24" />
                </div>
              }
            </div>

            {/* Files Section */}
            {commission.files && commission.files.length > 0 &&
            <div>
                <h4 className="font-semibold text-slate-200 mb-3">Attached Files</h4>
                <div className="grid grid-cols-2 gap-4">
                  {commission.files.map((file) =>
                <a href={file.url} target="_blank" rel="noopener noreferrer" key={file.id || file.url}>
                      <Card className="hover:bg-slate-800/60 transition-colors bg-slate-800/30">
                        <CardContent className="p-3">
                          {file.thumbnail ?
                      <img src={file.thumbnail} alt={file.name} className="w-full h-24 object-cover rounded-md mb-2" /> :

                      <div className="w-full h-24 bg-slate-700/50 rounded-md mb-2 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                      }
                          <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">{file.type}</Badge>
                        </CardContent>
                      </Card>
                    </a>
                )}
                </div>
              </div>
            }
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Status and Quick Actions */}
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-800 text-slate-300 px-3 py-1">
                {commission.status.toUpperCase()}
              </Badge>
              <Badge variant="outline">{commission.platform}</Badge>
            </div>

            {/* Artist Info */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Artist Information
              </h4>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {commission.artist}</div>
                {commission.artist_handles && Object.entries(commission.artist_handles).map(([platform, handle]) =>
                handle &&
                <div key={platform}>
                      <strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> {handle}
                    </div>

                )}
              </div>
            </div>

            {/* Commission Details */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-200 mb-2">Commission Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Type</div>
                  <div className="font-medium">{commission.type}</div>
                </div>
                <div>
                  <div className="text-slate-400">Category</div>
                  <div className="font-medium">{commission.category?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-slate-400">Payment</div>
                  <div className="font-medium text-emerald-400">{formatCurrency(commission.payment)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Budget</div>
                  <div className="font-medium">{formatCurrency(commission.budget)}</div>
                </div>
                {commission.deadline &&
                <div className="col-span-2">
                    <div className="text-slate-400">Deadline</div>
                    <div className="font-medium">{new Date(commission.deadline).toLocaleDateString()}</div>
                  </div>
                }
                <div className="col-span-2">
                  <div className="text-slate-400">Usage Rights</div>
                  <div className="font-medium">{commission.usage_rights?.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {commission.description &&
            <div className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="font-semibold text-slate-200 mb-2">Description</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{commission.description}</p>
              </div>
            }

            {/* Links */}
            {(commission.reference_links?.length > 0 || commission.commission_links?.length > 0) &&
            <div className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Links
                </h4>
                <div className="space-y-2">
                  {commission.reference_links?.map((link, index) =>
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">

                      <ExternalLink className="w-3 h-3" />
                      Reference {index + 1}
                    </a>
                )}
                  {commission.commission_links?.map((link, index) =>
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">

                      <ExternalLink className="w-3 h-3" />
                      Commission Link {index + 1}
                    </a>
                )}
                </div>
              </div>
            }

            {/* Notes */}
            {commission.notes &&
            <div className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="font-semibold text-slate-200 mb-2">Notes</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{commission.notes}</p>
              </div>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}