
import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { createPortal } from 'react-dom';
import type { Post } from '../types/feed';
import ShareButtons from './ShareButtons';
import { CloseIcon, LinkIcon } from './Icons';

interface PostModalProps {
  open: boolean;
  post?: Post;
  onClose: () => void;
}

export default function PostModal({ open, post, onClose }: PostModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !post) return null;

  const sanitizedContent = DOMPurify.sanitize(post.content);
  // Check if the main image is already part of the content to avoid duplication
  const showExplicitImage = post.firstImage && !sanitizedContent.includes(`src="${post.firstImage}"`);

  const formattedDate = new Date(post.isoDate).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
  });

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-slide-in"
      >
        <header className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 id="post-title" className="text-xl font-bold text-white">{post.title}</h2>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                <span>{post.feedTitle}</span>
                <span className="text-gray-600">|</span>
                <span>{formattedDate}</span>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto prose prose-invert prose-sm md:prose-base max-w-none prose-img:rounded-lg prose-a:text-blue-400 hover:prose-a:text-blue-300">
          {showExplicitImage && <img src={post.firstImage} alt="" className="w-full h-auto mb-4 rounded-lg" />}
          <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>

        <footer className="flex-shrink-0 p-4 border-t border-gray-700 flex items-center justify-between gap-4">
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <LinkIcon className="w-4 h-4" />
            <span>View Original</span>
          </a>
          <ShareButtons title={post.title} url={post.link} />
        </footer>
      </div>
    </div>,
    document.body
  );
}