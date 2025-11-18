
import IdeaCard from './IdeaCard';

export default function IdeaListView({ ideas, onIdeaClick, onEdit, onDelete, canModify }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onClick={onIdeaClick}
          onEdit={onEdit}
          onDelete={onDelete}
          canModify={typeof canModify === 'function' ? canModify(idea) : !!canModify}
        />
      ))}
    </div>
  );
}
