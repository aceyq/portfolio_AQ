import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Render all projects
renderProjects(projects, projectsContainer, 'h2');

// Add project count to the page title
const pageTitle = document.querySelector('.projects-title');
if (pageTitle) {
    pageTitle.textContent = `Projects (${projects.length})`;
}

// Step 1: Create pie chart with D3
// Count projects by year
const yearCounts = {};
projects.forEach(project => {
    yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
});

// Convert to array for D3
const data = Object.values(yearCounts);
const labels = Object.keys(yearCounts);

// Create arc generator
const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Create pie chart data
const sliceGenerator = d3.pie();
const arcData = sliceGenerator(data);

// Create color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw the pie chart
arcData.forEach((slice, idx) => {
    d3.select('#projects-pie-plot')
        .append('path')
        .attr('d', arcGenerator(slice))
        .attr('fill', colors(idx))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
});

console.log('📊 Pie chart data:', { labels, data });