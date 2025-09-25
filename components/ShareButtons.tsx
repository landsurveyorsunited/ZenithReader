
import React from 'react';
import { ShareIcon, XIcon, FacebookIcon, LinkedInIcon, RedditIcon } from './Icons';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url,
      }).catch(console.error);
    }
  };

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  };

  return (
    <div className="flex items-center gap-2">
      {navigator.share ? (
        <button
          onClick={handleNativeShare}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Share"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      ) : (
        <>
          <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <XIcon className="w-5 h-5" />
          </a>
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <FacebookIcon className="w-5 h-5" />
          </a>
          <a href={shareLinks.reddit} target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit" className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <RedditIcon className="w-5 h-5" />
          </a>
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <LinkedInIcon className="w-5 h-5" />
          </a>
        </>
      )}
    </div>
  );
}