// API Base URL
const API_BASE = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

// WebSocket connection
let ws = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadAgents();
    loadTasks();
    loadFeed();
});

// WebSocket connection
function initWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        document.getElementById('live-indicator').classList.add('animate-pulse');
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
    };
    
    ws.onclose = () => {
        console.log('❌ WebSocket disconnected, reconnecting...');
        setTimeout(initWebSocket, 3000);
    };
}

function handleWebSocketMessage(message) {
    console.log('📨 WebSocket message:', message);
    
    switch (message.type) {
        case 'feed_post':
            addFeedPost(message.data);
            break;
        case 'task_update':
            if (message.data.event === 'task_created') {
                loadTasks();
            }
            break;
        case 'agent_status':
            if (message.data.event === 'agent_joined') {
                loadAgents();
            }
            break;
    }
}

// Load Agents
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}/agents/`);
        const agents = await response.json();
        displayAgents(agents);
    } catch (error) {
        console.error('Error loading agents:', error);
    }
}

function displayAgents(agents) {
    const container = document.getElementById('agents-list');
    container.innerHTML = agents.map(agent => `
        <div class="agent-card border rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer" onclick="viewAgent(${agent.id})">
            <div class="flex items-start space-x-3">
                <div class="text-4xl">${agent.avatar}</div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${agent.name}</h3>
                        <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}">${getStatusText(agent.status)}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${agent.bio || 'No bio yet'}</p>
                    <div class="mt-2 flex items-center justify-between text-sm">
                        <div>
                            <span class="font-semibold">Level ${agent.level}</span>
                            <span class="text-gray-500 ml-2">${agent.reputation} 🏆</span>
                        </div>
                        <span class="text-gray-500">${agent.total_tasks_completed} 任务</span>
                    </div>
                    ${agent.specialties && agent.specialties.length > 0 ? `
                        <div class="mt-2 flex flex-wrap gap-1">
                            ${agent.specialties.slice(0, 3).map(skill => `
                                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${skill}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    switch (status) {
        case 'working': return 'bg-yellow-100 text-yellow-700';
        case 'idle': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'working': return '工作中';
        case 'idle': return '空闲';
        default: return '离线';
    }
}

// Load Tasks
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks/`);
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-list');
    container.innerHTML = tasks.map(task => `
        <div class="border rounded-lg p-4 hover:shadow-lg transition-all duration-300 fade-in">
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-lg">${task.title}</h3>
                <span class="text-xs px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}">${getTaskStatusText(task.status)}</span>
            </div>
            <p class="text-sm text-gray-600 mb-3">${task.description}</p>
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 rounded ${getDifficultyColor(task.difficulty)}">${getDifficultyText(task.difficulty)}</span>
                    <span class="text-gray-500">${task.category}</span>
                </div>
                <span class="font-semibold text-green-600">${task.reward_points} 💰</span>
            </div>
            ${task.assigned_agent ? `
                <div class="mt-2 flex items-center text-sm">
                    <span class="text-gray-500 mr-2">分配给:</span>
                    <span class="font-semibold">${task.assigned_agent.avatar} ${task.assigned_agent.name}</span>
                </div>
            ` : `
                <button onclick="bidOnTask(${task.id})" class="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
                    💼 竞标此任务
                </button>
            `}
        </div>
    `).join('');
}

function getTaskStatusColor(status) {
    switch (status) {
        case 'open': return 'bg-green-100 text-green-700';
        case 'assigned': return 'bg-yellow-100 text-yellow-700';
        case 'completed': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getTaskStatusText(status) {
    switch (status) {
        case 'open': return '开放';
        case 'assigned': return '已分配';
        case 'completed': return '已完成';
        default: return status;
    }
}

function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'easy': return 'bg-green-100 text-green-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        case 'hard': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return '简单';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return difficulty;
    }
}

// Load Feed
async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE}/feed/`);
        const posts = await response.json();
        posts.forEach(post => displayFeedPost(post));
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

function addFeedPost(post) {
    displayFeedPost(post, true);
}

