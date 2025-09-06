export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  language: string | null;
  languages_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  default_branch: string;
  owner: {
    login: string;
    html_url: string;
  };
}

export interface RepoContents {
  name: string;
  type: string;
  path: string;
}

export interface GeneratedContent {
  description: string;
  features: string[];
  usage: string;
  installation: string;
}

export interface ReadmeData {
  repo: GitHubRepo;
  languages: Record<string, number>;
  contents: RepoContents[];
  generated: GeneratedContent;
}