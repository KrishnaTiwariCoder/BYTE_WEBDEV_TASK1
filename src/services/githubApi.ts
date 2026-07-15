import type { GitHubRepo, RepoContents } from '../types';

export class GitHubApiService {
  private baseUrl = 'https://api.github.com';
  
  async   fetchRepository(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError('Repository not found. Please check the URL and try again.');
        }
        throw new ApiError(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("1" , data);
      return data;

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch repository data. Please check your internet connection.');
    }
  }
  
  async fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/languages`); 
      
      if (!response.ok) {
        return {};
      }
      
      const data = await response.json();
      console.log("2" , data);
      return data;
    } catch (error) {
      return {};
    }
  }
  
  async fetchContents(owner: string, repo: string): Promise<RepoContents[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents`);
      
      if (!response.ok) {
        return [];
      }
      
      const contents = await response.json();
      console.log("3" , contents);
      return Array.isArray(contents) ? contents : [];
    } catch (error) {
      return [];
    }
  }

  async fetchTree(owner: string, repo: string): Promise<RepoContents[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/trees/main?recursive=1`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      console.log("4" , data);
      return Array.isArray(data.tree) ? data.tree : [];
    } catch (error) {
      return [];
    }
  }

  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    try {
      const patterns = [
        /github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
        /^([^\/]+)\/([^\/]+)$/
      ];
      
      const cleanUrl = url.replace(/^https?:\/\//i, '').replace(/\.git$/, '');

      console.log("4" , cleanUrl);
      
      
      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          return {
            owner: match[1],
            repo: match[2]
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

class ApiError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export { ApiError };