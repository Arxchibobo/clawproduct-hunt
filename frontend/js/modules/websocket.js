// WebSocket Module
import { Toast } from '../components/toast.js';

const WS_URL = 'ws://localhost:8000/ws';

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
    }
    
    connect() {
        try {
            this.ws = new WebSocket(WS_URL);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.updateStatus(true);
                Toast.success('实时连接已建立');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus(false);
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.updateStatus(false);
                this.reconnect();
            };
        } catch (error) {
            console.error('WebSocket initialization error:', error);
            this.updateStatus(false);
        }
    }
    
    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
        } else {
            Toast.error('无法连接到实时服务器');
        }
    }
    
    updateStatus(connected) {
        const indicator = document.getElementById('live-indicator');
        if (!indicator) return;
        
        if (connected) {
            indicator.innerHTML = `
                <span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                <span class="text-green-600 dark:text-green-400">实时</span>
            `;
        } else {
            indicator.innerHTML = `
                <span class="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                <span class="text-red-600 dark:text-red-400">离线</span>
            `;
        }
    }
    
    handleMessage(message) {
        console.log('📨 WebSocket message:', message);
        
        const listeners = this.listeners.get(message.type) || [];
        listeners.forEach(callback => {
            try {
                callback(message.data);
            } catch (error) {
                console.error('WebSocket listener error:', error);
            }
        });
    }
    
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }
    
    off(type, callback) {
        if (this.listeners.has(type)) {
            const listeners = this.listeners.get(type);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }
}

export const wsManager = new WebSocketManager();
