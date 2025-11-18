
import { useState, useEffect, useCallback } from "react";
import { Commission } from "@/entities/Commission";
import { User } from "@/entities/User"; // Added import
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommissionCard from "../components/commissions/CommissionCard";
import CommissionDetailModal from "../components/commissions/CommissionDetailModal";
import CommissionFormModal from "../components/commissions/CommissionFormModal";
import CommissionBoardView from "../components/commissions/CommissionBoardView";
import { Plus, Search, Grid, Kanban, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [filteredCommissions, setFilteredCommissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    platform: "all",
    type: "all",
    artist: "all",
    hideCompleted: false
  });
  const [submitError, setSubmitError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false); // Added state

  const loadCommissions = async () => {
    setIsLoading(true);
    const data = await Commission.list("-created_date");
    setCommissions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  useEffect(() => {// Added effect for auth check
    (async () => {
      try {
        await User.me();
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      }
    })();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = commissions;

    if (searchQuery) {
      filtered = filtered.filter((commission) =>
      commission.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((commission) => commission.status === filters.status);
    }

    if (filters.platform !== "all") {
      filtered = filtered.filter((commission) => commission.platform === filters.platform);
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((commission) => commission.type === filters.type);
    }

    if (filters.hideCompleted) {
      filtered = filtered.filter((commission) => commission.status !== "completed");
    }

    setFilteredCommissions(filtered);
  }, [commissions, searchQuery, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Added requireAuth function
  const requireAuth = async () => {
    try {
      await User.me();
      return true;
    } catch {
      const callback = window.location.href;
      await User.loginWithRedirect(callback);
      return false;
    }
  };

  // Sanitize payload before sending to API (remove nulls/empties that break schema)
  const sanitizeCommissionPayload = (data) => {
    const cleaned = { ...data };

    // Clean artist_handles: drop null/undefined; keep only strings
    if (cleaned.artist_handles && typeof cleaned.artist_handles === 'object') {
      const keep = {};
      ['discord', 'vgen', 'twitter', 'deviantart', 'email'].forEach((k) => {
        const v = cleaned.artist_handles[k];
        if (typeof v === 'string') keep[k] = v;
      });
      if (Object.keys(keep).length) cleaned.artist_handles = keep;else
      delete cleaned.artist_handles;
    }

    // Clean links arrays
    if (Array.isArray(cleaned.reference_links)) {
      cleaned.reference_links = cleaned.reference_links.filter((x) => typeof x === 'string' && x.trim().length > 0);
    }
    if (Array.isArray(cleaned.commission_links)) {
      cleaned.commission_links = cleaned.commission_links.filter((x) => typeof x === 'string' && x.trim().length > 0);
    }

    // Ensure numbers are numbers
    if (cleaned.payment !== undefined) cleaned.payment = Number(cleaned.payment) || 0;
    if (cleaned.budget !== undefined) cleaned.budget = Number(cleaned.budget) || 0;

    return cleaned;
  };

  const handleSubmit = async (taskData) => {
    setSubmitError(""); // Reset error message on new submission attempt
    const ok = await requireAuth(); // Added auth check
    if (!ok) return; // Stop if not authenticated

    const payload = sanitizeCommissionPayload(taskData);
    try {
      if (editingCommission) {
        await Commission.update(editingCommission.id, payload);
      } else {
        await Commission.create(payload);
      }
      setIsFormOpen(false);
      setEditingCommission(null);
      loadCommissions();
    } catch (error) {
      console.error("Failed to submit commission:", error);
      // Redirect on permission error as a fallback
      if (String(error?.message || "").toLowerCase().includes("permission") || String(error).includes("403")) {
        await User.loginWithRedirect(window.location.href);
        return;
      }
      setSubmitError(error?.message || "You may not have permission to modify commissions.");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    const ok = await requireAuth(); // Added auth check
    if (!ok) return; // Stop if not authenticated

    const payload = sanitizeCommissionPayload({ ...task, status: newStatus });
    await Commission.update(task.id, payload);
    loadCommissions();
  };

  const handleEditClick = (commission) => {
    setEditingCommission(commission);
    setSelectedCommission(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) =>
          <Card key={i} className="animate-pulse !rounded-[var(--panel-radius)] bg-slate-900/50 border border-slate-700/50 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="aspect-square bg-slate-700 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>);

  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Commission Tracker</h2>
          <p className="text-slate-400 mt-1">Manage your art commissions professionally</p>
        </div>
        <Button
          onClick={async () => {// Modified onClick
            if (!isAuthed) {
              await User.loginWithRedirect(window.location.href);
              return;
            }
            setEditingCommission(null);
            setIsFormOpen(true);
          }}
          className="!rounded-[var(--button-radius)]">

          <Plus className="w-4 h-4 mr-2" />
          New Commission
        </Button>
      </div>

      {submitError &&
      <Alert variant="destructive" className="bg-rose-900/30 border-rose-700/40">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Couldn’t save changes</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      }

      {/* Added auth warning alert */}
      {!isAuthed &&
      <Alert className="bg-slate-900/50 border-slate-700/50">
          <AlertTitle className="text-slate-100">Sign in to edit</AlertTitle>
          <AlertDescription className="text-slate-300">
            You’re viewing commissions. To add or update, please sign in.
            <Button
            size="sm"
            className="ml-3"
            onClick={() => User.loginWithRedirect(window.location.href)}>

              Sign in
            </Button>
          </AlertDescription>
        </Alert>
      }

      {/* Summary Stats (moved to top) */}
      <Card className="p-4 bg-slate-900/50 border border-slate-700/50 backdrop-blur-md !rounded-[var(--panel-radius)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Total</div>
            <div className="text-2xl font-bold text-slate-100">{filteredCommissions.length}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Completed</div>
            <div className="text-2xl font-bold text-emerald-300">
              {filteredCommissions.filter((c) => c.status === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Active</div>
            <div className="text-2xl font-bold text-amber-300">
              {filteredCommissions.filter((c) => c.status !== 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Total Payment</div>
            <div className="text-2xl font-bold text-slate-100">
              ${filteredCommissions.reduce((sum, c) => sum + (c.payment || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 bg-slate-900/50 border border-slate-700/50 backdrop-blur-md !rounded-[var(--panel-radius)]">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search artists, types, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800 text-slate-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />


          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="sketch">Sketch</SelectItem>
                <SelectItem value="wip">WIP</SelectItem>
                <SelectItem value="revisions">Revisions</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.platform} onValueChange={(value) => setFilters({ ...filters, platform: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Skeb">Skeb</SelectItem>
                <SelectItem value="VGen">VGen</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="Discord">Discord</SelectItem>
                <SelectItem value="Fiverr">Fiverr</SelectItem>
                <SelectItem value="Direct">Direct</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="L2D">L2D</SelectItem>
                <SelectItem value="CG">CG</SelectItem>
                <SelectItem value="PfP">PfP</SelectItem>
                <SelectItem value="Full">Full Body</SelectItem>
                <SelectItem value="Emote">Emote</SelectItem>
                <SelectItem value="Logo">Logo</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.hideCompleted ? "default" : "outline"}
              onClick={() => setFilters({ ...filters, hideCompleted: !filters.hideCompleted })}
              size="sm">

              Hide Completed
            </Button>
          </div>
        </div>
      </Card>

      {/* View Toggle (stats removed from here) */}
      <div className="flex justify-end items-center">
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Kanban className="w-4 h-4" />
              Board
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCommissions.map((commission) =>
              <CommissionCard
                key={commission.id}
                commission={commission}
                onClick={() => setSelectedCommission(commission)} />

              )}
            </div>
          </TabsContent>
          
          <TabsContent value="board" className="mt-6">
            <CommissionBoardView
              commissions={filteredCommissions}
              onCommissionClick={setSelectedCommission}
              onUpdate={loadCommissions}
              onStatusChange={handleStatusChange} />

          </TabsContent>
        </Tabs>
      </div>

      {/* Empty State */}
      {filteredCommissions.length === 0 && !isLoading &&
      <Card className="p-12 text-center bg-slate-900/50 border border-slate-700/50 backdrop-blur-md !rounded-[var(--panel-radius)]">
          <div className="text-slate-600 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">No commissions found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || Object.values(filters).some((f) => f !== "all" && f !== false) ?
          "Try adjusting your filters" :
          "Get started by tracking your first commission"}
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="!rounded-[var(--button-radius)]">
            <Plus className="w-4 h-4 mr-2" />
            New Commission
          </Button>
        </Card>
      }

      {/* Modals */}
      {isFormOpen &&
      <CommissionFormModal
        commission={editingCommission}
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false);setEditingCommission(null);setSubmitError("");}}
        onSubmit={handleSubmit} />

      }

      {selectedCommission &&
      <CommissionDetailModal
        commission={selectedCommission}
        isOpen={!!selectedCommission}
        onClose={() => setSelectedCommission(null)}
        onEdit={handleEditClick}
        onUpdate={loadCommissions} />

      }
    </div>);

}