
import { useState, useEffect, useCallback } from 'react';
import { Comment as CommentEntity } from '@/entities/Comment'; // Renamed to avoid conflict with React component
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
// New import as per outline
import ReactMarkdown from 'react-markdown'; // New import as per outline

// New Comment component for rendering individual comments with rich text
function Comment({ comment }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src={comment.authorAvatar} />
        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-slate-800/50 p-3 rounded-lg">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-sm text-slate-200">{comment.authorName}</p>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
          </span>
        </div>
        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
          <ReactMarkdown>{comment.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ ideaId, currentUser }) { // Added currentUser prop
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  // const [user, setUser] = useState(null); // Removed: user is now passed via currentUser prop
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (ideaId) {
      const fetchedComments = await CommentEntity.filter({ ideaId }, '-created_date');
      setComments(fetchedComments);
    }
  }, [ideaId]);

  useEffect(() => {
    // Removed: The user fetching logic is no longer needed as currentUser is passed as a prop
    // const fetchUser = async () => {
    //   const currentUser = await User.me();
    //   setUser(currentUser);
    // };
    // fetchUser();

    fetchComments(); // Keep fetching comments
  }, [ideaId, fetchComments]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return; // Use currentUser prop

    setIsSubmitting(true);
    try {
      await CommentEntity.create({ // Using the aliased CommentEntity
        ideaId,
        content: newComment,
        authorName: currentUser.displayName || currentUser.email, // Use currentUser prop
        authorAvatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.displayName || currentUser.email}`, // Use currentUser prop
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg text-slate-200">Comments ({comments.length})</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={currentUser?.avatar} /> {/* Use currentUser prop */}
            <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'U'}</AvatarFallback> {/* Use currentUser prop */}
          </Avatar>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            className="flex-1"
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {comments.map((comment) => (
          // Render the new Comment component for each comment
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
