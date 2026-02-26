// Enhanced App.js - Main Application Entry Point
import { state, setState } from './modules/state.js';
import { api } from './modules/api.js';
import { wsManager } from './modules/websocket.js';
import { initTheme, createThemeToggle } from './modules/theme.js';
import { Toast } from './components/toast.js';
import { createAgentDetailModal, createTaskDetailModal } from './components/modal.js';
import { 
    escapeHtml, 
    formatTime, 
    debounce, 
    lazyLoadImages, 
    setupInfiniteScroll,
    getStatusColor,
    getStatusText,
    getTaskStatusColor,
    getTaskStatusText,
    getDifficultyColor,
    getDifficultyText,
    getPostTypeIcon,
    setupSwipeGesture
} from './utils/helpers.js';
import { createSearchBar, createFilterBar, applyFilters } from './modules/search.js';

// Make functions globally accessible for onclick handlers
window.viewAgent = viewAgent;
window.bidOnTask = bidOnTask;
window.likePost = likePost;
window.showCreateAgentModal = showCreateAgentModal;
window.hideCreateAgentModal = hideCreateAgentModal;
window.createAgent = createAgent;
window.showCreateTaskModal = showCreateTaskModal;
window.hideCreateTaskModal = hideCreateTaskModal;
window.createTask = createTask;
window.assignTaskToAgent = assignTaskToAgent;
window.followAgent = followAgent;
window.markTaskComplete = markTaskComplete;
window.shareTask = shareTask;

// ============== Initialize App ==============
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    initTheme();
    createThemeToggle();
    initWebSocket();
    initSearch();
    initFilters();
    loadAgents();
    loadTasks();
    loadFeed();
    setupInfiniteScrolls();
    setupMobileGestures();
    setupErrorHandling();
});

// ============== WebSocket ==============
function initWebSocket() {
    wsManager.connect();
    
    // Listen to feed posts
    wsManager.on('feed_post', (data) => {
        addFeedPost(data);
        Toast.info('新动态');
    });
    
    // Listen to task updates
    wsManager.on('task_update', (data) => {
        if (data.event === 'task_created') {
            loadTasks();
            Toast.info('新任务发布');
        }
    });
    
    // Listen to agent status
    wsManager.on('agent_status', (data) => {
        if (data.event === 'agent_joined') {
            loadAgents();
            Toast.info('新 Agent 加入');
        }
    });
}

// ============== Search & Filters ==============
function initSearch() {
    createSearchBar('agents', () => {
        const filtered = applyFilters(state.agents, 'agents');
        displayAgents(filtered);
    });
    
    createSearchBar('tasks', () => {
        const filtered = applyFilters(state.tasks, 'tasks');
        displayTasks(filtered);
    });
}

function initFilters() {
    // Task filters
    createFilterBar('tasks', [
        {
            key: 'status',
            label: '状态',
            options: [
                { value: 'all', label: '全部' },
                { value: 'open', label: '开放' },
                { value: 'assigned', label: '已分配' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' }
            ]
        },
        {
            key: 'difficulty',
            label: '难度',
            options: [
                { value: 'all', label: '全部' },
                { value: 'easy', label: '简单' },
                { value: 'medium', label: '中等' },
                { value: 'hard', label: '困难' }
            ]
        },
        {
            key: 'category',
            label: '分类',
            options: [
                { value: 'all', label: '全部' },
                { value: 'frontend', label: '前端' },
                { value: 'backend', label: '后端' },
                { value: 'testing', label: '测试' },
                { value: 'design', label: '设计' },
                { value: 'data', label: '数据' },
                { value: 'general', label: '通用' }
            ]
        }
    ], () => {
        const filtered = applyFilters(state.tasks, 'tasks');
        displayTasks(filtered);
    });
    
    // Agent filters
    createFilterBar('agents', [
        {
            key: 'status',
            label: '状态',
            options: [
                { value: 'all', label: '全部' },
                { value: 'idle', label: '空闲' },
                { value: 'working', label: '工作中' }
            ]
        }
    ], () => {
        const filtered = applyFilters(state.agents, 'agents');
        displayAgents(filtered);
    });
}

// ============== Infinite Scroll ==============
function setupInfiniteScrolls() {
    const feedContainer = document.getElementById('feed-list');
    setupInfiniteScroll(feedContainer, async () => {
        if (!state.pagination.feed.hasMore) return;
        
        state.pagination.feed.page++;
        await loadMoreFeed();
    });
}

async function loadMoreFeed() {
    try {
        const posts = await api.getFeed(state.pagination.feed.page, 20);
        if (posts.length === 0) {
            state.pagination.feed.hasMore = false;
            return;
        }
        
        posts.forEach(post => displayFeedPost(post));
        lazyLoadImages();
    } catch (error) {
        console.error('Error loading more feed:', error);
    }
}

// ============== Mobile Gestures ==============
function setupMobileGestures() {
    const feedContainer = document.getElementById('feed-list');
    
    setupSwipeGesture(
        feedContainer,
        () => console.log('Swipe left'),
        () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            Toast.info('回到顶部');
        }
    );
}

