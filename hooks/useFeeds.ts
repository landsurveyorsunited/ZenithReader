import { useState, useEffect, useCallback } from 'react';
import type { Feed, Post } from '../types/feed';
import * as storage from '../services/storageService';
import { fetchFeed, fetchOPML } from '../services/rssService';
import { parseOPML } from '../services/opmlParser';

const DEFAULT_OPML_URL = 'https://labs.landsurveyorsunited.com/opml/combined.opml';

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDataStale, setIsDataStale] = useState<boolean>(false);
  const [refreshingFeedUrl, setRefreshingFeedUrl] = useState<string | null>(null);
  const [readPostGuids, setReadPostGuids] = useState<Set<string>>(new Set());

  const selectFeed = useCallback(async (feed: Feed | null) => {
    if (!feed) {
        setSelectedFeed(null);
        setPosts([]);
        setLoading(false);
        setIsDataStale(false);
        await storage.setLastSelectedFeedId(null);
        return;
    }

    setLoading(true);
    setError(null);
    setSelectedFeed(feed);
    setPosts([]);
    setIsDataStale(false);
    await storage.setLastSelectedFeedId(feed.id);

    try {
      const cachedData = await storage.getCachedPosts(feed.url);
      if (cachedData) {
        setPosts(cachedData.posts);
        const isStale = Date.now() - cachedData.timestamp > storage.CACHE_TTL;
        setIsDataStale(isStale);
        setLoading(false); // Show cached data immediately
      }

      // Fetch fresh data in the background
      setRefreshingFeedUrl(feed.url);
      const newFeedData = await fetchFeed(feed.url);
      const fetchedPosts = newFeedData.items.map(p => ({ ...p, feedTitle: newFeedData.feedTitle || feed.title }));

      setPosts(fetchedPosts);
      setIsDataStale(false);
      await storage.cachePosts(feed.url, fetchedPosts);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      if (!posts.length) { // If there's no cached data to show
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshingFeedUrl(null);
    }
  }, [posts.length]);

  const importFromOPML = useCallback(async (url: string) => {
    const opmlText = await fetchOPML(url);
    const opmlFeeds = parseOPML(opmlText);
    
    const newFeeds = opmlFeeds
        .map(opmlFeed => ({
            id: opmlFeed.xmlUrl,
            url: opmlFeed.xmlUrl,
            title: opmlFeed.title || opmlFeed.text || opmlFeed.xmlUrl,
        }))
        .filter(newFeed => !feeds.some(existingFeed => existingFeed.url === newFeed.url));

    if (newFeeds.length > 0) {
        const updatedFeeds = [...feeds, ...newFeeds];
        setFeeds(updatedFeeds);
        await storage.saveFeeds(updatedFeeds);
        if(!selectedFeed) {
            await selectFeed(updatedFeeds[0]);
        }
    }
  }, [feeds, selectFeed, selectedFeed]);
  
  const refreshFeed = useCallback(async (feed: Feed) => {
    setRefreshingFeedUrl(feed.url);
    try {
      const newFeedData = await fetchFeed(feed.url);
      const fetchedPosts = newFeedData.items.map(p => ({ ...p, feedTitle: newFeedData.feedTitle || feed.title }));
      setPosts(fetchedPosts);
      setIsDataStale(false);
      await storage.cachePosts(feed.url, fetchedPosts);
    } catch (err) {
      console.error('Error refreshing feed:', err);
      // Re-throw so the caller can handle it in the UI
      throw err;
    } finally {
      setRefreshingFeedUrl(null);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [savedFeeds, savedReadGuids] = await Promise.all([
        storage.getFeeds(),
        storage.getReadPostGuids(),
      ]);
      setReadPostGuids(new Set(savedReadGuids));

      if (savedFeeds.length > 0) {
        setFeeds(savedFeeds);
        const lastSelectedFeedId = await storage.getLastSelectedFeedId();
        const feedToSelect = savedFeeds.find(f => f.id === lastSelectedFeedId) || savedFeeds[0];
        await selectFeed(feedToSelect);
      } else {
        // No feeds saved, attempt to import from default OPML
        try {
          await importFromOPML(DEFAULT_OPML_URL);
        } catch (opmlError) {
          console.error('Failed to load default OPML:', opmlError);
          setError('Could not load default feeds. Please add a feed manually.');
          setLoading(false); // Stop loading if OPML import fails
        }
      }
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount.

  const addFeed = async (url: string) => {
    if (feeds.some(f => f.url === url)) {
        throw new Error("Feed already exists.");
    }
    const newFeedData = await fetchFeed(url); // Validate by fetching
    const newFeed: Feed = {
      id: url,
      url: url,
      title: newFeedData.feedTitle || url,
    };
    const updatedFeeds = [...feeds, newFeed];
    setFeeds(updatedFeeds);
    await storage.saveFeeds(updatedFeeds);
    await selectFeed(newFeed);
  };

  const removeFeed = async (id: string) => {
    const updatedFeeds = feeds.filter(f => f.id !== id);
    setFeeds(updatedFeeds);
    await storage.saveFeeds(updatedFeeds);
    await storage.removeCachedPosts(id);
    
    if (selectedFeed?.id === id) {
      await selectFeed(updatedFeeds[0] || null);
    }
  };
  
  const markPostAsRead = useCallback(async (guid: string) => {
    if (readPostGuids.has(guid)) return; // Already read, do nothing
    
    const newReadPostGuids = new Set(readPostGuids);
    newReadPostGuids.add(guid);
    setReadPostGuids(newReadPostGuids);
    await storage.saveReadPostGuids(Array.from(newReadPostGuids));
  }, [readPostGuids]);

  return { feeds, selectedFeed, posts, loading, error, isDataStale, refreshingFeedUrl, readPostGuids, selectFeed, addFeed, removeFeed, importFromOPML, refreshFeed, markPostAsRead };
}