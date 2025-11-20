import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Step 1.1: Global variables for timeline
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits;
let xScale, yScale; // Make scales global for updateScatterPlot

// Step 1.1: Load and parse CSV data
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// Step 1.2: Process commit data
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/aceyq/portfolio_AQ/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      // Add hidden lines property
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false
      });

      return ret;
    });
}

// Step 1.1: Time slider event handler
function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeDisplay = document.getElementById('commit-time');
  
  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  
  // Update time display
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: "long",
    timeStyle: "short"
  });
  
  // Step 1.2: Filter commits
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  
  // Update visualization with filtered data
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits); // Also update stats
}

// Step 1.3: Display stats
function renderCommitInfo(data, commits) {
  // Clear any existing content
  d3.select('#stats').html('');
  
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Basic stats
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // Average line length
  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(avgLineLength.toFixed(1));

  // Longest file (in lines)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );
  const longestFile = d3.greatest(fileLengths, d => d[1]);
  dl.append('dt').text('Longest file');
  dl.append('dd').text(`${longestFile[1]} lines`);

  // Most active time of day
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => {
      const hour = new Date(d.datetime).getHours();
      if (hour < 6) return 'Night';
      if (hour < 12) return 'Morning';
      if (hour < 18) return 'Afternoon';
      return 'Evening';
    }
  );
  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  dl.append('dt').text('Most active time');
  dl.append('dd').text(maxPeriod);
}

// Step 3.1: Tooltip content rendering
function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (!commit || Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id.slice(0, 8) + '...'; // Shorten commit hash
    date.textContent = commit.datetime?.toLocaleDateString('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    time.textContent = commit.datetime?.toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit'
    });
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

// Step 3.3: Tooltip visibility
function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

// Step 3.4: Tooltip positioning - FIXED VERSION
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const padding = 10;
    
    // Use pageX/pageY to account for scrolling
    tooltip.style.left = `${event.pageX + padding}px`;
    tooltip.style.top = `${event.pageY + padding}px`;
}

// Step 5.4: Check if commit is within brush selection
function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) {
    return false;
  }
  
  // Convert commit data to pixel coordinates
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  
  // Check if point is within brush rectangle
  return x >= selection[0][0] && 
         x <= selection[1][0] && 
         y >= selection[0][1] && 
         y <= selection[1][1];
}

// Step 5.5: Show count of selected commits
function renderSelectionCount(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

// Step 5.6: Show language breakdown
function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function renderScatterPlot(data, commits) {
    // Step 2.1: Set up dimensions and margins
    const width = 1000;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    // Create SVG
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible')
      .style('max-width', '100%')
      .style('height', 'auto');
  
    // Create scales (make them global for updateScatterPlot)
    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    // Step 4.1: Create radius scale for dot sizes
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    
    // Step 4.2: Use square root scale for accurate area perception
    const rScale = d3
      .scaleSqrt() // Square root scale for proportional areas
      .domain([minLines, maxLines])
      .range([2, 30]); // Adjust these values based on your preference
  
    // Step 2.3: Add gridlines first
    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);
  
    gridlines.call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );
  
    // Step 2.1: Draw the dots with time-based coloring and hover events
    const dots = svg.append('g').attr('class', 'dots');

    // Step 4.3: Sort commits by size for better overlapping interaction
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines); // Descending order

    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // Step 1.3: Add key function for stability
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        // Step 4.1: Use radius scale based on lines edited
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', (d) => {
            // Color based on time of day
            const hour = d.datetime.getHours();
            if (hour < 6) return '#4e79a7'; // Night - blue
            if (hour < 12) return '#f28e2c'; // Morning - orange
            if (hour < 18) return '#e15759'; // Afternoon - red
            return '#76b7b2'; // Evening - teal
        })
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        // Step 3.1 & 4.1: Enhanced hover events with opacity changes
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mousemove', (event) => {
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore opacity
            updateTooltipVisibility(false);
        });
  
    // Step 2.2: Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => {
        const hour = d % 24;
        return String(hour).padStart(2, '0') + ':00';
      });
  
    // Add X axis with class for updates
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    // Add Y axis with class for consistency
    svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    // Add axis labels
    svg
      .append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .text('Date');
  
    svg
      .append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .attr('x', -height / 2)
      .attr('y', 15)
      .text('Time of Day');

    // Step 5.4: Brush event handler
    function brushed(event) {
      const selection = event.selection;
      d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d, xScale, yScale)
      );
      renderSelectionCount(selection, commits, xScale, yScale);
      renderLanguageBreakdown(selection, commits, xScale, yScale);
    }

    // Step 5.1: Create brush
    const brush = d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on('start brush end', brushed);

    // Apply brush to SVG
    svg.call(brush);

    // Step 5.2: Raise dots to fix tooltip issue
    svg.selectAll('.dots, .overlay ~ *').raise();
}

// Step 1.2: Update scatter plot function
function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart').select('svg');

    // Update xScale domain with filtered commits
    xScale.domain(d3.extent(commits, (d) => d.datetime));

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);

    // Update x-axis
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    // Update dots with key function for stability
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // Step 1.3: Add key function
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', (d) => {
            const hour = d.datetime.getHours();
            if (hour < 6) return '#4e79a7';
            if (hour < 12) return '#f28e2c';
            if (hour < 18) return '#e15759';
            return '#76b7b2';
        })
        .style('fill-opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mousemove', (event) => {
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });
}

// Load everything and display stats AND scatterplot
let data = await loadData();
let commits = processCommits(data);

// Step 1.1: Initialize time scale
timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

filteredCommits = commits;

// Initialize the slider display
onTimeSliderChange();

// Set up event listener
document.getElementById('commit-progress').addEventListener('input', onTimeSliderChange);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log('Data loaded:', data);
console.log('Commits processed:', commits);