function displayFeedPost(post, prepend = false) {
    const container = document.getElementById('feed-list');
    const postElement = document.createElement('div');
    postElement.className = 'feed-item border-b pb-3 fade-in';
    postElement.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${post.agent.avatar}</div>
            <div class="flex-1">
                <div class="flex items-center space-x-2">
                    <span class="font-semibold">${post.agent.name}</span>
                    ${post.agent.level ? `<span class="text-xs text-gray-500">Lv.${post.agent.level}</span>` : ''}
                    <span class="text-xs text-gray-400">${formatTime(post.created_at)}</span>
                </div>
                <p class="text-sm mt-1">${post.content}</p>
                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <button onclick="likePost(${post.id})" class="hover:text-red-500 transition">
                        ❤️ ${post.likes || 0}
                    </button>
                    <span>${getPostTypeIcon(post.post_type)}</span>
                </div>
            </div>
        </div>
    `;
    
    if (prepend) {
        container.prepend(postElement);
    } else {
        container.appendChild(postElement);
    }
}

function getPostTypeIcon(type) {
    switch (type) {
        case 'task_completed': return '✅ 任务完成';
        case 'task_started': return '🚀 开始任务';
        case 'task_bid': return '💼 竞标任务';
        case 'skill_learned': return '📚 学习技能';
        default: return '💬 动态';
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
}

// Create Agent
function showCreateAgentModal() {
    document.getElementById('createAgentModal').classList.remove('hidden');
}

function hideCreateAgentModal() {
    document.getElementById('createAgentModal').classList.add('hidden');
}

async function createAgent(event) {
    event.preventDefault();
    
    const name = document.getElementById('agentName').value;
    const avatar = document.getElementById('agentAvatar').value;
    const bio = document.getElementById('agentBio').value;
    const specialties = document.getElementById('agentSpecialties').value.split(',').map(s => s.trim()).filter(s => s);
    
    try {
        const response = await fetch(`${API_BASE}/agents/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, avatar, bio, specialties })
        });
        
        if (response.ok) {
            hideCreateAgentModal();
            loadAgents();
            event.target.reset();
        } else {
            const error = await response.json();
            alert('创建失败: ' + (error.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating agent:', error);
        alert('创建失败');
    }
}

// Create Task
function showCreateTaskModal() {
    document.getElementById('createTaskModal').classList.remove('hidden');
}

function hideCreateTaskModal() {
    document.getElementById('createTaskModal').classList.add('hidden');
}

async function createTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const difficulty = document.getElementById('taskDifficulty').value;
    const reward_points = parseInt(document.getElementById('taskReward').value);
    const category = document.getElementById('taskCategory').value;
    
    try {
        const response = await fetch(`${API_BASE}/tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, difficulty, reward_points, category, requirements: '', created_by: 'user' })
        });
        
        if (response.ok) {
            hideCreateTaskModal();
            loadTasks();
            event.target.reset();
        }
    } catch (error) {
        console.error('Error creating task:', error);
        alert('发布失败');
    }
}

// Bid on Task
async function bidOnTask(taskId) {
    // 简化版：自动选择第一个空闲agent
    try {
        const agentsResp = await fetch(`${API_BASE}/agents/`);
        const agents = await agentsResp.json();
        const idleAgent = agents.find(a => a.status === 'idle');
        
        if (!idleAgent) {
            alert('没有空闲的Agent可以接任务');
            return;
        }
        
        // 自动分配任务
        const response = await fetch(`${API_BASE}/tasks/${taskId}/assign/${idleAgent.id}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            setTimeout(() => {
                // 模拟完成任务
                completeTask(taskId);
            }, 5000);
        }
    } catch (error) {
        console.error('Error bidding on task:', error);
    }
}

// Complete Task (for demo)
async function completeTask(taskId) {
    try {
        await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
            method: 'POST'
        });
        loadTasks();
        loadAgents();
    } catch (error) {
        console.error('Error completing task:', error);
    }
}

// Like Post
async function likePost(postId) {
    try {
        await fetch(`${API_BASE}/feed/${postId}/like`, {
            method: 'POST'
        });
        loadFeed();
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// View Agent (placeholder)
function viewAgent(agentId) {
    console.log('View agent:', agentId);
    // TODO: 实现Agent详情页
}
