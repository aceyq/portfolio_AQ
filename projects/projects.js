import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let query = '';
let selectedIndex = -1;
let filteredProjects = projects;

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

// Step 4.4 & 5.3: Refactor pie chart rendering into a function
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
            label: `Year ${year}`,
            year: year
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

        // Draw the pie chart with click events
        arcData.forEach((slice, idx) => {
            d3.select('#projects-pie-plot')
                .append('path')
                .attr('d', arcGenerator(slice))
                .attr('fill', colors(idx))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('class', selectedIndex === idx ? 'selected' : '')
                .style('cursor', 'pointer')
                .on('click', () => {
                    // Step 5.2: Handle wedge selection
                    selectedIndex = selectedIndex === idx ? -1 : idx;
                    
                    // Update pie chart selection
                    d3.select('#projects-pie-plot')
                        .selectAll('path')
                        .attr('class', (_, pathIdx) => 
                            selectedIndex === pathIdx ? 'selected' : ''
                        );
                    
                    // Update legend selection
                    d3.select('.legend')
                        .selectAll('li')
                        .attr('class', (_, legendIdx) => 
                            selectedIndex === legendIdx ? 'legend-item selected' : 'legend-item'
                        );
                    
                    // Step 5.3: Filter projects based on selection
                    applyFilters();
                });
        });

        // Create legend with click events
        const legend = d3.select('.legend');
        newData.forEach((d, idx) => {
            legend
                .append('li')
                .attr('style', `--color: ${colors(idx)}`)
                .attr('class', selectedIndex === idx ? 'legend-item selected' : 'legend-item')
                .style('cursor', 'pointer')
                .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
                .on('click', () => {
                    // Handle legend click (same as wedge click)
                    selectedIndex = selectedIndex === idx ? -1 : idx;
                    
                    // Update pie chart selection
                    d3.select('#projects-pie-plot')
                        .selectAll('path')
                        .attr('class', (_, pathIdx) => 
                            selectedIndex === pathIdx ? 'selected' : ''
                        );
                    
                    // Update legend selection
                    d3.select('.legend')
                        .selectAll('li')
                        .attr('class', (_, legendIdx) => 
                            selectedIndex === legendIdx ? 'legend-item selected' : 'legend-item'
                        );
                    
                    // Filter projects based on selection
                    applyFilters();
                });
        });
    }
}

// Step 5.3: Function to apply both search and year filters
function applyFilters() {
    // Start with all projects
    filteredProjects = projects;
    
    // Apply search filter
    if (query) {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }
    
    // Apply year filter if a wedge is selected
    if (selectedIndex !== -1) {
        // Get the year from the current data
        const currentData = getCurrentChartData();
        if (currentData && currentData[selectedIndex]) {
            const selectedYear = currentData[selectedIndex].year;
            filteredProjects = filteredProjects.filter(project => 
                project.year === selectedYear
            );
        }
    }
    
    // Render filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    
    // Update project count
    if (pageTitle) {
        pageTitle.textContent = `Projects (${filteredProjects.length})`;
    }
}

// Helper function to get current chart data
function getCurrentChartData() {
    const currentProjects = query ? 
        projects.filter(p => Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase())) : 
        projects;
    
    let rolledData = d3.rollups(
        currentProjects,
        (v) => v.length,
        (d) => d.year
    );
    
    return rolledData.map(([year, count]) => ({
        value: count,
        label: `Year ${year}`,
        year: year
    }));
}

// Step 4.2-4.3: Search functionality
searchInput.addEventListener('input', (event) => {
    // Update query value
    query = event.target.value.toLowerCase();
    
    // Reset pie chart selection when searching
    selectedIndex = -1;
    
    // Apply filters
    applyFilters();
    
    // Re-render pie chart with filtered data
    renderPieChart(filteredProjects);
});

// Call this function on page load
renderPieChart(projects);