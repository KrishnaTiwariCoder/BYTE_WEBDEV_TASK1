import  { useState } from 'react';
import {  Github, Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { GitHubApiService } from '../services/githubApi';
import { GeminiApiService } from '../services/geminiApi.ts';
import { generateReadme } from '../template';   
import { ApiError } from '../services/githubApi';
import type { ReadmeData } from '../types';


interface LoadingState {
  step: string;
  progress: number;
}



export default function ReadmeGenerator() {
  const [repoUrl, setRepoUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [loading, setLoading] = useState(false);    
  const [loadingState, setLoadingState] = useState<LoadingState>({ step: '', progress: 0 });
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const githubService = new GitHubApiService();

  const updateLoadingState = (step: string, progress: number) => {
    setLoadingState({ step, progress });
  };

  const handleGenerate = async () => {
    if (!repoUrl.trim() || !geminiApiKey.trim()) {
      setError('Please provide both repository URL and Gemini API key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setGeneratedReadme('');

    try {
      updateLoadingState('Parsing repository URL...', 20);
      
      const parsed = githubService.parseGitHubUrl(repoUrl.trim());
      if (!parsed) {
        throw new Error('Invalid GitHub repository URL. Please use format: https://github.com/owner/repo');
      }

      const { owner, repo } = parsed;
      
      updateLoadingState('Fetching repository data...', 40);
      const repoData = await githubService.fetchRepository(owner, repo);
      
      updateLoadingState('Fetching repository languages...', 60);
      const languages = await githubService.fetchLanguages(owner, repo);
      
      updateLoadingState('Fetching repository contents...', 70);
      const contents = await githubService.fetchContents(owner, repo);
      
      updateLoadingState('Generating content with AI...', 85);
      const geminiService = new GeminiApiService(geminiApiKey);
      const generated = await geminiService.generateContent(repoData, languages, contents);
      
      updateLoadingState('Creating README...', 95);
      const readmeData: ReadmeData = {
        repo: repoData,
        languages,
        contents,
        generated
      };
      
      const readme = generateReadme(readmeData);
      setGeneratedReadme(readme);
      setSuccess(true);
      updateLoadingState('Complete!', 100);
      
    } catch (error) {
      console.error('Generation error:', error);
      if (error instanceof ApiError || error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedReadme) return;
    
    try {
      await navigator.clipboard.writeText(generatedReadme);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Github className="w-8 h-8 text-blue-600" />
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI-Powered README Generator
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Transform any GitHub repository into a professional README with AI-generated content, 
          complete documentation, and beautiful formatting.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              id="repoUrl"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="geminiKey" className="block text-sm font-semibold text-gray-700 mb-2">
              Google Gemini API Key
            </label>
            <input
              id="geminiKey"
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !repoUrl.trim() || !geminiApiKey.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center space-x-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Professional README</span>
            </>
          )}
        </button>

        {loading && (
          <div className="space-y-3">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 transition-all duration-300"
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">{loadingState.step}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && generatedReadme && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-green-700">
              <p className="font-semibold">README Generated Successfully!</p>
              <p className="text-sm">Your professional README is ready for download.</p>
            </div>
          </div>
        )}
      </div>

      {generatedReadme && (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <span>Generated README.md</span>
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={handleCopyToClipboard}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {generatedReadme}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}