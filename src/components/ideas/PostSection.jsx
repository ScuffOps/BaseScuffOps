import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/entities/Post';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RichTextEditor from '../shared/RichTextEditor';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function PostSection({ ideaId }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [user, setUser] =useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (ideaId) {
      const fetchedPosts = await Post.filter({ ideaId }, '-created_date');
      setPosts(fetchedPosts);
    }
  }, [ideaId]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await User.me();
      setUser(currentUser);
    };

    fetchUser();
    fetchPosts();
  }, [ideaId, fetchPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await Post.create({
        ideaId,
        content: newPostContent,
        authorName: user.displayName || user.email,
        authorAvatar: user.avatar || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`,
      });
      setNewPostContent('');
      fetchPosts();
    } catch (error) {
      console.error("Failed to add post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg text-slate-200">Development Updates ({posts.length})</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <RichTextEditor
          value={newPostContent}
          onChange={setNewPostContent}
          placeholder="Add a development update..."
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !newPostContent.trim()}>
            {isSubmitting ? 'Posting...' : 'Add Update'}
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {posts.map((post) => (
          <div key={post.id} className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-bold text-slate-100">{post.authorName}</span>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                </span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-p:my-2">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}