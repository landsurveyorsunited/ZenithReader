import type { Post } from '../types/feed';

// Use rss2json for parsing RSS feeds to JSON.
const RSS_PARSER_PROXY = 'https://api.rss2json.com/v1/api.json';

// Use a simple CORS proxy for fetching raw text content like OPML.
const RAW_CORS_PROXY = 'https://corsproxy.io';

interface FetchFeedResponse {
  feedTitle?: string;
  items: Post[];
}

// Type definitions for the response from rss2json.com
interface Rss2JsonItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
    content: string;
    enclosure: any;
    categories: string[];
}

interface Rss2JsonResponse {
    status: string;
    feed: {
        url: string;
        title: string;
        link: string;
        author: string;
        description: string;
        image: string;
    };
    items: Rss2JsonItem[];
}

/**
 * Extracts the first image URL from an HTML string as a fallback.
 * @param html The HTML content string.
 * @returns The URL of the first image found, or null.
 */
function extractFirstImageFromHtml(html: string): string | null {
  if (!html) return null;
  const imgTagMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgTagMatch ? imgTagMatch[1] : null;
}


export async function fetchFeed(feedUrl: string): Promise<FetchFeedResponse> {
  const proxyUrl = `${RSS_PARSER_PROXY}?rss_url=${encodeURIComponent(feedUrl)}`;
  
  try {
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: 'Failed to parse error response.' }));
      throw new Error(`Proxy error (${res.status}): ${errorBody.message || res.statusText}`);
    }

    const data: Rss2JsonResponse = await res.json();

    if (data.status !== 'ok') {
        throw new Error(`RSS parser API error: Could not parse feed from ${feedUrl}.`);
    }

    const feedTitle = data.feed.title;
    const items: Post[] = data.items.map(item => ({
        guid: item.guid || item.link,
        title: item.title,
        link: item.link,
        isoDate: new Date(item.pubDate).toISOString(),
        content: item.content,
        summary: item.description, // The card component expects HTML for the summary
        firstImage: item.thumbnail || extractFirstImageFromHtml(item.content) || null,
        author: item.author,
        feedTitle: feedTitle,
    }));

    return { feedTitle, items };

  } catch (error) {
    console.error(`Failed to fetch feed from ${feedUrl}:`, error);
    throw new Error(`Could not fetch feed. Check the URL and your network connection. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchOPML(opmlUrl: string): Promise<string> {
  const proxyUrl = `${RAW_CORS_PROXY}/?${encodeURIComponent(opmlUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch OPML file with status: ${res.status}`);
    }
    return await res.text();
  } catch (error) {
    console.error(`Failed to fetch OPML from ${opmlUrl}:`, error);
    throw new Error(`Could not fetch OPML file. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
}
