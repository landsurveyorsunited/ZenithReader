import type { OPMLFeed } from '../types/feed';

export function parseOPML(opmlText: string): OPMLFeed[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(opmlText, 'application/xml');
  
  const errorNode = xml.querySelector('parsererror');
  if (errorNode) {
    console.error('Error parsing OPML:', errorNode.textContent);
    throw new Error('Failed to parse OPML file. Please check the format.');
  }

  const outlines = Array.from(xml.querySelectorAll('outline'));
  const feeds: OPMLFeed[] = outlines
    // FIX: Add an explicit return type to the 'map' callback to help TypeScript's type inference.
    // This ensures the array is of type (OPMLFeed | null)[] which makes the type predicate in .filter() valid.
    .map((o): OPMLFeed | null => {
      const xmlUrl = o.getAttribute('xmlUrl') || o.getAttribute('xmlurl') || '';
      if (!xmlUrl) return null;
      return {
        xmlUrl,
        title: o.getAttribute('title') || o.getAttribute('text') || undefined,
        htmlUrl: o.getAttribute('htmlUrl') || undefined,
        // FIX: Added 'text' property to align the object structure with the OPMLFeed type.
        // This resolves the type predicate error in the .filter() call below.
        text: o.getAttribute('text') || undefined,
      };
    })
    .filter((feed): feed is OPMLFeed => feed !== null);
    
  return feeds;
}