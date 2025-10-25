import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Render all projects
renderProjects(projects, projectsContainer, 'h2');

// Add project count to the page title
const pageTitle = document.querySelector('h1');
if (pageTitle) {
  pageTitle.textContent += ` (${projects.length} projects)`;
}