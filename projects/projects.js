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

// Step 1-2: Create pie chart with D3 and legend
// Count projects by year
const yearCounts = {};
projects.forEach(project => {
    yearCounts[project.year] = (yearCounts[project.year] || 0) + 1;
});

// Convert to array of objects with labels
const data = Object.keys(yearCounts).map(year => ({
    label: `Year ${year}`,
    value: yearCounts[year]
}));

// Create arc generator
const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

// Create pie chart data with value accessor
const sliceGenerator = d3.pie().value(d => d.value);
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

// Step 2.2: Create legend
const legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend
        .append('li')
        .attr('style', `--color: ${colors(idx)}`)
        .attr('class', 'legend-item')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

console.log('📊 Pie chart data:', data);