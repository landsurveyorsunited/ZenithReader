
export interface Feed {
  id: string; // Typically the feed URL itself
  title: string;
  url: string;
}

export interface Post {
  guid: string;
  title: string;
  link: string;
  isoDate: string;
  content: string; // Full HTML content
  summary: string; // Plain text snippet
  firstImage: string | null;
  author?: string;
  feedTitle: string;
}

export interface OPMLFeed {
  title?: string;
  xmlUrl: string;
  htmlUrl?: string;
  text?: string;
}
