import localforage from 'localforage';
import type { Feed, Post } from '../types/feed';

localforage.config({
  name: 'ZenithRssReader',
  storeName: 'rss_data',
  description: 'Stores RSS feeds and cached posts',
});

const FEEDS_KEY = 'user_feeds';
const LAST_FEED_KEY = 'last_selected_feed';
const POST_CACHE_PREFIX = 'post_cache_';
export const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DISPLAY_COUNT_KEY = 'display_count';
const DEFAULT_DISPLAY_COUNT = 24;
const READ_POSTS_KEY = 'read_posts_guids';


interface CachedPosts {
  timestamp: number;
  posts: Post[];
}

// Feed List Management
export const saveFeeds = (feeds: Feed[]): Promise<Feed[]> => {
  return localforage.setItem<Feed[]>(FEEDS_KEY, feeds);
};

export const getFeeds = async (): Promise<Feed[]> => {
  return (await localforage.getItem<Feed[]>(FEEDS_KEY)) || [];
};

// Last Selected Feed
export const setLastSelectedFeedId = (feedId: string | null): Promise<string | null> => {
    return localforage.setItem<string | null>(LAST_FEED_KEY, feedId);
};

export const getLastSelectedFeedId = (): Promise<string | null> => {
    return localforage.getItem<string | null>(LAST_FEED_KEY);
};

// Post Caching
export const cachePosts = (feedUrl: string, posts: Post[]): Promise<CachedPosts> => {
  const data: CachedPosts = {
    timestamp: Date.now(),
    posts,
  };
  return localforage.setItem<CachedPosts>(`${POST_CACHE_PREFIX}${feedUrl}`, data);
};

export const getCachedPosts = async (feedUrl: string): Promise<CachedPosts | null> => {
  const data = await localforage.getItem<CachedPosts>(`${POST_CACHE_PREFIX}${feedUrl}`);
  return data || null;
};

export const removeCachedPosts = (feedUrl: string): Promise<void> => {
    return localforage.removeItem(`${POST_CACHE_PREFIX}${feedUrl}`);
}

// Display Count Preference
export const setDisplayCount = (count: number): Promise<number> => {
    return localforage.setItem<number>(DISPLAY_COUNT_KEY, count);
};

export const getDisplayCount = async (): Promise<number> => {
    const count = await localforage.getItem<number>(DISPLAY_COUNT_KEY);
    return count ?? DEFAULT_DISPLAY_COUNT;
};

// Read Posts Management
export const saveReadPostGuids = (guids: string[]): Promise<string[]> => {
    return localforage.setItem<string[]>(READ_POSTS_KEY, guids);
};

export const getReadPostGuids = async (): Promise<string[]> => {
    return (await localforage.getItem<string[]>(READ_POSTS_KEY)) || [];
};