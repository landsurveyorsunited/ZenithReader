import React, { useState, useEffect, useRef } from 'react';
import type { Feed } from '../types/feed';
import { PlusIcon, SettingsIcon, SearchIcon, ChevronDownIcon, OfflineIcon, WarningIcon, LoadingSpinnerIcon } from './Icons';

interface FeedSelectorProps {
  feeds: Feed[];
  selectedFeed: Feed | null;
  searchQuery: string;
  displayCount: number;
  isOnline: boolean;
  isDataStale: boolean;
  refreshingFeedUrl: string | null;
  onSelectFeed: (feed: Feed) => void;
  onOpenSettings: () => void;
  onSearchChange: (query: string) => void;
  onDisplayCountChange: (count: number) => void;
}

const StatusIndicator: React.FC<{ isOnline: boolean; isDataStale: boolean }> = ({ isOnline, isDataStale }) => {
    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-sm text-yellow-400" title="You are currently offline.">
                <OfflineIcon className="w-4 h-4" />
                <span>Offline</span>
            </div>
        );
    }
    if (isDataStale) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400" title="Showing cached data. A refresh may have failed.">
                <WarningIcon className="w-4 h-4" />
                <span>Stale</span>
            </div>
        );
    }
    return null;
};


export default function FeedSelector({ feeds, selectedFeed, onSelectFeed, onOpenSettings, searchQuery, onSearchChange, displayCount, onDisplayCountChange, isOnline, isDataStale, refreshingFeedUrl }: FeedSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSelect = (feed: Feed) => {
    onSelectFeed(feed);
    setIsDropdownOpen(false);
  };

  const displayOptions = [12, 24, 48, 999]; // 999 for "All"

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center flex-shrink-0" ref={dropdownRef}>
            <img 
              src="https://storage.ning.com/topology/rest/1.0/file/get/12222126291?profile=original" 
              alt="Land Surveyors United Logo" 
              className="h-8 w-8 mr-3 rounded-md flex-shrink-0"
            />
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-lg font-bold text-white hover:text-blue-300 transition-colors"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <span className="truncate max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                  {selectedFeed?.title || 'Select a Feed'}
                </span>
                {refreshingFeedUrl === selectedFeed?.id && <LoadingSpinnerIcon className="w-4 h-4 text-blue-400" />}
                <ChevronDownIcon className={`w-5 h-5 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 z-50 animate-fade-in max-h-80 overflow-y-auto">
                  {feeds.length > 0 ? (
                    feeds.map(feed => (
                      <button
                        key={feed.id}
                        onClick={() => handleSelect(feed)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 flex items-center justify-between"
                      >
                        <span className="truncate">{feed.title}</span>
                        {refreshingFeedUrl === feed.id && <LoadingSpinnerIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-500">No feeds available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 px-4">
             {selectedFeed && (
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-500" />
                    </span>
                    <input
                        type="search"
                        placeholder={`Search in ${selectedFeed.title}...`}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                </div>
             )}
          </div>

          <div className="flex items-center gap-2">
            <StatusIndicator isOnline={isOnline} isDataStale={isDataStale} />
            <div className="flex items-center gap-2">
              <label htmlFor="display-count" className="text-sm text-gray-400 sr-only">Posts to display</label>
              <select
                id="display-count"
                name="display-count"
                value={displayCount}
                onChange={(e) => onDisplayCountChange(Number(e.target.value))}
                className="bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none"
                style={{ backgroundPosition: 'right 0.5rem center' }}
              >
                {displayOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 999 ? 'All' : opt}</option>
                ))}
              </select>
            </div>
            <button
              onClick={onOpenSettings}
              aria-label="Add or manage feeds"
              className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}