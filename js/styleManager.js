const darkMode = {
    /* Important buttons */
    '--button-bg-color': '#535C91',
    '--button-hover-color': '#1B1A55',
    '--button-active-color': '#1B1A55',
    '--button-font-color': '9290C3',

    /* Other buttons */
    '--disabled-bg-color': '#3c4043',
    '--enabled-bg-color': '#202124',
    '--other-bg-color': '#303134',
    '--other-border-color': '#5f6368',
    '--other-light-font-color': '#e8eaed',
    '--other-font-color': '#e8eaed',
    '--other-hover-color': '#3c4043',
    '--other-hover-border-color': '#8ab4f8',

    /* Save and Load buttons */
    '--save-and-load-bg-color': '#9290C3',
    '--save-and-load-hover-color': '#535C91',
    '--save-and-load-active-color': '#535C91',

    /* Setting Colors */
    '--settings-border-color': '#5f6368',
    '--settings-bg-color': '#202124',
    '--fc-neutral-bg-color': 'hsl(0deg 66.91% 3.83% / 78%)',

    /* General colors */
    '--page-bg-color': '#202124',
    '--container-bg-color': '#303134',
    '--box-shadow': '0 2px 5px rgba(0, 0, 0, 0.6)',
    '--font-color': 'white'
};

const lightMode = {
    /* Important buttons */
    '--button-bg-color': '#007bff',
    '--button-hover-color': '#0056b3',
    '--button-active-color': '#004494',
    '--button-font-color': '#fff',

    /* Other buttons */
    '--disabled-bg-color': '#e9e9e9',
    '--enabled-bg-color': '#fff',
    '--other-bg-color': '#fafafa',
    '--other-border-color': '#ddd',
    '--other-light-font-color': '#666',
    '--other-font-color': '#333',
    '--other-hover-color': '#f9f9f9',
    '--other-hover-border-color': '#999',

    /* Save and Load buttons */
    '--save-and-load-bg-color': '#28a745',
    '--save-and-load-hover-color': '#218838',
    '--save-and-load-active-color': '#1e7e34',

    /* Setting Colors */
    '--settings-border-color': '#ccc',
    '--settings-bg-color': '#f9f9f9',
    '--fc-neutral-bg-color': 'hsl(208.21deg 81.58% 66.34% / 44%)',

    /* General colors */
    '--page-bg-color': '#f4f4f4',
    '--container-bg-color': '#fff',
    '--box-shadow': '0 2px 5px rgba(0, 0, 0, 0.1)',
    '--font-color': 'dark'
};

const mode = {
    dark: darkMode,
    light: lightMode
};

const darkModeIcon = `<i class="fas solid fa-moon"></i>`
const lightModeIcon = `<i class="fas solid fa-sun"></i>`

let isDarkMode = localStorage.getItem('style') === 'dark';

function toggleStyle() {
    isDarkMode = !isDarkMode;
    applyStyle(isDarkMode ? darkMode : lightMode);
}

function applyStyle(style) {
    localStorage.setItem('style', isDarkMode ? 'dark' : 'light');
    if (document.getElementById('toggle-dark-mode'))
        // document.getElementById('toggle-dark-mode').innerText = isDarkMode ? 'Light Mode' : 'Dark Mode';
        changeDarkModeIcon();
    for (const [key, value] of Object.entries(style)) {
        document.documentElement.style.setProperty(key, value);
    }
}

function changeDarkModeIcon() {
    if (document.getElementById('dark-mode-icon'))
        document.getElementById('dark-mode-icon').innerHTML = isDarkMode ? lightModeIcon : darkModeIcon;
}

applyStyle(isDarkMode ? darkMode : lightMode);

function loadHeader() {
    fetch('https://simpplay.github.io/unapp/html/header.html')
        .then(response => response.text())
        .then(data => {
            const body = document.querySelector('body');
            if (body) body.insertAdjacentHTML('afterbegin', data);
            if (document.getElementById('toggle-dark-mode'))
                changeDarkModeIcon();
        })
        .catch(error => console.error('Error loading header:', error));
}

loadHeader();