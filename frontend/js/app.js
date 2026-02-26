// API Base URL
const API_BASE = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

// WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// State management
const state = {
    agents: [],
    tasks: [],
    feed: [],
    loading: {
        agents: false,
        tasks: false,
        feed: false
    }
};

// ============== Toast Notification System ==============
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out flex items-center space-x-2 max-w-sm`;
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.innerHTML = `
            <span class="text-xl">${icons[type]}</span>
            <span class="flex-1">${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// ============== Loading States ==============
function showLoading(section) {
    state.loading[section] = true;
    const container = document.getElementById(`${section}-list`);
    
    const skeletons = {
        agents: `
            <div class="animate-pulse space-y-3">
                ${Array(3).fill(0).map(() => `
                    <div class="border rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div class="h-3 bg-gray-200 rounded w-full"></div>
                                <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `,
        tasks: `
            <div class="animate-pulse space-y-3">
                ${Array(3).fill(0).map(() => `
                    <div class="border rounded-lg p-4">
                        <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                `).join('')}
            </div>
        `,
        feed: `
            <div class="animate-pulse space-y-3">
                ${Array(4).fill(0).map(() => `
                    <div class="border-b pb-3">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                                <div class="h-3 bg-gray-200 rounded w-full"></div>
                                <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    };
    
    if (container) {
        container.innerHTML = skeletons[section] || '<div class="text-center text-gray-500">加载中...</div>';
    }
}

function hideLoading(section) {
    state.loading[section] = false;
}

// ============== Empty States ==============
function showEmptyState(section) {
    const container = document.getElementById(`${section}-list`);
    
    const emptyStates = {
        agents: `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🤖</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">还没有 Agent</h3>
                <p class="text-gray-500 mb-4">创建第一个 Agent 开始吧！</p>
                <button onclick="showCreateAgentModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    + 创建 Agent
                </button>
            </div>
        `,
        tasks: `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📋</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">还没有任务</h3>
                <p class="text-gray-500 mb-4">发布第一个任务吧！</p>
                <button onclick="showCreateTaskModal()" class="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-500 transition">
                    + 发布任务
                </button>
            </div>
        `,
        feed: `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📡</div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">动态为空</h3>
                <p class="text-gray-500">当 Agent 开始工作时，这里会显示动态</p>
            </div>
        `
    };
    
    if (container) {
        container.innerHTML = emptyStates[section] || '<div class="text-center text-gray-500">暂无数据</div>';
    }
}

// ============== Initialize App ==============
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    initWebSocket();
    loadAgents();
    loadTasks();
    loadFeed();
    setupErrorHandling();
});

// ============== Error Handling ==============
function setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        Toast.error('发生了一个错误，请稍后重试');
    });
}

async function handleApiError(error, context = '') {
    console.error(`API Error (${context}):`, error);
    
    if (error.message.includes('Failed to fetch')) {
        Toast.error('无法连接到服务器，请检查网络连接');
    } else if (error.status === 404) {
        Toast.error('请求的资源不存在');
    } else if (error.status === 500) {
        Toast.error('服务器错误，请稍后重试');
    } else {
        Toast.error(context ? `${context}失败` : '操作失败');
    }
}

// ============== WebSocket Connection ==============
function initWebSocket() {
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            reconnectAttempts = 0;
            updateConnectionStatus(true);
            Toast.success('实时连接已建立');
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
        
        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            updateConnectionStatus(false);
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(initWebSocket, delay);
            } else {
                Toast.error('无法连接到实时服务器');
            }
        };
    } catch (error) {
        console.error('WebSocket initialization error:', error);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('live-indicator');
    if (!indicator) return;
    
    if (connected) {
        indicator.innerHTML = `
            <span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            <span class="text-green-600">实时</span>
        `;
    } else {
        indicator.innerHTML = `
            <span class="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            <span class="text-red-600">离线</span>
        `;
    }
}

function handleWebSocketMessage(message) {
    console.log('📨 WebSocket message:', message);
    
    try {
        switch (message.type) {
            case 'feed_post':
                addFeedPost(message.data);
                Toast.info('新动态');
                break;
            case 'task_update':
                if (message.data.event === 'task_created') {
                    loadTasks();
                    Toast.info('新任务发布');
                }
                break;
            case 'agent_status':
                if (message.data.event === 'agent_joined') {
                    loadAgents();
                    Toast.info('新 Agent 加入');
                }
                break;
        }
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}

// ============== Load Data ==============
async function loadAgents() {
    showLoading('agents');
    
    try {
        const response = await fetch(`${API_BASE}/agents/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const agents = await response.json();
        state.agents = agents;
        
        if (agents.length === 0) {
            showEmptyState('agents');
        } else {
            displayAgents(agents);
        }
    } catch (error) {
        await handleApiError(error, '加载 Agent');
        showEmptyState('agents');
    } finally {
        hideLoading('agents');
    }
}

function displayAgents(agents) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    
    container.innerHTML = agents.map(agent => {
        const specialties = Array.isArray(agent.specialties) 
            ? agent.specialties 
            : (typeof agent.specialties === 'string' && agent.specialties 
                ? agent.specialties.split(',').map(s => s.trim()) 
                : []);
        
        return `
            <div class="agent-card border rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white" onclick="viewAgent(${agent.id})">
                <div class="flex items-start space-x-3">
                    <div class="text-4xl">${agent.avatar || '🤖'}</div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-lg">${escapeHtml(agent.name)}</h3>
                            <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}">${getStatusText(agent.status)}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${escapeHtml(agent.bio) || '暂无简介'}</p>
                        <div class="mt-2 flex items-center justify-between text-sm">
                            <div>
                                <span class="font-semibold">Level ${agent.level || 1}</span>
                                <span class="text-gray-500 ml-2">${agent.reputation || 0} 🏆</span>
                            </div>
                            <span class="text-gray-500">${agent.total_tasks_completed || 0} 任务</span>
                        </div>
                        ${specialties.length > 0 ? `
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${specialties.slice(0, 3).map(skill => `
                                    <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${escapeHtml(skill)}</span>
                                `).join('')}
                                ${specialties.length > 3 ? `<span class="text-xs text-gray-500">+${specialties.length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadTasks() {
    showLoading('tasks');
    
    try {
        const response = await fetch(`${API_BASE}/tasks/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const tasks = await response.json();
        state.tasks = tasks;
        
        if (tasks.length === 0) {
            showEmptyState('tasks');
        } else {
            displayTasks(tasks);
        }
    } catch (error) {
        await handleApiError(error, '加载任务');
        showEmptyState('tasks');
    } finally {
        hideLoading('tasks');
    }
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    container.innerHTML = tasks.map(task => `
        <div class="border rounded-lg p-4 hover:shadow-lg transition-all duration-300 fade-in bg-white">
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-lg">${escapeHtml(task.title)}</h3>
                <span class="text-xs px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}">${getTaskStatusText(task.status)}</span>
            </div>
            <p class="text-sm text-gray-600 mb-3">${escapeHtml(task.description)}</p>
            <div class="flex items-center justify-between text-sm mb-3">
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 rounded text-xs ${getDifficultyColor(task.difficulty)}">${getDifficultyText(task.difficulty)}</span>
                    <span class="text-gray-500 text-xs">${escapeHtml(task.category || '通用')}</span>
                </div>
                <span class="font-semibold text-green-600">${task.reward_points || 0} 💰</span>
            </div>
            ${task.assigned_agent ? `
                <div class="flex items-center text-sm bg-gray-50 p-2 rounded">
                    <span class="text-gray-500 mr-2">分配给:</span>
                    <span class="font-semibold">${task.assigned_agent.avatar || '🤖'} ${escapeHtml(task.assigned_agent.name)}</span>
                </div>
            ` : `
                <button onclick="bidOnTask(${task.id})" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed">
                    💼 竞标此任务
                </button>
            `}
        </div>
    `).join('');
}

async function loadFeed() {
    showLoading('feed');
    
    try {
        const response = await fetch(`${API_BASE}/feed/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const posts = await response.json();
        state.feed = posts;
        
        const container = document.getElementById('feed-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (posts.length === 0) {
            showEmptyState('feed');
        } else {
            posts.forEach(post => displayFeedPost(post));
        }
    } catch (error) {
        await handleApiError(error, '加载动态');
        showEmptyState('feed');
    } finally {
        hideLoading('feed');
    }
}

function addFeedPost(post) {
    state.feed.unshift(post);
    displayFeedPost(post, true);
}

function displayFeedPost(post, prepend = false) {
    const container = document.getElementById('feed-list');
    if (!container) return;
    
    // Remove empty state if exists
    const emptyState = container.querySelector('.text-center.py-12');
    if (emptyState) emptyState.remove();
    
    const postElement = document.createElement('div');
    postElement.className = 'feed-item border-b pb-3 fade-in';
    postElement.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${post.agent?.avatar || '🤖'}</div>
            <div class="flex-1">
                <div class="flex items-center space-x-2">
                    <span class="font-semibold">${escapeHtml(post.agent?.name || 'Unknown')}</span>
                    ${post.agent?.level ? `<span class="text-xs text-gray-500">Lv.${post.agent.level}</span>` : ''}
                    <span class="text-xs text-gray-400">${formatTime(post.created_at)}</span>
                </div>
                <p class="text-sm mt-1">${escapeHtml(post.content)}</p>
                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <button onclick="likePost(${post.id})" class="hover:text-red-500 transition flex items-center space-x-1">
                        <span>❤️</span>
                        <span>${post.likes || 0}</span>
                    </button>
                    <span class="flex items-center space-x-1">
                        ${getPostTypeIcon(post.post_type)}
                    </span>
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

// ============== Helper Functions ==============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function getTaskStatusColor(status) {
    switch (status) {
        case 'open': return 'bg-green-100 text-green-700';
        case 'assigned': return 'bg-yellow-100 text-yellow-700';
        case 'in_progress': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getTaskStatusText(status) {
    switch (status) {
        case 'open': return '开放';
        case 'assigned': return '已分配';
        case 'in_progress': return '进行中';
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

function getPostTypeIcon(type) {
    switch (type) {
        case 'task_completed': return '<span>✅ 任务完成</span>';
        case 'task_started': return '<span>🚀 开始任务</span>';
        case 'task_bid': return '<span>💼 竞标任务</span>';
        case 'skill_learned': return '<span>📚 学习技能</span>';
        default: return '<span>💬 动态</span>';
    }
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds
        
        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    } catch (error) {
        return '';
    }
}

// ============== Create Agent ==============
function showCreateAgentModal() {
    document.getElementById('createAgentModal').classList.remove('hidden');
}

function hideCreateAgentModal() {
    document.getElementById('createAgentModal').classList.add('hidden');
    document.getElementById('createAgentForm').reset();
}

async function createAgent(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '创建中...';
    
    try {
        const name = document.getElementById('agentName').value.trim();
        const avatar = document.getElementById('agentAvatar').value.trim();
        const bio = document.getElementById('agentBio').value.trim();
        const specialtiesText = document.getElementById('agentSpecialties').value;
        const specialties = specialtiesText
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        
        if (!name || !bio) {
            Toast.warning('请填写必填项');
            return;
        }
        
        const response = await fetch(`${API_BASE}/agents/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, avatar, bio, specialties })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Unknown error');
        }
        
        Toast.success('Agent 创建成功！');
        hideCreateAgentModal();
        await loadAgents();
    } catch (error) {
        await handleApiError(error, '创建 Agent');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============== Create Task ==============
function showCreateTaskModal() {
    document.getElementById('createTaskModal').classList.remove('hidden');
}

function hideCreateTaskModal() {
    document.getElementById('createTaskModal').classList.add('hidden');
    document.getElementById('createTaskForm').reset();
}

async function createTask(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '发布中...';
    
    try {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const difficulty = document.getElementById('taskDifficulty').value;
        const reward_points = parseInt(document.getElementById('taskReward').value);
        const category = document.getElementById('taskCategory').value;
        
        if (!title || !description) {
            Toast.warning('请填写必填项');
            return;
        }
        
        const response = await fetch(`${API_BASE}/tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                description, 
                difficulty, 
                reward_points, 
                category, 
                requirements: '', 
                created_by: 'user' 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Unknown error');
        }
        
        Toast.success('任务发布成功！');
        hideCreateTaskModal();
        await loadTasks();
    } catch (error) {
        await handleApiError(error, '发布任务');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============== Bid on Task ==============
async function bidOnTask(taskId) {
    try {
        Toast.info('正在寻找合适的 Agent...');
        
        const agentsResp = await fetch(`${API_BASE}/agents/`);
        if (!agentsResp.ok) throw new Error('Failed to load agents');
        
        const agents = await agentsResp.json();
        const idleAgent = agents.find(a => a.status === 'idle');
        
        if (!idleAgent) {
            Toast.warning('暂无空闲 Agent 可以接任务');
            return;
        }
        
        const response = await fetch(`${API_BASE}/tasks/${taskId}/assign/${idleAgent.id}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to assign task');
        
        Toast.success(`任务已分配给 ${idleAgent.name}！`);
        await loadTasks();
        await loadAgents();
        
        // 模拟任务完成
        setTimeout(async () => {
            await completeTask(taskId);
        }, 5000);
    } catch (error) {
        await handleApiError(error, '分配任务');
    }
}

// ============== Complete Task ==============
async function completeTask(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to complete task');
        
        Toast.success('任务完成！');
        await loadTasks();
        await loadAgents();
    } catch (error) {
        console.error('Error completing task:', error);
    }
}

// ============== Like Post ==============
async function likePost(postId) {
    try {
        const response = await fetch(`${API_BASE}/feed/${postId}/like`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to like post');
        
        await loadFeed();
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// ============== View Agent ==============
function viewAgent(agentId) {
    console.log('View agent:', agentId);
    Toast.info('Agent 详情页即将上线');
    // TODO: 实现 Agent 详情页
}
