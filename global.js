console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

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

let pages = [
    { url: '', title: 'Home'},
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'Resume' },
    { url: 'https://github.com/aceyq', title: 'Github' }
];

const BASE_PATH = (location.hostname == 'localhost' || location.hostname == '127.0.0.1')
    ? "/"
    :"/portfolio_AQ/";

let nav = document.createElement('nav');
document.body.preprend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );

    if (a.host !== location.host) {
        a.target = "_blank";
    }

    nav.append(a);
}