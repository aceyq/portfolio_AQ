import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

// Step 3.4: Tooltip positioning
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const padding = 10;
    
    // Position near mouse cursor with offset
    tooltip.style.left = `${event.clientX + padding}px`;
    tooltip.style.top = `${event.clientY + padding}px`;
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
  
    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    const yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
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

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 4)
        .attr('fill', (d) => {
            // Color based on time of day
            const hour = d.datetime.getHours();
            if (hour < 6) return '#4e79a7'; // Night - blue
            if (hour < 12) return '#f28e2c'; // Morning - orange
            if (hour < 18) return '#e15759'; // Afternoon - red
            return '#76b7b2'; // Evening - teal
        })
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        // Step 3.1: Add hover events
        .on('mouseenter', (event, commit) => {
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
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
  
    // Add X axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    // Add Y axis
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
}

// Load everything and display stats AND scatterplot
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log('Data loaded:', data);
console.log('Commits processed:', commits);