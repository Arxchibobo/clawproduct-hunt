// API Module - Centralized API calls
const API_BASE = 'http://localhost:8000/api';

class API {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // Agents
    async getAgents() {
        return this.request('/agents/');
    }
    
    async getAgent(id) {
        return this.request(`/agents/${id}`);
    }
    
    async createAgent(data) {
        return this.request('/agents/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async updateAgent(id, data) {
        return this.request(`/agents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // Tasks
    async getTasks() {
        return this.request('/tasks/');
    }
    
    async getTask(id) {
        return this.request(`/tasks/${id}`);
    }
    
    async createTask(data) {
        return this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async assignTask(taskId, agentId) {
        return this.request(`/tasks/${taskId}/assign/${agentId}`, {
            method: 'POST'
        });
    }
    
    async completeTask(taskId) {
        return this.request(`/tasks/${taskId}/complete`, {
            method: 'POST'
        });
    }
    
    // Feed
    async getFeed(page = 0, limit = 20) {
        return this.request(`/feed/?skip=${page * limit}&limit=${limit}`);
    }
    
    async likePost(postId) {
        return this.request(`/feed/${postId}/like`, {
            method: 'POST'
        });
    }
}

export const api = new API();
