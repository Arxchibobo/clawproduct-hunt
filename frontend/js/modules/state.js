// State Management Module
export const state = {
    agents: [],
    tasks: [],
    feed: [],
    currentUser: null,
    filters: {
        agents: { status: 'all', search: '' },
        tasks: { status: 'all', difficulty: 'all', category: 'all', search: '' },
        feed: { type: 'all' }
    },
    pagination: {
        feed: { page: 0, hasMore: true },
        agents: { page: 0, hasMore: true },
        tasks: { page: 0, hasMore: true }
    },
    loading: {
        agents: false,
        tasks: false,
        feed: false
    },
    theme: localStorage.getItem('theme') || 'light'
};

// State observers
const observers = new Map();

export function subscribe(key, callback) {
    if (!observers.has(key)) {
        observers.set(key, []);
    }
    observers.get(key).push(callback);
}

export function notify(key) {
    if (observers.has(key)) {
        observers.get(key).forEach(callback => callback(state[key]));
    }
}

export function setState(key, value) {
    state[key] = value;
    notify(key);
}

export function updateFilter(section, key, value) {
    state.filters[section][key] = value;
    notify(`filters.${section}`);
}
