
import { useState, useEffect, useCallback } from 'react';
import { Idea, Comment, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import IdeaListView from '../components/ideas/IdeaListView';
import IdeaKanbanView from '../components/ideas/IdeaKanbanView';
import IdeaDetailModal from '../components/ideas/IdeaDetailModal';
import IdeaFormModal from '../components/ideas/IdeaFormModal';
import IdeaTimelineView from '../components/ideas/IdeaTimelineView';
import IdeaPriorityMatrix from '../components/ideas/IdeaPriorityMatrix';
import { InvokeLLM } from '@/integrations/Core';
import IdeaFilters from '../components/ideas/IdeaFilters'; // Added IdeaFilters import

export default function IdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  // searchQuery state removed as filtering is now handled by the filters object
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);

  // New filters state
  const [filters, setFilters] = useState({
    query: "",
    category: "All",
    createdBy: "All",
    tagsText: ""
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ideasData, commentsData, userData] = await Promise.all([
      Idea.list('-updatedAt'),
      Comment.list(),
      User.me()]
      );

      const ideasWithComments = ideasData.map((idea) => ({
        ...idea,
        comments: commentsData.filter((c) => c.ideaId === idea.id)
      }));

      setIdeas(ideasWithComments);
      setComments(commentsData);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canModifyIdea = useCallback((idea) => {
    if (!user) return false;
    // Check if the current user is an admin or leadmod, or if they are the creator of the idea
    return user.role === 'admin' || user.role === 'leadmod' || idea.createdBy === user.email;
  }, [user]);

  const handleDeleteIdea = async (idea) => {
    if (!canModifyIdea(idea)) return;
    const ok = window.confirm(`Delete "${idea.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await Idea.delete(idea.id);
      await loadData();
      if (selectedIdea?.id === idea.id) setSelectedIdea(null);
    } catch (error) {
      console.error("Failed to delete idea:", error);
    }
  };

  const handleClearAll = async () => {
    if (!user || user.role !== 'admin' && user.role !== 'leadmod') {
      console.warn("User does not have permission to clear all ideas.");
      return;
    }
    const ok = window.confirm("This will delete ALL ideas. Are you sure? This action cannot be undone.");
    if (!ok) return;
    try {
      for (const idea of ideas) {
        await Idea.delete(idea.id);
      }
      await loadData();
      setSelectedIdea(null);
    } catch (error) {
      console.error("Failed to clear all ideas:", error);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const idea = ideas.find((i) => i.id === draggableId);
    if (!idea) return; // Add a check if idea is not found
    if (idea.stage === destination.droppableId) return;

    const updatedIdea = { ...idea, stage: destination.droppableId };
    updatedIdea.history = [
    ...(idea.history || []),
    { user: user.email, timestamp: new Date().toISOString(), action: `Moved from ${source.droppableId} to ${destination.droppableId}` }];


    try {
      await Idea.update(draggableId, updatedIdea);
      loadData();
    } catch (error) {
      console.error("Failed to update idea stage:", error);
    }
  };

  const generateAIOverview = useCallback(async (idea) => {
    try {
      // Ensure idea has title and content before generating overview
      if (!idea || !idea.title || !idea.content) {
        console.warn("Cannot generate AI overview: Idea is missing title or content.");
        return;
      }

      const prompt = `Based on the following project idea, provide a concise one-sentence synopsis and an estimated rollout time (e.g., '1-2 weeks', '3 months').
      
      Title: ${idea.title}
      Content: ${idea.content}
      
      Return the response as a JSON object with the keys 'synopsis' and 'rollout_time'.`;

      const aiResponse = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            synopsis: { type: "string", description: "A concise one-sentence summary of the project idea." },
            rollout_time: { type: "string", description: "An estimated time for project rollout, e.g., '2-3 weeks'." }
          },
          required: ["synopsis", "rollout_time"]
        }
      });

      await Idea.update(idea.id, {
        ai_synopsis: aiResponse.synopsis,
        ai_estimated_rollout_time: aiResponse.rollout_time
      });

      await loadData(); // Refresh data to show AI content
    } catch (aiError) {
      console.error("Failed to generate AI synopsis:", aiError);
    }
  }, [loadData]);

  const generateAISuggestions = useCallback(async (idea) => {
    try {
      if (!idea || !idea.title || !idea.content) return;
      const prompt = `You are a senior content strategist. For the following project, generate 5 targeted, actionable content suggestions optimized for current social trends and SEO. Include: title, short description, recommended platforms, 6-10 SEO keywords, 5-10 tags/hashtags, a sample post caption, and 2-3 recommended posting time windows (in local terms like 'Tue 6-8pm'). Tailor to the project's focus and audience.

Project Title: ${idea.title}
Category: ${idea.category}
Tags: ${(idea.tags || []).join(", ")}
Body:
${idea.content}

Return JSON with { suggestions: [{ title, description, platforms, keywords, tags, caption, hashtags, recommended_post_times, notes }] }`;
      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  platforms: { type: "array", items: { type: "string" } },
                  keywords: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                  caption: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  recommended_post_times: { type: "array", items: { type: "string" } },
                  notes: { type: "string" }
                },
                required: ["title","description"]
              }
            }
          },
          required: ["suggestions"]
        }
      });
      const suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];
      await Idea.update(idea.id, { ai_suggestions: suggestions });
      await loadData();
    } catch (e) {
      console.error("Failed to generate AI suggestions:", e);
    }
  }, [loadData]);

  const handleFormSubmit = async (formData) => {
    try {
      let ideaToProcess;
      if (editingIdea) {
        const updatedIdea = {
          ...editingIdea,
          ...formData,
          history: [
          ...(editingIdea.history || []),
          { user: user.email, timestamp: new Date().toISOString(), action: 'Edited Idea' }]

        };
        ideaToProcess = await Idea.update(editingIdea.id, updatedIdea);
      } else {
        const ideaData = {
          ...formData,
          createdBy: user.displayName || user.email,
          authorAvatar: user.avatar,
          history: [{
            user: user.email,
            timestamp: new Date().toISOString(),
            action: 'Created Idea'
          }]
        };
        ideaToProcess = await Idea.create(ideaData);
      }
      setIsFormOpen(false);
      setEditingIdea(null);
      await loadData(); // Show the idea immediately

      // Generate AI overview in the background
      if (ideaToProcess) { // Ensure ideaToProcess is not null/undefined
        generateAIOverview(ideaToProcess);
      }

    } catch (error) {
      console.error("Failed to submit idea:", error);
    }
  };

  const handleEditClick = (idea) => {
    setEditingIdea(idea);
    setSelectedIdea(null); // Close detail view if open
    setIsFormOpen(true); // Open form
  };

  const filteredIdeas = ideas.filter((idea) =>
  {
    const q = filters.query.toLowerCase().trim();
    const tagsFilter = filters.tagsText.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const matchesText = !q ||
      idea.title?.toLowerCase().includes(q) ||
      (idea.content || "").toLowerCase().includes(q) ||
      (idea.ai_synopsis || "").toLowerCase().includes(q);
    const matchesCategory = filters.category === "All" || idea.category === filters.category;
    const matchesCreator = filters.createdBy === "All" || idea.createdBy === filters.createdBy;
    const matchesTags = tagsFilter.length === 0 || (idea.tags || []).some(t => tagsFilter.includes((t || "").toLowerCase()));
    return matchesText && matchesCategory && matchesCreator && matchesTags;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-slate-50">Ideas & Proposals</h1>
        <div className="flex items-center gap-2">
          {(user?.role === 'admin' || user?.role === 'leadmod') &&
          <Button variant="outline" onClick={handleClearAll} className="border-rose-500/30 text-rose-300 hover:text-rose-200 hover:bg-rose-900/20">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          }
          <Button onClick={() => {setEditingIdea(null);setIsFormOpen(true);}} className="bg-rose-800 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10">
            <Plus className="w-4 h-4 mr-2" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Filters component replaces the old search input */}
      <IdeaFilters ideas={ideas} filters={filters} onChange={setFilters} />

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <TabsList className="bg-[#19033f] text-indigo-300 inline-flex h-10 items-center justify-center rounded-x3">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="matrix">Priority Matrix</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="flex-1 mt-4">
          <IdeaKanbanView
            ideas={filteredIdeas}
            onDragEnd={handleDragEnd}
            onIdeaClick={setSelectedIdea}
            onEdit={(idea) => handleEditClick(idea)}
            onDelete={(idea) => handleDeleteIdea(idea)}
            canModify={canModifyIdea} />

        </TabsContent>

        <TabsContent value="board" className="flex-1 mt-4">
          <IdeaListView
            ideas={filteredIdeas}
            onIdeaClick={setSelectedIdea}
            onEdit={(idea) => handleEditClick(idea)}
            onDelete={(idea) => handleDeleteIdea(idea)}
            canModify={canModifyIdea} />

        </TabsContent>

        <TabsContent value="timeline" className="flex-1 mt-4">
          <IdeaTimelineView
            ideas={filteredIdeas}
            onIdeaClick={setSelectedIdea}
            onEdit={(idea) => handleEditClick(idea)}
            onDelete={(idea) => handleDeleteIdea(idea)}
            canModify={canModifyIdea} />

        </TabsContent>

        <TabsContent value="matrix" className="flex-1 mt-4">
          <IdeaPriorityMatrix
            ideas={filteredIdeas}
            onIdeaClick={setSelectedIdea}
            onEdit={(idea) => handleEditClick(idea)}
            onDelete={(idea) => handleDeleteIdea(idea)}
            canModify={canModifyIdea} />

        </TabsContent>
      </Tabs>

      {isFormOpen &&
      <IdeaFormModal
        idea={editingIdea}
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false);setEditingIdea(null);}}
        onSubmit={handleFormSubmit} />

      }

      {selectedIdea &&
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onUpdate={loadData}
        onEdit={handleEditClick}
        onDelete={handleDeleteIdea}
        onGenerateOverview={generateAIOverview}
        onGenerateSuggestions={generateAISuggestions} // Pass new AI suggestions function
      />
      }
    </div>);

}
