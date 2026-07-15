/* eslint-disable @typescript-eslint/no-unused-vars */
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
    contents: RepoContents[],
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildPrompt(repo, languages, contents);
      console.log("5" , prompt);
      
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
      console.log("6" , generatedText);
      
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
    contents: RepoContents[],
    
  ): string {
    const languageList = Object.keys(languages).join(', ');
    const fileList = contents.map(c => c.name).join(', ');
    
    return `
      You are an expert AI assistant that generates professional GitHub README files in Markdown.
      Based on the information provided below, create a complete README.
      Your output MUST strictly follow this structure:
      1. Project Title
      2. Description
      3. Features
      4. Installation Guide
      5. Tech Stack
      6. Project Structure
      7. License Information
      IMPORTANT RULES:
      - Output ONLY the raw Markdown content for the README file.
      - Do NOT include any introductory text.
      ---
      Repository Information:
      - Name: ${repo.name}
      - Description: ${repo.description || "No description provided."}
      - Languages: ${languageList || "Not specified."}
      - License: ${repo.license ? repo.license.name : "Not specified."}
      - Existing README (for context): ${contents ? `\n---\n${contents}\n---` : "None"}
      - File Structure (sample):
        ${fileList}
      ---
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