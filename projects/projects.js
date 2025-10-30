import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let query = '';

// Render all projects on page load
renderProjects(projects, projectsContainer, 'h2');

// Add project count to the page title
const pageTitle = document.querySelector('.projects-title');
if (pageTitle) {
    pageTitle.textContent = `Projects (${projects.length})`;
}

// Step 4.1: Add search input to the page
const searchInput = document.createElement('input');
searchInput.className = 'searchBar';
searchInput.type = 'search';
searchInput.setAttribute('aria-label', 'Search projects');
searchInput.placeholder = '🔍 Search projects…';

// Insert search bar after the chart container
const chartContainer = document.querySelector('.chart-container');
chartContainer.after(searchInput);

// Step 4.4: Refactor pie chart rendering into a function
function renderPieChart(projectsGiven) {
    // Clear existing pie chart and legend
    d3.select('#projects-pie-plot').selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();
    
    // Re-calculate rolled data with filtered projects
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    // Re-calculate data for pie chart
    let newData = newRolledData.map(([year, count]) => {
        return { 
            value: count, 
            label: `Year ${year}` 
        };
    });

    // Only render pie chart if we have data
    if (newData.length > 0) {
        // Create arc generator
        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(50);

        // Create pie chart data with value accessor
        const sliceGenerator = d3.pie().value(d => d.value);
        const arcData = sliceGenerator(newData);

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
        newData.forEach((d, idx) => {
            legend
                .append('li')
                .attr('style', `--color: ${colors(idx)}`)
                .attr('class', 'legend-item')
                .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
        });
    }
}

// Step 4.2-4.3: Search functionality
searchInput.addEventListener('input', (event) => {
    // Update query value
    query = event.target.value.toLowerCase();
    
    // Filter projects across all metadata
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });
    
    // Render filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    
    // Update project count in title
    if (pageTitle) {
        pageTitle.textContent = `Projects (${filteredProjects.length})`;
    }
    
    // Re-render pie chart with filtered data
    renderPieChart(filteredProjects);
});

// Call this function on page load
renderPieChart(projects);