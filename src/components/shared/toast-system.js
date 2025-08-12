/**
 * TrevID Toast Notification System
 * Provides consistent toast notifications across the app
 */

class TrevIDToast {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultOptions = {
            type: 'info',
            duration: 4000,
            position: 'top-right',
            closable: true,
            persistent: false,
            action: null
        };
        
        this.init();
    }

    init() {
        this.createContainer();
        this.setupStyles();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'trevid-toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(this.container);
    }

    setupStyles() {
        if (document.getElementById('trevid-toast-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'trevid-toast-styles';
        styles.textContent = this.getStyles();
        document.head.appendChild(styles);
    }

    show(message, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const id = this.generateId();
        
        const toast = this.createToast(id, message, config);
        this.toasts.set(id, { element: toast, config });
        
        this.container.appendChild(toast);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.classList.add('trevid-toast--show');
        });
        
        // Auto-dismiss if not persistent
        if (!config.persistent && config.duration > 0) {
            setTimeout(() => this.hide(id), config.duration);
        }
        
        return id;
    }

    createToast(id, message, config) {
        const toast = document.createElement('div');
        toast.className = `trevid-toast trevid-toast--${config.type}`;
        toast.setAttribute('data-toast-id', id);
        toast.setAttribute('role', 'alert');
        
        const icon = this.getIcon(config.type);
        const closeButton = config.closable ? this.createCloseButton(id) : '';
        const actionButton = config.action ? this.createActionButton(config.action, id) : '';
        
        toast.innerHTML = `
            <div class="trevid-toast__content">
                <div class="trevid-toast__icon">${icon}</div>
                <div class="trevid-toast__message">${message}</div>
                ${actionButton}
                ${closeButton}
            </div>
            ${config.duration > 0 && !config.persistent ? this.createProgressBar(config.duration) : ''}
        `;
        
        return toast;
    }

    createCloseButton(id) {
        return `
            <button class="trevid-toast__close" onclick="window.trevIDToast.hide('${id}')" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
    }

    createActionButton(action, id) {
        return `
            <button class="trevid-toast__action" onclick="window.trevIDToast.handleAction('${id}', '${action.handler}')">
                ${action.label}
            </button>
        `;
    }

    createProgressBar(duration) {
        return `
            <div class="trevid-toast__progress">
                <div class="trevid-toast__progress-bar" style="animation-duration: ${duration}ms;"></div>
            </div>
        `;
    }

    hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;
        
        toast.element.classList.add('trevid-toast--hide');
        
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(id);
        }, 300);
    }

    hideAll() {
        this.toasts.forEach((_, id) => this.hide(id));
    }

    handleAction(id, handler) {
        if (typeof window[handler] === 'function') {
            window[handler]();
        }
        this.hide(id);
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error', duration: 6000 });
    }

    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning', duration: 5000 });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    loading(message, options = {}) {
        return this.show(message, { ...options, type: 'loading', persistent: true, closable: false });
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            loading: '<i class="fas fa-spinner fa-spin"></i>'
        };
        return icons[type] || icons.info;
    }

    generateId() {
        return 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getStyles() {
        return `
            .trevid-toast-container {
                position: fixed;
                top: var(--space-4);
                right: var(--space-4);
                z-index: var(--z-toast);
                display: flex;
                flex-direction: column;
                gap: var(--space-2);
                max-width: 400px;
                pointer-events: none;
            }
            
            .trevid-toast {
                background: var(--neutral-0);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg);
                border: 1px solid var(--neutral-200);
                overflow: hidden;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                position: relative;
            }
            
            .trevid-toast--show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .trevid-toast--hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .trevid-toast__content {
                display: flex;
                align-items: flex-start;
                gap: var(--space-3);
                padding: var(--space-4);
            }
            
            .trevid-toast__icon {
                flex-shrink: 0;
                font-size: 1.25rem;
                margin-top: 2px;
            }
            
            .trevid-toast__message {
                flex: 1;
                font-size: var(--text-sm);
                line-height: var(--leading-normal);
                color: var(--neutral-700);
            }
            
            .trevid-toast__close {
                background: none;
                border: none;
                color: var(--neutral-500);
                cursor: pointer;
                padding: var(--space-1);
                border-radius: var(--radius-base);
                transition: var(--transition-default);
                flex-shrink: 0;
            }
            
            .trevid-toast__close:hover {
                background: var(--neutral-100);
                color: var(--neutral-700);
            }
            
            .trevid-toast__action {
                background: none;
                border: none;
                color: var(--primary-500);
                cursor: pointer;
                font-weight: var(--font-medium);
                font-size: var(--text-sm);
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-base);
                transition: var(--transition-default);
                margin-right: var(--space-2);
            }
            
            .trevid-toast__action:hover {
                background: var(--primary-50);
                color: var(--primary-600);
            }
            
            .trevid-toast__progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--neutral-200);
            }
            
            .trevid-toast__progress-bar {
                height: 100%;
                background: var(--primary-500);
                width: 100%;
                transform-origin: left;
                animation: trevid-toast-progress linear forwards;
            }
            
            @keyframes trevid-toast-progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
            
            /* Type-specific styles */
            .trevid-toast--success {
                border-left: 4px solid var(--success-500);
            }
            
            .trevid-toast--success .trevid-toast__icon {
                color: var(--success-500);
            }
            
            .trevid-toast--success .trevid-toast__progress-bar {
                background: var(--success-500);
            }
            
            .trevid-toast--error {
                border-left: 4px solid var(--error-500);
            }
            
            .trevid-toast--error .trevid-toast__icon {
                color: var(--error-500);
            }
            
            .trevid-toast--error .trevid-toast__progress-bar {
                background: var(--error-500);
            }
            
            .trevid-toast--warning {
                border-left: 4px solid var(--warning-500);
            }
            
            .trevid-toast--warning .trevid-toast__icon {
                color: var(--warning-500);
            }
            
            .trevid-toast--warning .trevid-toast__progress-bar {
                background: var(--warning-500);
            }
            
            .trevid-toast--info {
                border-left: 4px solid var(--info-500);
            }
            
            .trevid-toast--info .trevid-toast__icon {
                color: var(--info-500);
            }
            
            .trevid-toast--info .trevid-toast__progress-bar {
                background: var(--info-500);
            }
            
            .trevid-toast--loading {
                border-left: 4px solid var(--primary-500);
            }
            
            .trevid-toast--loading .trevid-toast__icon {
                color: var(--primary-500);
            }
            
            /* Mobile responsive */
            @media (max-width: 640px) {
                .trevid-toast-container {
                    top: var(--space-2);
                    right: var(--space-2);
                    left: var(--space-2);
                    max-width: none;
                }
                
                .trevid-toast {
                    transform: translateY(-100%);
                }
                
                .trevid-toast--show {
                    transform: translateY(0);
                }
                
                .trevid-toast--hide {
                    transform: translateY(-100%);
                }
            }
        `;
    }
}

// Initialize global instance
window.trevIDToast = new TrevIDToast();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrevIDToast;
}