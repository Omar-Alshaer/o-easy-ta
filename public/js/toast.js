/**
 * Toast Notification System
 * Clean and modern notification system for O-EASY-TA
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    createContainer() {
        if (document.querySelector('.toast-container')) {
            this.container = document.querySelector('.toast-container');
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    addStyles() {
        if (document.querySelector('#toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
            }

            .toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px 20px;
                min-width: 300px;
                max-width: 400px;
                pointer-events: auto;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid #3b82f6;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: 'Segoe UI', 'Cairo', Tahoma, Geneva, Verdana, sans-serif;
            }

            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.success {
                border-left-color: #10b981;
            }

            .toast.warning {
                border-left-color: #f59e0b;
            }

            .toast.error {
                border-left-color: #ef4444;
            }

            .toast.info {
                border-left-color: #06b6d4;
            }

            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .toast.success .toast-icon {
                color: #10b981;
            }

            .toast.warning .toast-icon {
                color: #f59e0b;
            }

            .toast.error .toast-icon {
                color: #ef4444;
            }

            .toast.info .toast-icon {
                color: #06b6d4;
            }

            .toast-content {
                flex: 1;
            }

            .toast-title {
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 4px 0;
                font-size: 14px;
            }

            .toast-message {
                color: #64748b;
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
            }

            .toast-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: #f1f5f9;
                color: #475569;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #06b6d4);
                border-radius: 0 0 12px 12px;
                transition: width linear;
            }

            .toast.success .toast-progress {
                background: linear-gradient(90deg, #10b981, #059669);
            }

            .toast.warning .toast-progress {
                background: linear-gradient(90deg, #f59e0b, #d97706);
            }

            .toast.error .toast-progress {
                background: linear-gradient(90deg, #ef4444, #dc2626);
            }

            @media (max-width: 480px) {
                .toast-container {
                    right: 10px;
                    left: 10px;
                    top: 10px;
                }

                .toast {
                    min-width: auto;
                    max-width: none;
                    transform: translateY(-100px);
                }

                .toast.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    show(message, type = 'info', title = '', duration = 5000) {
        const toast = this.createToast(message, type, title, duration);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transitionDuration = duration + 'ms';
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 10);
            }

            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type, title, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        };

        const titles = {
            success: title || 'نجح',
            warning: title || 'تحذير',
            error: title || 'خطأ',
            info: title || 'معلومات'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="window.toast.remove(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        return toast;
    }

    remove(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, title = '', duration = 5000) {
        return this.show(message, 'success', title, duration);
    }

    warning(message, title = '', duration = 5000) {
        return this.show(message, 'warning', title, duration);
    }

    error(message, title = '', duration = 5000) {
        return this.show(message, 'error', title, duration);
    }

    info(message, title = '', duration = 5000) {
        return this.show(message, 'info', title, duration);
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

// Initialize global toast manager
window.toast = new ToastManager();
console.log('✅ Toast system loaded and ready!');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}
