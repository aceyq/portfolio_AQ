import { fetchJSON, renderProjects } from './global.js';

document.addEventListener('DOMContentLoaded', async function() {
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3); // Get first 3 projects
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
        renderProjects(latestProjects, projectsContainer, 'h2');
        console.log('✅ Latest projects loaded on homepage:', latestProjects.length);
    }
});