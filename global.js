
// Step 2.1: Get all nav links
// const navLinks = $$("nav a");

// Step 2.2: Find the link to the current page
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// Step 2.3: Add the current class to the current page link
// if (currentLink) {
//   currentLink.classList.add('current');
// }

console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3.1: Define all pages in one place
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'cv/', title: 'Resume' },
  { url: 'meta/', title: 'Code Analysis' }, // ← NEW LINE
  { url: 'https://github.com/aceyq', title: 'GitHub' }
];

// Detect if we're local or on GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                                  // Local server
  : "/portfolio_AQ/";                    // Your GitHub repo name

// Create navigation element
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add each page to navigation
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  // Fix internal links for GitHub Pages
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  // Create link element (more flexible than HTML strings)
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Step 3.2: Highlight current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  
  // Step 3.2: Open external links in new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }
  
  nav.append(a);
}

// Step 4: Dark Mode Switcher
// Add theme switcher HTML
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

// Get reference to the select element
const select = document.querySelector('.color-scheme select');

// Function to set color scheme
function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    localStorage.colorScheme = colorScheme;
}

// Load saved preference
if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

// Listen for changes
select.addEventListener('input', function (event) {
    setColorScheme(event.target.value);
});

// Step 5: Better Contact Form
const form = document.querySelector('form[action^="mailto:"]');

form?.addEventListener('submit', function (event) {
    // Prevent the default form submission
    event.preventDefault();
    
    console.log('📧 Form submitted! Building better email...');
    
    // Get form data
    const data = new FormData(this);
    
    // Start building the URL with the base action
    let url = this.action;
    let firstParam = true;
    
    // Add each form field to the URL with proper encoding
    for (let [name, value] of data) {
        // Properly encode the value (spaces become %20 instead of +)
        const encodedValue = encodeURIComponent(value);
        
        // Add ? before first parameter, & before subsequent ones
        if (firstParam) {
            url += '?';
            firstParam = false;
        } else {
            url += '&';
        }
        
        // Add the parameter (name=encodedValue)
        url += `${name}=${encodedValue}`;
        
        console.log(`   ${name}: ${value} → ${encodedValue}`);
    }
    
    console.log('📨 Final URL:', url);
    
    // Open the email client with the properly encoded URL
    location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching JSON:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  
  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div class="project-content">
        <p>${project.description}</p>
        <div class="project-year">${project.year}</div>
      </div>
    `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}