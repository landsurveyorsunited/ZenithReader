
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Feed } from '../types/feed';
import { CloseIcon, TrashIcon } from './Icons';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  feeds: Feed[];
  onAddFeed: (url: string) => Promise<void>;
  onRemoveFeed: (id: string) => void;
  onImportOPML: (url: string) => Promise<void>;
  displayCount: number;
  onDisplayCountChange: (count: number) => void;
}

export default function SettingsModal({ open, onClose, feeds, onAddFeed, onRemoveFeed, onImportOPML, displayCount, onDisplayCountChange }: SettingsModalProps) {
  const [feedUrl, setFeedUrl] = useState('');
  const [opmlUrl, setOpmlUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl || isAdding) return;
    setIsAdding(true);
    try {
      await onAddFeed(feedUrl);
      setFeedUrl('');
    } catch(error) {
        alert(`Failed to add feed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleImportOPML = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opmlUrl || isImporting) return;
    setIsImporting(true);
    try {
      await onImportOPML(opmlUrl);
      setOpmlUrl('');
    } catch(error) {
        alert(`Failed to import OPML: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const displayOptions = [12, 24, 48, 999]; // 999 for "All"

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in" onClick={onClose}>
      <div 
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-slide-in max-h-[80vh]"
      >
        <header className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close settings">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-md font-medium text-gray-200 mb-2">Add RSS Feed</h3>
            <form onSubmit={handleAddFeed} className="flex gap-2">
              <input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-200 mb-2">Import from OPML URL</h3>
            <form onSubmit={handleImportOPML} className="flex gap-2">
              <input
                type="url"
                value={opmlUrl}
                onChange={(e) => setOpmlUrl(e.target.value)}
                placeholder="https://example.com/feeds.opml"
                className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <button type="submit" disabled={isImporting} className="px-4 py-2 bg-green-600 rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </form>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-200 mb-2">Current Feeds</h3>
            {feeds.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {feeds.map(feed => (
                    <li key={feed.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                      <span className="text-sm truncate flex-1" title={feed.url}>{feed.title}</span>
                      <button onClick={() => onRemoveFeed(feed.id)} className="p-1 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400" aria-label={`Remove ${feed.title}`}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No feeds added yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-200 mb-2">View Options</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="display-count" className="text-sm text-gray-300">Posts per feed:</label>
              <select
                id="display-count"
                name="display-count"
                value={displayCount}
                onChange={(e) => onDisplayCountChange(Number(e.target.value))}
                className="bg-gray-900 border border-gray-600 rounded-md py-1 pl-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                {displayOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 999 ? 'All' : opt}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}