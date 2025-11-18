
import { useEffect, useMemo, useState, useCallback } from "react";
import { Task } from "@/entities/Task";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ListTodo, Search, ChevronUp, ChevronDown, Pencil, Calendar as CalendarIcon, User as UserIcon, Link as LinkIcon, X, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import StarsBurst from "../components/tasks/StarsBurst";
import TaskCardView from "../components/tasks/TaskCardView";
import TaskPriorityMatrix from "../components/tasks/TaskPriorityMatrix";
import TaskKanbanView from "../components/tasks/TaskKanbanView";
import TaskCalendarView from "../components/tasks/TaskCalendarView";

const statusLabels = { in_queue: "In Queue", working_on: "Working On", done: "Done" };
const priorityLabels = { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" };

function sortByField(items, field, dir) {
  const sorted = [...items].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (field === "dueDate" || field === "created_date") return new Date(va) - new Date(vb);
    if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb);
    return va > vb ? 1 : va < vb ? -1 : 0;
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

export default function Tasklist() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Sort
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form
  const emptyForm = { title: "", category: "", type: "", dueDate: "", priority: "normal", status: "in_queue", visibility: "public", description: "", links: [] };
  const [form, setForm] = useState(emptyForm);
  const [newLink, setNewLink] = useState({ url: "", title: "", thumbnail: "" });

  // UI: views and tabs
  const [scopeTab, setScopeTab] = useState("active"); // active | completed
  const [view, setView] = useState("cards"); // table | cards | matrix | kanban | calendar

  // Celebration
  const [burst, setBurst] = useState(null);

  // Palette (skip invalid '#b46ff')
  const PALETTE = [
  "#c7a89c", "#753243", "#612529", "#3c5693", "#4c6f91", "#476e8c",
  "#553052", "#3a4b5b", "#755665", "#6b2035", "#c0abb2", "#47698d"];


  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [taskData, userData] = await Promise.all([Task.list("-created_date"), User.list()]);
    setTasks(taskData);
    setUsers(userData);
    setIsLoading(false);
  }, []);

  useEffect(() => {loadData();}, [loadData]);

  const userNameByEmail = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.email] = u.displayName || u.full_name || u.username || u.email;
    });
    return map;
  }, [users]);

  const categories = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => t.category && set.add(t.category));
    return ["all", ...Array.from(set)];
  }, [tasks]);

  const filteredBase = useMemo(() => {
    let items = tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.category || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") items = items.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") items = items.filter((t) => t.priority === priorityFilter);
    if (categoryFilter !== "all") items = items.filter((t) => (t.category || "") === categoryFilter);
    return items;
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const activeTasks = useMemo(() => sortByField(filteredBase.filter((t) => t.status !== "done"), sortBy, sortDir), [filteredBase, sortBy, sortDir]);
  const completedTasks = useMemo(() => sortByField(filteredBase.filter((t) => t.status === "done"), sortBy, sortDir), [filteredBase, sortBy, sortDir]);

  function isValidUrl(str) {
    try { const u = new URL(str); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
  }

  function addLinkToForm() {
    const url = (newLink.url || "").trim();
    if (!isValidUrl(url)) return; // silently ignore invalid
    const title = (newLink.title || "").trim() || (() => {
      try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
    })();
    const thumbnail = (newLink.thumbnail || "").trim() || "";
    setForm((f) => ({ ...f, links: [...(f.links || []), { url, title, thumbnail }] }));
    setNewLink({ url: "", title: "", thumbnail: "" });
  }

  function removeLinkAt(idx) {
    setForm((f) => ({ ...f, links: (f.links || []).filter((_, i) => i !== idx) }));
  }

  function toggleSort(field) {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");else
    {setSortBy(field);setSortDir("asc");}
  }

  function openAdd() {
    setForm(emptyForm);
    setIsAddOpen(true);
  }
  function openEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      category: task.category || "",
      type: task.type || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      priority: task.priority || "normal",
      status: task.status || "in_queue",
      visibility: task.visibility || "public",
      description: task.description || "",
      links: Array.isArray(task.links) ? task.links : []
    });
    setIsEditOpen(true);
  }

  async function submitAdd() {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category || undefined,
      type: form.type || undefined,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      priority: form.priority,
      status: form.status,
      visibility: form.visibility,
      links: Array.isArray(form.links) ? form.links : undefined
    };
    await Task.create(payload);
    setIsAddOpen(false);
    loadData();
  }

  async function submitEdit() {
    if (!editingTask) return;
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category || undefined,
      type: form.type || undefined,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      priority: form.priority,
      status: form.status,
      visibility: form.visibility,
      links: Array.isArray(form.links) ? form.links : []
    };
    await Task.update(editingTask.id, payload);
    setIsEditOpen(false);
    setEditingTask(null);
    loadData();
  }

  // Replace colored Tailwind classes with the fixed palette
  function StatusBadge({ status }) {
    const colorMap = {
      in_queue: PALETTE[0],
      working_on: PALETTE[3],
      done: PALETTE[10]
    };
    const bg = colorMap[status] || PALETTE[0];
    return (
      <Badge
        variant="outline"
        className="rounded-full border"
        style={{ backgroundColor: bg, color: "#fff", borderColor: bg }}>

        {statusLabels[status] || status}
      </Badge>);

  }

  function PriorityBadge({ priority }) {
    const colorMap = {
      urgent: PALETTE[2],
      high: PALETTE[1],
      normal: PALETTE[4],
      low: PALETTE[10]
    };
    const bg = colorMap[priority] || PALETTE[4];
    return (
      <Badge
        variant="outline"
        className="rounded-full border"
        style={{ backgroundColor: bg, color: "#fff", borderColor: bg }}>

        {priorityLabels[priority] || priority}
      </Badge>);

  }

  async function toggleDone(task, event) {
    const isDone = task.status === "done";
    const newStatus = isDone ? "in_queue" : "done";
    await Task.update(task.id, { ...task, status: newStatus });
    if (!isDone) {
      // burst at click position
      const { clientX, clientY } = event && event.nativeEvent || { clientX: window.innerWidth / 2, clientY: 100 };
      setBurst({ x: clientX, y: clientY, t: Date.now() });
      setTimeout(() => setBurst(null), 1400);
    }
    loadData();
  }

  async function handleKanbanDragEnd(result) {
    const { destination, source, draggableId } = result || {};
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    if (task.status === destination.droppableId) return;
    await Task.update(draggableId, { ...task, status: destination.droppableId });
    loadData();
  }

  const listForScope = scopeTab === "active" ? activeTasks : completedTasks;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {burst && <StarsBurst x={burst.x} y={burst.y} onDone={() => setBurst(null)} />}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-slate-100">Tasklist</h1>
        </div>
        <Button onClick={openAdd} className="bg-blue-800 text-[#ffffff] px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 !rounded-[var(--button-radius)]">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <Card className="bg-slate-900/50 border border-slate-800/60 backdrop-blur-md !rounded-[var(--panel-radius)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search title, description, category, type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="menu-surface">
                {categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="menu-surface">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_queue">In Queue</SelectItem>
                <SelectItem value="working_on">Working On</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent className="menu-surface">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scope + view controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <Tabs defaultValue="active" value={scopeTab} onValueChange={setScopeTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="cards" value={view} onValueChange={setView} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="matrix">Priority Matrix</TabsTrigger>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Views */}
          {view === "table" &&
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Done</TableHead>
                    <TableHead className="w-10">Edit</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                      Title {sortBy === "title" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("description")}>
                      Details {sortBy === "description" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("category")}>
                      Category {sortBy === "category" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("type")}>
                      Type {sortBy === "type" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("dueDate")}>
                      Due Date {sortBy === "dueDate" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("created_by")}>
                      Added By {sortBy === "created_by" ? sortDir === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" /> : null}
                    </TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listForScope.map((task) => {
                  const isDone = task.status === "done";
                  return (
                    <TableRow key={task.id} className={`hover:bg-slate-800/40 ${isDone ? "opacity-70" : ""}`}>
                        <TableCell className="align-top">
                          <Checkbox checked={isDone} onCheckedChange={(v, e) => toggleDone(task, e)} />
                        </TableCell>
                        <TableCell className="align-top">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(task)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <div className={`font-medium ${isDone ? "line-through text-slate-400" : "text-slate-100"}`}>{task.title}</div>
                        </TableCell>
                        <TableCell className="max-w-[360px]">
                          <div className={`text-sm ${isDone ? "line-through text-slate-500" : "text-slate-300"}`}>
                            {task.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{task.category || "-"}</TableCell>
                        <TableCell>{task.type || "-"}</TableCell>
                        <TableCell>
                          {task.dueDate ?
                        <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-slate-400" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div> :
                        "-"}
                        </TableCell>
                        <TableCell><StatusBadge status={task.status} /></TableCell>
                        <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-300">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">
                              {task.created_by ? userNameByEmail[task.created_by] || task.created_by : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{task.created_date ? format(new Date(task.created_date), "MMM d, yyyy") : "-"}</TableCell>
                      </TableRow>);

                })}
                  {listForScope.length === 0 && !isLoading &&
                <TableRow>
                      <TableCell colSpan={11} className="text-center text-slate-400 py-8">No tasks match your filters.</TableCell>
                    </TableRow>
                }
                </TableBody>
              </Table>
            </div>
          }

          {view === "cards" &&
          <TaskCardView
            tasks={listForScope}
            onEdit={openEdit}
            onToggleDone={(t) => toggleDone(t)} />

          }

          {view === "matrix" &&
          <TaskPriorityMatrix tasks={listForScope} onItemClick={openEdit} />
          }

          {view === "kanban" &&
          <TaskKanbanView tasks={scopeTab === "active" ? tasks.filter((t) => t.status !== "done") : tasks.filter((t) => t.status === "done")} onDragEnd={handleKanbanDragEnd} onItemClick={openEdit} />
          }

          {view === "calendar" &&
          <TaskCalendarView tasks={listForScope} onItemClick={openEdit} />
          }
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg form-container">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a new task entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Category (e.g., Ops, Content, Community)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Type (e.g., Bug, Feature, Chore)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="in_queue">In Queue</SelectItem>
                  <SelectItem value="working_on">Working On</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            {/* Links Section */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-200">
                <LinkIcon className="w-4 h-4" />
                <span className="font-medium">Links</span>
              </div>
              {(form.links || []).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {(form.links || []).map((lnk, idx) => (
                    <div key={idx} className="relative">
                      <a href={lnk.url} target="_blank" rel="noreferrer" className="block">
                        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 h-20">
                          {/* Simple preview: thumbnail or domain */}
                          {lnk.thumbnail ? (
                            <img src={lnk.thumbnail} alt={lnk.title || lnk.url} className="w-full h-full object-cover opacity-80" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-slate-300 truncate px-2">{lnk.title || lnk.url}</span>
                            </div>
                          )}
                        </div>
                      </a>
                      <button
                        type="button"
                        onClick={() => removeLinkAt(idx)}
                        className="absolute -top-2 -right-2 bg-slate-900/90 border border-white/10 rounded-full p-1 hover:bg-slate-800"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="https://example.com" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
                <Input placeholder="Title (optional)" value={newLink.title} onChange={(e) => setNewLink({ ...newLink, title: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Thumb URL (optional)" value={newLink.thumbnail} onChange={(e) => setNewLink({ ...newLink, thumbnail: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={addLinkToForm} className="!rounded-[var(--button-radius)]">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={submitAdd}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg form-container">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="in_queue">In Queue</SelectItem>
                  <SelectItem value="working_on">Working On</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                <SelectContent className="menu-surface">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            {/* Links Section (same as Add) */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-200">
                <LinkIcon className="w-4 h-4" />
                <span className="font-medium">Links</span>
              </div>
              {(form.links || []).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {(form.links || []).map((lnk, idx) => (
                    <div key={idx} className="relative">
                      <a href={lnk.url} target="_blank" rel="noreferrer" className="block">
                        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 h-20">
                          {lnk.thumbnail ? (
                            <img src={lnk.thumbnail} alt={lnk.title || lnk.url} className="w-full h-full object-cover opacity-80" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-slate-300 truncate px-2">{lnk.title || lnk.url}</span>
                            </div>
                          )}
                        </div>
                      </a>
                      <button
                        type="button"
                        onClick={() => removeLinkAt(idx)}
                        className="absolute -top-2 -right-2 bg-slate-900/90 border border-white/10 rounded-full p-1 hover:bg-slate-800"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="https://example.com" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
                <Input placeholder="Title (optional)" value={newLink.title} onChange={(e) => setNewLink({ ...newLink, title: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Thumb URL (optional)" value={newLink.thumbnail} onChange={(e) => setNewLink({ ...newLink, thumbnail: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={addLinkToForm} className="!rounded-[var(--button-radius)]">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}
