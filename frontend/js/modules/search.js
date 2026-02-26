// Search and Filter Module
import { state, updateFilter, notify } from './state.js';
import { debounce } from '../utils/helpers.js';

export function createSearchBar(section, onSearch) {
    const container = document.getElementById(`${section}-list`).parentElement;
    const searchBar = document.createElement('div');
    searchBar.className = 'mb-4';
    searchBar.innerHTML = `
        <div class="relative">
            <input type="text" 
                   id="${section}-search" 
                   placeholder="🔍 搜索..."
                   class="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
    `;
    
    container.insertBefore(searchBar, container.querySelector('h2').nextSibling);
    
    const input = document.getElementById(`${section}-search`);
    const debouncedSearch = debounce((value) => {
        updateFilter(section, 'search', value);
        onSearch();
    }, 300);
    
    input.addEventListener('input', (e) => debouncedSearch(e.target.value));
}

export function createFilterBar(section, filters, onChange) {
    const container = document.getElementById(`${section}-list`).parentElement;
    const filterBar = document.createElement('div');
    filterBar.className = 'mb-4 flex flex-wrap gap-2';
    
    filters.forEach(filter => {
        const select = document.createElement('select');
        select.id = `${section}-filter-${filter.key}`;
        select.className = 'border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500';
        select.innerHTML = filter.options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        select.addEventListener('change', (e) => {
            updateFilter(section, filter.key, e.target.value);
            onChange();
        });
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">${filter.label}</label>
        `;
        wrapper.appendChild(select);
        filterBar.appendChild(wrapper);
    });
    
    container.insertBefore(filterBar, container.querySelector(`#${section}-search`).parentElement.nextSibling);
}

// Apply filters to data
export function applyFilters(data, section) {
    const filters = state.filters[section];
    let filtered = [...data];
    
    // Search filter
    if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(item => {
            if (section === 'agents') {
                return item.name?.toLowerCase().includes(search) ||
                       item.bio?.toLowerCase().includes(search) ||
                       item.specialties?.some(s => s.toLowerCase().includes(search));
            } else if (section === 'tasks') {
                return item.title?.toLowerCase().includes(search) ||
                       item.description?.toLowerCase().includes(search) ||
                       item.category?.toLowerCase().includes(search);
            }
            return true;
        });
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(item => item.status === filters.status);
    }
    
    // Difficulty filter (tasks only)
    if (section === 'tasks' && filters.difficulty && filters.difficulty !== 'all') {
        filtered = filtered.filter(item => item.difficulty === filters.difficulty);
    }
    
    // Category filter (tasks only)
    if (section === 'tasks' && filters.category && filters.category !== 'all') {
        filtered = filtered.filter(item => item.category === filters.category);
    }
    
    return filtered;
}
