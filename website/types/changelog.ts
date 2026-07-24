/** A parsed changelog entry from markdown */
export interface ChangelogEntry {
  slug: string;
  version: string;
  date: string;
  title: string;
  description: string;
  content: string;
  body: string;
  prev?: { slug: string; title: string; version: string };
  next?: { slug: string; title: string; version: string };
}
