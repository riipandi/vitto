/** A parsed blog post with rendered content */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  created: string;
  updated: string;
  dateDisplay: string;
  content: string;
  body: string;
  id?: number;
}

/** Raw frontmatter fields from a blog markdown file */
export interface BlogFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  author?: string;
  created?: string;
  updated?: string;
  slug?: string;
  [key: string]: unknown;
}
