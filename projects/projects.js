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

// Step 3: Use actual project data for pie chart
// Group projects by year and count them using d3.rollups()
let rolledData = d3.rollups(
    projects,
    (v) => v.length,  // Count projects in each year group
    (d) => d.year     // Group by year field
);

// Convert to the format needed for our pie chart
let data = rolledData.map(([year, count]) => {
    return { 
        value: count, 
        label: `Year ${year}` 
    };
});

console.log('📊 Rolled data:', rolledData);
console.log('📈 Pie chart data:', data);

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

// Create legend
const legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend
        .append('li')
        .attr('style', `--color: ${colors(idx)}`)
        .attr('class', 'legend-item')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});