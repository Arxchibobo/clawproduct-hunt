// Theme Management Module
import { state, setState } from './state.js';

export function initTheme() {
    const theme = state.theme;
    applyTheme(theme);
}

export function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState('theme', newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

export function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Create theme toggle button
export function createThemeToggle() {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'fixed bottom-4 right-4 z-40 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform';
    button.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
    button.onclick = () => {
        toggleTheme();
        button.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
    };
    document.body.appendChild(button);
}
