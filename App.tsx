import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFeeds } from './hooks/useFeeds';
import type { Post } from './types/feed';
import FeedSelector from './components/FeedSelector';
import PostCard from './components/PostCard';
import PostModal from './components/PostModal';
import SettingsModal from './components/SettingsModal';
import { LoadingSpinnerIcon, RssIcon, SearchIcon, ArrowDownIcon } from './components/Icons';
import { getDisplayCount, setDisplayCount } from './services/storageService';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const {
    feeds,
    selectedFeed,
    posts,
    loading,
    error,
    isDataStale,
    refreshingFeedUrl,
    selectFeed,
    addFeed,
    removeFeed,
    importFromOPML,
    refreshFeed,
  } = useFeeds();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCountState] = useState(24);
  const isOnline = useOnlineStatus();

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullPosition, setPullPosition] = useState(0);

  const REFRESH_THRESHOLD = 80; // Pixels to pull to trigger

  useEffect(() => {
    const loadDisplayCount = async () => {
      const savedCount = await getDisplayCount();
      setDisplayCountState(savedCount);
    };
    loadDisplayCount();
  }, []);

  const handleDisplayCountChange = async (count: number) => {
    setDisplayCountState(count);
    await setDisplayCount(count);
  };

  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
  };

  const handleClosePost = () => {
    setSelectedPost(null);
  };
  
  // Reset search when feed changes for better UX
  useEffect(() => {
    setSearchQuery('');
  }, [selectedFeed]);

  // Open settings if loading has finished and still no feeds are configured
  useEffect(() => {
    if (!loading && feeds.length === 0 && !error) {
      setIsSettingsOpen(true);
    }
  }, [feeds.length, loading, error]);

  // Memoize filtered posts to avoid re-calculating on every render
  const filteredPosts = useMemo(() => {
    if (!searchQuery) {
      return posts;
    }
    const query = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.summary.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const postsToDisplay = useMemo(() => {
    // A displayCount of 999 is used as "All"
    if (displayCount >= 999) {
        return filteredPosts;
    }
    return filteredPosts.slice(0, displayCount);
  }, [filteredPosts, displayCount]);

  // Pull to refresh handlers
  const handleRefresh = async () => {
    if (!selectedFeed || !isOnline) return;
    setIsRefreshing(true);
    try {
      await refreshFeed(selectedFeed);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      // Animate back up
      setPullPosition(0);
      setIsRefreshing(false);
      setTouchStartY(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (document.documentElement.scrollTop === 0 && !isRefreshing) {
      setTouchStartY(e.targetTouches[0].clientY);
    } else {
      setTouchStartY(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || isRefreshing) return;
    
    const currentY = e.targetTouches[0].clientY;
    const pullDistance = currentY - touchStartY;

    if (pullDistance > 0) {
      // Prevent browser's default pull-to-refresh behavior
      e.preventDefault();
      // Apply resistance to the pull for a more natural feel
      const resistedPull = Math.pow(pullDistance, 0.85);
      setPullPosition(resistedPull);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY === null || isRefreshing) return;

    if (pullPosition > REFRESH_THRESHOLD) {
      setPullPosition(60); // Snap to a loading position
      handleRefresh();
    } else {
      // Animate back to zero if not pulled far enough
      setPullPosition(0);
    }
    setTouchStartY(null);
  };


  const MainContent: React.FC = () => {
    if (loading && posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <LoadingSpinnerIcon className="w-12 h-12 text-blue-500" />
          <p className="mt-4 text-gray-400">Fetching {selectedFeed?.title || 'feeds'}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center pt-20">
            <p className="text-red-400">Error fetching feed:</p>
            <p className="text-sm text-gray-500 mt-2 max-w-md">{error}</p>
        </div>
      );
    }
    
    if (!selectedFeed) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center pt-20">
                <RssIcon className="w-16 h-16 text-gray-600" />
                <h2 className="mt-4 text-xl font-semibold">Welcome to Zenith RSS Reader</h2>
                <p className="mt-2 text-gray-400">Select a feed from the dropdown to get started.</p>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Add or Manage Feeds
                </button>
            </div>
        )
    }

    if (posts.length > 0 && filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center pt-20">
          <SearchIcon className="w-16 h-16 text-gray-600" />
          <h2 className="text-xl font-semibold mt-4">No Results Found</h2>
          <p className="mt-2 text-gray-400">Your search for "{searchQuery}" did not match any posts.</p>
        </div>
      );
    }

    if (posts.length === 0 && !loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center pt-20">
          <h2 className="text-xl font-semibold">No posts found</h2>
          <p className="mt-2 text-gray-400">This feed appears to be empty.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:gap-6 md:p-6">
        {postsToDisplay.map((post) => (
          <PostCard key={post.guid} post={post} onOpen={handleOpenPost} />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-gray-900 text-gray-100 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <FeedSelector
        feeds={feeds}
        selectedFeed={selectedFeed}
        onSelectFeed={selectFeed}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isOnline}
        isDataStale={isDataStale}
        refreshingFeedUrl={refreshingFeedUrl}
      />
      
      {/* Pull to refresh indicator */}
      <div 
        className="fixed top-16 left-0 right-0 flex justify-center items-center pointer-events-none z-50"
        style={{ 
          opacity: Math.min(pullPosition / REFRESH_THRESHOLD, 1),
          transform: `translateY(${Math.min(pullPosition, 60) - 60}px)`,
        }}
      >
        <div className="bg-gray-800 rounded-full p-2 shadow-lg">
        {isRefreshing ? 
          <LoadingSpinnerIcon className="w-6 h-6 text-blue-400" /> :
          <ArrowDownIcon 
            className="w-6 h-6 text-gray-400 transition-transform"
            style={{ transform: `rotate(${Math.min(pullPosition, REFRESH_THRESHOLD) * 2}deg)` }}
          />
        }
        </div>
      </div>


      <main 
        className="flex-grow pt-16"
        style={{ 
          transform: `translateY(${pullPosition}px)`, 
          transition: isRefreshing || touchStartY !== null ? 'none' : 'transform 0.3s ease' 
        }}
      >
        <MainContent />
      </main>

      {selectedPost && (
        <PostModal
          open={!!selectedPost}
          post={selectedPost}
          onClose={handleClosePost}
        />
      )}
      
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        feeds={feeds}
        onAddFeed={addFeed}
        onRemoveFeed={removeFeed}
        onImportOPML={importFromOPML}
        displayCount={displayCount}
        onDisplayCountChange={handleDisplayCountChange}
      />
    </div>
  );
}