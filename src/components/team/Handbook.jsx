
import { useState, useEffect, useMemo } from 'react';
import { HandbookSection } from '@/entities/HandbookSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, ChevronDown, ChevronUp, Link as LinkIcon, Terminal, PlusCircle, Edit, Trash2, Loader2, FileDown } from 'lucide-react';
import HandbookImportDialog from "./HandbookImportDialog";

// Replace Section with a collapsible section
const Section = ({ title, children, onAdd, isAdmin, isOpen = true, onToggle }) => (
  <Collapsible open={isOpen} onOpenChange={onToggle}>
    <Card className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 group cursor-pointer">
            <CardTitle className="text-xl font-bold text-slate-100">{title}</CardTitle>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        {isAdmin && onAdd && (
          <Button onClick={onAdd} size="sm" variant="ghost">
            <PlusCircle className="w-4 h-4 mr-2" /> Add
          </Button>
        )}
      </CardHeader>
      <CollapsibleContent>
        <CardContent>{children}</CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
);

const RuleCard = ({ section, isExpanded, onToggle, onEdit, onDelete, isAdmin }) => (
  <Collapsible open={isExpanded} onOpenChange={onToggle}>
    <div className="group flex flex-col">
      <div className="flex items-center">
        <CollapsibleTrigger className="flex-grow">
          <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors text-left">
            <h4 className="font-semibold text-slate-200">{section.title}</h4>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        {isAdmin && (
          <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button onClick={() => onEdit(section)} size="icon" variant="ghost"><Edit className="w-4 h-4" /></Button>
            <Button onClick={() => onDelete(section.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
      <CollapsibleContent>
        <div className="p-4 mt-2 bg-slate-800/30 rounded-b-lg prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />
      </CollapsibleContent>
    </div>
  </Collapsible>
);

export default function Handbook({ currentUser }) {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formSectionType, setFormSectionType] = useState('rule');
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // NEW: top-level section open states
  const [openSections, setOpenSections] = useState({
    philosophy: true,
    rule: true,
    workflow: true,
    command: true,
    tool: true
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'leadmod';

  useEffect(() => {
    loadHandbookData();
  }, []);

  const loadHandbookData = async () => {
    setIsLoading(true);
    const data = await HandbookSection.list('display_order');
    setSections(data);
    setIsLoading(false);
  };

  const toggleItem = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const handleOpenForm = (sectionType, section = null) => {
    setFormSectionType(sectionType);
    setEditingSection(section ? { ...section } : { title: '', content: '', section_type: sectionType, display_order: (sections.filter(s => s.section_type === sectionType).length + 1) * 10, metadata: {} });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!editingSection) return;
    try {
      if (editingSection.id) {
        await HandbookSection.update(editingSection.id, editingSection);
      } else {
        await HandbookSection.create(editingSection);
      }
      setIsFormOpen(false);
      setEditingSection(null);
      await loadHandbookData();
    } catch (error) {
      console.error("Failed to save section:", error);
    }
  };

  const handleDelete = async (sectionId) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      try {
        await HandbookSection.delete(sectionId);
        await loadHandbookData();
      } catch (error) {
        console.error("Failed to delete section:", error);
      }
    }
  };

  // NEW: helpers for toggling sections
  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const expandAll = () =>
    setOpenSections({ philosophy: true, rule: true, workflow: true, command: true, tool: true });

  const collapseAll = () =>
    setOpenSections({ philosophy: false, rule: false, workflow: false, command: false, tool: false });

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sections.filter(section =>
      section.title?.toLowerCase().includes(lowerCaseQuery) ||
      section.content?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, sections]);

  const groupedSections = useMemo(() => {
    return filteredSections.reduce((acc, section) => {
      const type = section.section_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(section);
      return acc;
    }, {});
  }, [filteredSections]);

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const philosophy = groupedSections.philosophy?.[0];

  return (
    <div className="space-y-8">
      {/* Search + global controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search handbook (rules, commands, workflow...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg !rounded-[var(--button-radius)] bg-slate-900/80 border-slate-800/60"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="!rounded-[var(--button-radius)]">
            <ChevronDown className="w-4 h-4 mr-1" /> Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="!rounded-[var(--button-radius)]">
            <ChevronUp className="w-4 h-4 mr-1" /> Collapse all
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => setIsImporterOpen(true)} className="!rounded-[var(--button-radius)]">
              <FileDown className="w-4 h-4 mr-2" />
              Import from Google Doc
            </Button>
          )}
        </div>
      </div>

      {/* Core Philosophy */}
      {philosophy && (
        <Section
          title={philosophy.title}
          isAdmin={isAdmin}
          onAdd={() => handleOpenForm('philosophy', philosophy)}
          isOpen={openSections.philosophy}
          onToggle={() => toggleSection('philosophy')}
        >
           <div className="group relative">
            <div className="text-lg text-slate-300 leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: philosophy.content }} />
            {isAdmin && (
              <Button onClick={() => handleOpenForm('philosophy', philosophy)} size="icon" variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Section>
      )}

      {/* Rules & Guidelines */}
      <Section
        title="Rules & Guidelines"
        onAdd={() => handleOpenForm('rule')}
        isAdmin={isAdmin}
        isOpen={openSections.rule}
        onToggle={() => toggleSection('rule')}
      >
        <div className="space-y-3">
          {(groupedSections.rule || []).map(section => (
            <RuleCard
              key={section.id}
              section={section}
              isExpanded={!!expandedItems[section.id]}
              onToggle={() => toggleItem(section.id)}
              onEdit={handleOpenForm.bind(null, 'rule')}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
          {(groupedSections.rule || []).length === 0 && <p className="text-slate-400 text-center py-4">No rules match your search.</p>}
        </div>
      </Section>

      {/* Moderation Workflow */}
      <Section
        title="Moderation Workflow"
        onAdd={() => handleOpenForm('workflow')}
        isAdmin={isAdmin}
        isOpen={openSections.workflow}
        onToggle={() => toggleSection('workflow')}
      >
        <div className="space-y-3">
          {(groupedSections.workflow || []).map(section => (
            <RuleCard
              key={section.id}
              section={section}
              isExpanded={!!expandedItems[section.id]}
              onToggle={() => toggleItem(section.id)}
              onEdit={handleOpenForm.bind(null, 'workflow')}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </Section>

      {/* Common Commands */}
      <Section
        title="Common Commands"
        onAdd={() => handleOpenForm('command')}
        isAdmin={isAdmin}
        isOpen={openSections.command}
        onToggle={() => toggleSection('command')}
      >
        <div className="space-y-4">
          {(groupedSections.command || []).map(section => (
            <div key={section.id} className="group flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 bg-slate-800/50 rounded-lg relative">
              <code className="font-mono text-sm bg-slate-700/80 text-amber-300 px-3 py-1.5 rounded self-start flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                {section.title}
              </code>
              <div className="text-slate-300 text-sm flex-1 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />
              {isAdmin && (
                  <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => handleOpenForm('command', section)} size="icon" variant="ghost"><Edit className="w-4 h-4" /></Button>
                    <Button onClick={() => handleDelete(section.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
              )}
            </div>
          ))}
        </div>
      </Section>
      
      {/* Helpful Tools & Links */}
      <Section
        title="Helpful Tools & Links"
        onAdd={() => handleOpenForm('tool')}
        isAdmin={isAdmin}
        isOpen={openSections.tool}
        onToggle={() => toggleSection('tool')}
      >
        <div className="space-y-3">
          {(groupedSections.tool || []).map(section => (
            <div key={section.id} className="group relative">
                <a href={section.metadata?.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                <div className="flex justify-between items-center">
                    <div>
                    <h5 className="font-semibold text-slate-200">{section.title}</h5>
                    <div className="text-sm text-slate-400 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />
                    </div>
                    <LinkIcon className="w-5 h-5 text-slate-500" />
                </div>
                </a>
                {isAdmin && (
                  <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => handleOpenForm('tool', section)} size="icon" variant="ghost"><Edit className="w-4 h-4" /></Button>
                    <Button onClick={() => handleDelete(section.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </Section>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'Edit' : 'Add'} Section</DialogTitle>
            <DialogDescription>
              Modify the details for this handbook section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={editingSection?.title || ''}
                onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
              />
            </div>
            {formSectionType === 'tool' && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input
                  value={editingSection?.metadata?.url || ''}
                  onChange={(e) => setEditingSection({...editingSection, metadata: { ...editingSection.metadata, url: e.target.value }})}
                  placeholder="https://example.com"
                />
              </div>
            )}
             <div>
              <label className="block text-sm font-medium mb-1">Content / Description</label>
              <RichTextEditor
                 value={editingSection?.content || ''}
                 onChange={(value) => setEditingSection({...editingSection, content: value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <Input
                type="number"
                value={editingSection?.display_order || 0}
                onChange={(e) => setEditingSection({...editingSection, display_order: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Importer */}
      {isAdmin && (
        <HandbookImportDialog
          open={isImporterOpen}
          onOpenChange={setIsImporterOpen}
          onImported={loadHandbookData}
        />
      )}
    </div>
  );
}
