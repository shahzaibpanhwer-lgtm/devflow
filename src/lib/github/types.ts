/**
 * The subset of GitHub's REST payloads DevFlow actually reads.
 *
 * Declaring only the fields in use keeps the surface honest — anything not
 * listed here is not relied upon anywhere in the application.
 */

export type GithubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
  fork: boolean;
  archived: boolean;
  pushed_at: string | null;
  updated_at: string | null;
};

export type GithubBranch = {
  name: string;
  commit: { sha: string };
  protected: boolean;
};

export type GithubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string | null; email: string | null; date: string | null } | null;
  };
  author: { login: string; avatar_url: string } | null;
};

export type GithubPullRequest = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  html_url: string;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
};

export type GithubIssue = {
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  created_at: string;
  comments: number;
  user: { login: string; avatar_url: string } | null;
  /** Present only on pull requests, which GitHub also returns from /issues. */
  pull_request?: unknown;
};