// ============== Error Handling ==============
function setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        Toast.error('发生了一个错误，请稍后重试');
    });
}

// ============== Loading States ==============
function showLoading(section) {
    state.loading[section] = true;
    const container = document.getElementById(`${section}-list`);
    
    const skeletonCard = `
        <div class="animate-pulse border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div class="flex items-start space-x-3">
                <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        </div>
    `;
    
    if (container) {
        container.innerHTML = Array(3).fill(skeletonCard).join('');
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
                <h3 class="text-lg font-semibold dark:text-white mb-2">还没有 Agent</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">创建第一个 Agent 开始吧！</p>
                <button onclick="showCreateAgentModal()" 
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    + 创建 Agent
                </button>
            </div>
        `,
        tasks: `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📋</div>
                <h3 class="text-lg font-semibold dark:text-white mb-2">还没有任务</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">发布第一个任务吧！</p>
                <button onclick="showCreateTaskModal()" 
                        class="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-500 transition">
                    + 发布任务
                </button>
            </div>
        `,
        feed: `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📡</div>
                <h3 class="text-lg font-semibold dark:text-white mb-2">动态为空</h3>
                <p class="text-gray-500 dark:text-gray-400">当 Agent 开始工作时，这里会显示动态</p>
            </div>
        `
    };
    
    if (container) {
        container.innerHTML = emptyStates[section] || '<div class="text-center text-gray-500 dark:text-gray-400">暂无数据</div>';
    }
}

// ============== Load Data ==============
async function loadAgents() {
    showLoading('agents');
    
    try {
        const agents = await api.getAgents();
        setState('agents', agents);
        
        if (agents.length === 0) {
            showEmptyState('agents');
        } else {
            displayAgents(agents);
        }
    } catch (error) {
        Toast.error('加载 Agent 失败');
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
            <div class="agent-card border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800" 
                 onclick="viewAgent(${agent.id})">
                <div class="flex items-start space-x-3">
                    <div class="text-4xl">${agent.avatar || '🤖'}</div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-lg dark:text-white">${escapeHtml(agent.name)}</h3>
                            <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}">${getStatusText(agent.status)}</span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${escapeHtml(agent.bio) || '暂无简介'}</p>
                        <div class="mt-2 flex items-center justify-between text-sm">
                            <div>
                                <span class="font-semibold dark:text-white">Level ${agent.level || 1}</span>
                                <span class="text-gray-500 dark:text-gray-400 ml-2">${agent.reputation || 0} 🏆</span>
                            </div>
                            <span class="text-gray-500 dark:text-gray-400">${agent.total_tasks_completed || 0} 任务</span>
                        </div>
                        ${specialties.length > 0 ? `
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${specialties.slice(0, 3).map(skill => `
                                    <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">${escapeHtml(skill)}</span>
                                `).join('')}
                                ${specialties.length > 3 ? `<span class="text-xs text-gray-500 dark:text-gray-400">+${specialties.length - 3}</span>` : ''}
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
        const tasks = await api.getTasks();
        setState('tasks', tasks);
        
        if (tasks.length === 0) {
            showEmptyState('tasks');
        } else {
            displayTasks(tasks);
        }
    } catch (error) {
        Toast.error('加载任务失败');
        showEmptyState('tasks');
    } finally {
        hideLoading('tasks');
    }
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 fade-in bg-white dark:bg-gray-800 cursor-pointer"
             onclick="window.createTaskDetailModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">
            <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-lg dark:text-white">${escapeHtml(task.title)}</h3>
                <span class="text-xs px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}">${getTaskStatusText(task.status)}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">${escapeHtml(task.description)}</p>
            <div class="flex items-center justify-between text-sm mb-3">
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 rounded text-xs ${getDifficultyColor(task.difficulty)}">${getDifficultyText(task.difficulty)}</span>
                    <span class="text-gray-500 dark:text-gray-400 text-xs">${escapeHtml(task.category || '通用')}</span>
                </div>
                <span class="font-semibold text-green-600 dark:text-green-400">${task.reward_points || 0} 💰</span>
            </div>
            ${task.assigned_agent ? `
                <div class="flex items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span class="text-gray-500 dark:text-gray-400 mr-2">分配给:</span>
                    <span class="font-semibold dark:text-white">${task.assigned_agent.avatar || '🤖'} ${escapeHtml(task.assigned_agent.name)}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function loadFeed() {
    showLoading('feed');
    
    try {
        const posts = await api.getFeed(0, 20);
        setState('feed', posts);
        
        const container = document.getElementById('feed-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (posts.length === 0) {
            showEmptyState('feed');
        } else {
            posts.forEach(post => displayFeedPost(post));
            lazyLoadImages();
        }
    } catch (error) {
        Toast.error('加载动态失败');
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
    
    const emptyState = container.querySelector('.text-center.py-12');
    if (emptyState) emptyState.remove();
    
    const postElement = document.createElement('div');
    postElement.className = 'feed-item border-b dark:border-gray-700 pb-3 fade-in';
    postElement.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${post.agent?.avatar || '🤖'}</div>
            <div class="flex-1">
                <div class="flex items-center space-x-2">
                    <span class="font-semibold dark:text-white">${escapeHtml(post.agent?.name || 'Unknown')}</span>
                    ${post.agent?.level ? `<span class="text-xs text-gray-500 dark:text-gray-400">Lv.${post.agent.level}</span>` : ''}
                    <span class="text-xs text-gray-400 dark:text-gray-500">${formatTime(post.created_at)}</span>
                </div>
                <p class="text-sm dark:text-gray-300 mt-1">${escapeHtml(post.content)}</p>
                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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

// ============== Modal Functions ==============
function viewAgent(agentId) {
    const agent = state.agents.find(a => a.id === agentId);
    if (agent) {
        createAgentDetailModal(agent);
    }
}

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
        
        await api.createAgent({ name, avatar, bio, specialties });
        
        Toast.success('Agent 创建成功！');
        hideCreateAgentModal();
        await loadAgents();
    } catch (error) {
        Toast.error('创建 Agent 失败');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

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
        
        await api.createTask({ 
            title, 
            description, 
            difficulty, 
            reward_points, 
            category, 
            requirements: '', 
            created_by: 'user' 
        });
        
        Toast.success('任务发布成功！');
        hideCreateTaskModal();
        await loadTasks();
    } catch (error) {
        Toast.error('发布任务失败');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function bidOnTask(taskId) {
    try {
        Toast.info('正在寻找合适的 Agent...');
        
        const agents = await api.getAgents();
        const idleAgent = agents.find(a => a.status === 'idle');
        
        if (!idleAgent) {
            Toast.warning('暂无空闲 Agent 可以接任务');
            return;
        }
        
        await api.assignTask(taskId, idleAgent.id);
        
        Toast.success(`任务已分配给 ${idleAgent.name}！`);
        await loadTasks();
        await loadAgents();
        
        // 模拟任务完成
        setTimeout(async () => {
            await completeTask(taskId);
        }, 5000);
    } catch (error) {
        Toast.error('分配任务失败');
    }
}

async function completeTask(taskId) {
    try {
        await api.completeTask(taskId);
        Toast.success('任务完成！');
        await loadTasks();
        await loadAgents();
    } catch (error) {
        console.error('Error completing task:', error);
    }
}

async function likePost(postId) {
    try {
        await api.likePost(postId);
        await loadFeed();
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// Additional modal actions
function assignTaskToAgent(agentId) {
    Toast.info('功能开发中');
}

function followAgent(agentId) {
    Toast.success('关注成功！');
}

function markTaskComplete(taskId) {
    completeTask(taskId);
}

function shareTask(taskId) {
    const url = `${window.location.origin}?task=${taskId}`;
    navigator.clipboard.writeText(url).then(() => {
        Toast.success('链接已复制到剪贴板');
    });
}

// Make createTaskDetailModal globally accessible
window.createTaskDetailModal = createTaskDetailModal;
