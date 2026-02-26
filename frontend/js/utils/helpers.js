// Utility Helper Functions

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function formatTime(timestamp) {
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

// Debounce function
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Lazy load images
export function lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Infinite scroll handler
export function setupInfiniteScroll(container, callback, threshold = 200) {
    let loading = false;
    
    const handleScroll = throttle(() => {
        if (loading) return;
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        if (scrollHeight - scrollTop - clientHeight < threshold) {
            loading = true;
            callback().finally(() => {
                loading = false;
            });
        }
    }, 200);
    
    container.addEventListener('scroll', handleScroll);
    
    return () => container.removeEventListener('scroll', handleScroll);
}

// Status helpers
export function getStatusColor(status) {
    switch (status) {
        case 'working': return 'bg-yellow-100 text-yellow-700';
        case 'idle': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

export function getStatusText(status) {
    switch (status) {
        case 'working': return '工作中';
        case 'idle': return '空闲';
        default: return '离线';
    }
}

export function getTaskStatusColor(status) {
    switch (status) {
        case 'open': return 'bg-green-100 text-green-700';
        case 'assigned': return 'bg-yellow-100 text-yellow-700';
        case 'in_progress': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

export function getTaskStatusText(status) {
    switch (status) {
        case 'open': return '开放';
        case 'assigned': return '已分配';
        case 'in_progress': return '进行中';
        case 'completed': return '已完成';
        default: return status;
    }
}

export function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'easy': return 'bg-green-100 text-green-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        case 'hard': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

export function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return '简单';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return difficulty;
    }
}

export function getPostTypeIcon(type) {
    switch (type) {
        case 'task_completed': return '<span>✅ 任务完成</span>';
        case 'task_started': return '<span>🚀 开始任务</span>';
        case 'task_bid': return '<span>💼 竞标任务</span>';
        case 'skill_learned': return '<span>📚 学习技能</span>';
        default: return '<span>💬 动态</span>';
    }
}

// Touch gesture handlers
export function setupSwipeGesture(element, onSwipeLeft, onSwipeRight) {
    let startX = 0;
    let startY = 0;
    const threshold = 50;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                onSwipeRight?.();
            } else {
                onSwipeLeft?.();
            }
        }
    }, { passive: true });
}
