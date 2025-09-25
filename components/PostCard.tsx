import React from 'react';
import type { Post } from '../types/feed';

interface PostCardProps {
  post: Post;
  onOpen: (post: Post) => void;
  isRead: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onOpen, isRead }) => {
  const formattedDate = new Date(post.isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article 
        className={`flex flex-col bg-gray-800/60 rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/20 ${isRead ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      {post.firstImage && (
        <div className="h-40 w-full overflow-hidden">
          <img src={post.firstImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-blue-400 font-semibold">{post.feedTitle}</p>
        <button onClick={() => onOpen(post)} className="text-left w-full mt-1">
          <h3 className="text-md font-semibold text-gray-100 line-clamp-3 hover:text-blue-300 transition-colors">
            {post.title}
          </h3>
        </button>
        <div 
          className="mt-2 text-sm text-gray-400 line-clamp-3" 
          dangerouslySetInnerHTML={{ __html: post.summary }}
        />
        <div className="mt-4 pt-3 border-t border-gray-700/50 text-xs text-gray-500 flex-grow flex items-end">
          <p>{formattedDate}</p>
        </div>
      </div>
    </article>
  );
};

export default PostCard;