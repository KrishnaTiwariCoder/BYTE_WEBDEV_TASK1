  import type { ReadmeData , GitHubRepo } from './types';


export function generateReadme(data: ReadmeData): string {
  const { repo, languages, generated } = data;
  
  const techStack = Object.keys(languages)
    .sort((a, b) => languages[b] - languages[a])
    .slice(0, 5);
  
  const installationSection = generateInstallationSection(techStack, generated.installation);
  const usageSection = generated.usage.includes('```') ? generated.usage : `\`\`\`bash\n${generated.usage}\n\`\`\``;
  
  return `# ${repo.name}

            ${generated.description}

            ## ✨ Features

            ${generated.features.map(feature => `- ${feature}`).join('\n')}

            ## 🚀 Installation

            ${installationSection}

            ## 📖 Usage

            ${usageSection}

            ## 🛠️ Tech Stack

            ${techStack.map(tech => `- **${tech}**`).join('\n')}

            ## 📁 Project Structure

            \`\`\`
            ${repo.name}/
            ├── ${getProjectStructure(data.contents)}
            \`\`\`

            ## 🤝 Contributing

            Contributions are welcome! Please feel free to submit a Pull Request.

            1. Fork the project
            2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
            3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
            4. Push to the branch (\`git push origin feature/AmazingFeature\`)
            5. Open a Pull Request

            ## 📄 License

            ${getLicenseSection(repo)}

            ## ⭐ Support

            If you find this project helpful, please consider giving it a star on GitHub!

            [![GitHub stars](https://img.shields.io/github/stars/${repo.full_name}?style=social)](${repo.html_url}/stargazers)
            [![GitHub forks](https://img.shields.io/github/forks/${repo.full_name}?style=social)](${repo.html_url}/network/members)

            ---

            **Repository:** [${repo.full_name}](${repo.html_url})  
            **Author:** [${repo.owner.login}](${repo.owner.html_url})  
            **Created:** ${new Date(repo.created_at).toLocaleDateString()}  
            **Last Updated:** ${new Date(repo.updated_at).toLocaleDateString()}
            `;
}

function generateInstallationSection(techStack: string[], installation: string): string {
  if (installation.includes('```')) {
    return installation;
  }
  
  if (techStack.includes('JavaScript') || techStack.includes('TypeScript')) {
    return `\`\`\`bash
# Clone the repository
git clone ${getCloneExample()}

# Navigate to project directory
cd project-name

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

${installation}`;
  }
  
  if (techStack.includes('Python')) {
    return `\`\`\`bash
# Clone the repository
git clone ${getCloneExample()}

# Navigate to project directory
cd project-name

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

${installation}`;
  }
  
  return `\`\`\`bash
# Clone the repository
git clone ${getCloneExample()}

# Navigate to project directory
cd project-name

${installation}
\`\`\``;
}

function getCloneExample(): string {
  return 'https://github.com/username/repository.git';
}

function getProjectStructure(contents: any[]): string {
  const structure = contents
    .slice(0, 8)
    .map(item => {
      if (item.type === 'dir') {
        return `├── ${item.name}/`;
      }
      return `├── ${item.name}`;
    })
    .join('\n');
  
  return structure || '├── src/\n├── README.md\n├── package.json';
}

function getLicenseSection(repo: GitHubRepo): string {
  if (repo.license) {
    return `This project is licensed under the ${repo.license.name} License - see the [LICENSE](LICENSE) file for details.`;
  }
  
  return 'This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.';
}