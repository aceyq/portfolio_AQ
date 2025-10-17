
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