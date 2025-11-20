import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// -------------------------------
// Global variables
// -------------------------------
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits;
let xScale, yScale;

let data;
let commits;

// -------------------------------
// Load and process data
// -------------------------------
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

function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let f = lines[0];
    return {
      id: commit,
      url: `https://github.com/aceyq/portfolio_AQ/commit/${commit}`,
      author: f.author,
      date: f.date,
      time: f.time,
      timezone: f.timezone,
      datetime: f.datetime,
      hourFrac: f.datetime.getHours() + f.datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines, // full line list
    };
  });
}

// -------------------------------
// Slider change handler
// -------------------------------
function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeDisplay = document.getElementById('slider-time-display');

  commitProgress = Number(slider.value);

  // map 0–100 → datetime
  commitMaxTime = timeScale.invert(commitProgress);

  // Update <time> display
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: "long",
    timeStyle: "short"
  });

  // Filter commits
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  // Update visuals
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);
}

// -------------------------------
// Stats panel
// -------------------------------
function renderCommitInfo(data, commits) {
  d3.select('#stats').html('');
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(avgLineLength.toFixed(1));

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, d => d.line),
    (d) => d.file
  );
  const longestFile = d3.greatest(fileLengths, d => d[1]);
  dl.append('dt').text('Longest file');
  dl.append('dd').text(`${longestFile[1]} lines`);

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

// -------------------------------
// Tooltip support
// -------------------------------
function renderTooltipContent(commit) {
  if (!commit) return;

  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id.slice(0, 8) + '...';

  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  document.getElementById('commit-time').textContent =
    commit.datetime.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit'
    });

  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;
}

// -------------------------------
// Brush helpers
// -------------------------------
function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return (
    x >= selection[0][0] && x <= selection[1][0] &&
    y >= selection[0][1] && y <= selection[1][1]
  );
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selected = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];
  document.querySelector('#selection-count').textContent =
    `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selected = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const container = document.getElementById('language-breakdown');
  container.innerHTML = '';

  if (selected.length === 0) return;

  const lines = selected.flatMap((d) => d.lines);
  const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

  for (const [lang, count] of breakdown) {
    const pct = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${count} lines (${pct})</dd>`;
  }
}

// -------------------------------
// Render scatter plot (initial)
// -------------------------------
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const usable = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible')
    .style('max-width', '100%')
    .style('height', 'auto');

  // Scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  const dots = svg.append('g').attr('class', 'dots');
  const sorted = d3.sort(commits, (d) => -d.totalLines);

  const [minL, maxL] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minL, maxL]).range([2, 30]);

  dots.selectAll('circle')
    .data(sorted, (d) => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => {
      const h = d.datetime.getHours();
      if (h < 6) return '#4e79a7';
      if (h < 12) return '#f28e2c';
      if (h < 18) return '#e15759';
      return '#76b7b2';
    })
    .style('fill-opacity', 0.7)
    .attr('stroke', 'white')
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Axes with ticks(6)
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).tickFormat(d =>
    String(d % 24).padStart(2, '0') + ':00'
  );

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(yAxis);

  // Brush
  const brush = d3.brush()
    .extent([[usable.left, usable.top], [usable.right, usable.bottom]])
    .on('brush start end', (event) => {
      const sel = event.selection;
      renderSelectionCount(sel, commits, xScale, yScale);
      renderLanguageBreakdown(sel, commits, xScale, yScale);
    });

  svg.call(brush);
  svg.selectAll('.dots').raise();
}

// -------------------------------
// Update scatter plot
// -------------------------------
function updateScatterPlot(data, commits) {
  const svg = d3.select('#chart').select('svg');

  // Update x domain
  xScale.domain(d3.extent(commits, (d) => d.datetime));

  // Redraw x-axis
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const xAxisGroup = svg.select('.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // Update dots
  const dots = svg.select('g.dots');
  const sorted = d3.sort(commits, (d) => -d.totalLines);

  const [minL, maxL] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minL, maxL]).range([2, 30]);

  dots.selectAll('circle')
    .data(sorted, (d) => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => {
      const h = d.datetime.getHours();
      if (h < 6) return '#4e79a7';
      if (h < 12) return '#f28e2c';
      if (h < 18) return '#e15759';
      return '#76b7b2';
    })
    .style('fill-opacity', 0.7)
    .attr('stroke', 'white')
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// -------------------------------
// Initialization
// -------------------------------
async function init() {
  data = await loadData();
  commits = processCommits(data);

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, 100]);

  filteredCommits = commits;

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);

  document.getElementById('commit-progress')
    .addEventListener('input', onTimeSliderChange);

  onTimeSliderChange();
}

init();
