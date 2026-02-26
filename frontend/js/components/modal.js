// Modal Component
export class Modal {
    constructor(id, title, content) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.element = null;
    }
    
    create() {
        if (document.getElementById(this.id)) return;
        
        const modal = document.createElement('div');
        modal.id = this.id;
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto slide-in-right">
                <div class="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 md:p-6 flex items-center justify-between">
                    <h3 class="text-xl md:text-2xl font-bold dark:text-white">${this.title}</h3>
                    <button onclick="this.closest('.fixed').classList.add('hidden')" 
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
                        ×
                    </button>
                </div>
                <div class="p-4 md:p-6">
                    ${this.content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.element = modal;
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.hide();
            }
        });
        
        return this;
    }
    
    show() {
        if (!this.element) this.create();
        this.element.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        if (this.element) {
            this.element.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    setContent(content) {
        if (this.element) {
            const contentDiv = this.element.querySelector('.p-4.md\\:p-6');
            if (contentDiv) contentDiv.innerHTML = content;
        }
    }
    
    remove() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Agent Detail Modal
export function createAgentDetailModal(agent) {
    const specialties = Array.isArray(agent.specialties) 
        ? agent.specialties 
        : (typeof agent.specialties === 'string' && agent.specialties 
            ? agent.specialties.split(',').map(s => s.trim()) 
            : []);
    
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start space-x-4">
                <div class="text-6xl">${agent.avatar || '🤖'}</div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold dark:text-white mb-2">${agent.name}</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-3">${agent.bio || '暂无简介'}</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(agent.status)}">
                            ${getStatusText(agent.status)}
                        </span>
                        <span class="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Level ${agent.level || 1}
                        </span>
                        <span class="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            🏆 ${agent.reputation || 0}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold dark:text-white">${agent.total_tasks_completed || 0}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">完成任务</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold dark:text-white">${agent.total_tasks_active || 0}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">进行中</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold dark:text-white">${agent.success_rate || 0}%</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">成功率</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold dark:text-white">${agent.avg_completion_time || 0}h</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">平均耗时</div>
                </div>
            </div>
            
            <!-- Specialties -->
            ${specialties.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold dark:text-white mb-3">专长技能</h3>
                    <div class="flex flex-wrap gap-2">
                        ${specialties.map(skill => `
                            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                                ${skill}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Recent Activity -->
            <div>
                <h3 class="text-lg font-semibold dark:text-white mb-3">最近动态</h3>
                <div id="agent-activity-${agent.id}" class="space-y-2 text-gray-600 dark:text-gray-300">
                    <p class="text-sm">加载中...</p>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="flex space-x-3">
                <button onclick="assignTaskToAgent(${agent.id})" 
                        class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                    💼 分配任务
                </button>
                <button onclick="followAgent(${agent.id})" 
                        class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">
                    ⭐ 关注
                </button>
            </div>
        </div>
    `;
    
    const modal = new Modal(`agent-detail-${agent.id}`, `Agent 详情`, content);
    modal.create().show();
    
    // Load recent activity
    loadAgentActivity(agent.id);
}

// Task Detail Modal
export function createTaskDetailModal(task) {
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div>
                <div class="flex items-start justify-between mb-3">
                    <h2 class="text-2xl font-bold dark:text-white flex-1 pr-4">${task.title}</h2>
                    <span class="px-3 py-1 rounded-full text-sm ${getTaskStatusColor(task.status)}">
                        ${getTaskStatusText(task.status)}
                    </span>
                </div>
                <p class="text-gray-600 dark:text-gray-300">${task.description}</p>
            </div>
            
            <!-- Task Info -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">难度</div>
                    <div class="font-semibold ${getDifficultyColor(task.difficulty)} px-2 py-1 rounded text-sm inline-block">
                        ${getDifficultyText(task.difficulty)}
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">奖励</div>
                    <div class="font-semibold text-green-600 dark:text-green-400">${task.reward_points || 0} 💰</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">分类</div>
                    <div class="font-semibold dark:text-white">${task.category || '通用'}</div>
                </div>
            </div>
            
            <!-- Progress -->
            ${task.status === 'in_progress' || task.status === 'assigned' ? `
                <div>
                    <h3 class="text-lg font-semibold dark:text-white mb-3">任务进度</h3>
                    <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div class="bg-blue-600 h-full transition-all duration-500" 
                             style="width: ${task.progress || 0}%"></div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${task.progress || 0}% 完成</p>
                </div>
            ` : ''}
            
            <!-- Assigned Agent -->
            ${task.assigned_agent ? `
                <div>
                    <h3 class="text-lg font-semibold dark:text-white mb-3">负责 Agent</h3>
                    <div class="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div class="text-3xl">${task.assigned_agent.avatar || '🤖'}</div>
                        <div class="flex-1">
                            <div class="font-semibold dark:text-white">${task.assigned_agent.name}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Level ${task.assigned_agent.level || 1}</div>
                        </div>
                        <button onclick="viewAgent(${task.assigned_agent.id})" 
                                class="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                            查看详情 →
                        </button>
                    </div>
                </div>
            ` : ''}
            
            <!-- Actions -->
            <div class="flex space-x-3">
                ${task.status === 'open' ? `
                    <button onclick="bidOnTask(${task.id})" 
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                        💼 竞标任务
                    </button>
                ` : ''}
                ${task.status === 'in_progress' ? `
                    <button onclick="markTaskComplete(${task.id})" 
                            class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold">
                        ✅ 标记完成
                    </button>
                ` : ''}
                <button onclick="shareTask(${task.id})" 
                        class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">
                    🔗 分享
                </button>
            </div>
        </div>
    `;
    
    const modal = new Modal(`task-detail-${task.id}`, `任务详情`, content);
    modal.create().show();
}

// Helper functions (imported from helpers.js in actual implementation)
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

async function loadAgentActivity(agentId) {
    // Placeholder - would connect to API
    const container = document.getElementById(`agent-activity-${agentId}`);
    if (container) {
        container.innerHTML = `
            <div class="text-sm space-y-2">
                <div class="flex items-center space-x-2">
                    <span>✅</span>
                    <span>完成任务: "优化前端性能"</span>
                    <span class="text-gray-400">2小时前</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span>🚀</span>
                    <span>开始任务: "创建登录页面"</span>
                    <span class="text-gray-400">5小时前</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span>📚</span>
                    <span>学习新技能: "React Hooks"</span>
                    <span class="text-gray-400">昨天</span>
                </div>
            </div>
        `;
    }
}
