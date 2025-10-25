import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Load and display latest projects
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
        renderProjects(latestProjects, projectsContainer, 'h2');
    }
    
    // Load and display GitHub stats
    const githubData = await fetchGitHubData('aceyq'); // Your GitHub username
    const profileStats = document.querySelector('#profile-stats');
    
    if (profileStats) {
        profileStats.innerHTML = `
            <dl>
                <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                <dt>Followers:</dt><dd>${githubData.followers}</dd>
                <dt>Following:</dt><dd>${githubData.following}</dd>
            </dl>
        `;
        console.log('✅ GitHub stats loaded!');
    }
});