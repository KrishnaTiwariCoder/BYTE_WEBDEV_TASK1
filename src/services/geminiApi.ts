import type { GitHubRepo, RepoContents, GeneratedContent } from '../types';
import { ApiError } from './githubApi';

export class GeminiApiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateContent(
    repo: GitHubRepo,
    languages: Record<string, number>,
    contents: RepoContents[]
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildPrompt(repo, languages, contents);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new ApiError(`Gemini API error: ${response.statusText}`, response.status);
      }
      
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new ApiError('Failed to generate content from Gemini API');
      }
      
      return this.parseGeneratedContent(generatedText);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to generate content. Please check your API key and try again.');
    }
  }
  
  private buildPrompt(
    repo: GitHubRepo,
    languages: Record<string, number>,
    contents: RepoContents[]
  ): string {
    const languageList = Object.keys(languages).join(', ');
    const fileList = contents.map(c => c.name).join(', ');
    
    return `
Generate professional README content for a GitHub repository with the following information:

Repository: ${repo.name}
Description: ${repo.description || 'No description provided'}
Languages: ${languageList}
Files: ${fileList}
Topics: ${repo.topics.join(', ')}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}

Please provide the following in JSON format:
{
  "description": "A comprehensive, engaging description of what this project does (2-3 sentences)",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "usage": "Basic usage instructions with code examples if applicable",
  "installation": "Step-by-step installation instructions"
}

Requirements:
- Description should be professional and highlight the project's value
- Features should be 4-6 key functionalities or benefits
- Usage should include practical examples
- Installation should be clear and complete
- Consider the programming languages and file structure when generating content
- Make it sound professional and production-ready
`;
  }
  
  private parseGeneratedContent(text: string): GeneratedContent {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.description || !parsed.features || !parsed.usage || !parsed.installation) {
        throw new Error('Missing required fields in generated content');
      }
      
      return {
        description: parsed.description,
        features: Array.isArray(parsed.features) ? parsed.features : [],
        usage: parsed.usage,
        installation: parsed.installation
      };
    } catch (error) {
      return {
        description: 'A well-crafted software project built with modern technologies.',
        features: [
          'Clean and maintainable code architecture',
          'Modern development practices',
          'Comprehensive functionality',
          'User-friendly interface'
        ],
        usage: 'Clone the repository and follow the installation instructions to get started.',
        installation: 'Clone this repository and install dependencies using your package manager.'
      };
    }
  }
}