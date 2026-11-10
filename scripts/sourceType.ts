/**
 * Classify an evidence URL by what kind of source it is, so readers can weigh a
 * citation at a glance. Derived from the URL at build time; nothing is stored in
 * the dataset, so there is no schema change.
 *
 * The classes are deliberately coarse and conservative: a project's own website,
 * docs or blog is "Project docs"; a host is only called a third-party article or
 * forum post when it is listed below or matches an obvious pattern.
 */
export type SourceKind = 'wikipedia' | 'repository' | 'paper' | 'docs' | 'forum' | 'article' | 'other';

export const SOURCE_LABELS: Record<SourceKind, string> = {
  wikipedia: 'Wikipedia',
  repository: 'Source repository',
  paper: 'Paper',
  docs: 'Project docs',
  forum: 'Forum post',
  article: 'Third-party article',
  other: 'Other web page',
};

// Independent publications and package indexes cited in the dataset.
const ARTICLE_HOSTS = new Set(['lwn.net', 'auth0.com', 'linkedlist.org', 'slackbuilds.org']);
// Personal snippets: not a project's own documentation, not a repository.
const OTHER_HOSTS = new Set(['gist.github.com']);

export function sourceKind(url: string): SourceKind {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return 'other'; }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname.toLowerCase();

  if (host === 'wikipedia.org' || host.endsWith('.wikipedia.org')) return 'wikipedia';
  if (OTHER_HOSTS.has(host)) return 'other';
  if (host === 'github.com' || host === 'gitlab.com' || host.startsWith('gitlab.') || host === 'codeberg.org'
    || host === 'bitbucket.org' || host === 'git.sr.ht') return 'repository';
  if (path.endsWith('.pdf') || host === 'doi.org' || host === 'dl.acm.org' || host === 'arxiv.org') return 'paper';
  if (host.startsWith('forums.') || host.startsWith('forum.') || host.startsWith('discourse.')) return 'forum';
  if (ARTICLE_HOSTS.has(host)) return 'article';
  return 'docs';
}

export function sourceLabel(url: string): string {
  return SOURCE_LABELS[sourceKind(url)];
}
