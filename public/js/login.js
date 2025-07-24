/**
 * O-EASY-TA Student Portal - Login System
 * Handles student authentication and validation
 */

class LoginSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.loginButton = this.form.querySelector('.btn-login');
        this.loginText = this.loginButton.querySelector('.login-text');
        this.loadingText = this.loginButton.querySelector('.loading');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupValidation();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
                this.hideError();
            });

            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });

        // Phone number formatting removed - no formatting to avoid issues
    }

    setupValidation() {
        // Add custom validation styles
        const style = document.createElement('style');
        style.textContent = `
            .form-control.is-valid {
                border-color: #28a745;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='m2.3 6.73.94-.94 1.38 1.38 3.72-3.72.94.94-4.66 4.66z'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: left calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            
            .form-control.is-invalid {
                border-color: #dc3545;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 4.6 1.4 1.4 1.4-1.4M8.6 7.4l-1.4-1.4-1.4 1.4'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: left calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
        `;
        document.head.appendChild(style);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Remove previous validation classes
        field.classList.remove('is-valid', 'is-invalid');

        switch (field.id) {
            case 'studentId':
                isValid = this.validateStudentId(value);
                break;
            case 'phoneNumber':
                isValid = this.validatePhoneNumber(value);
                break;
            case 'classLevel':
                isValid = value !== '';
                break;
        }

        // Add validation class
        if (value !== '') {
            field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        }

        return isValid;
    }

    validateStudentId(studentId) {
        // Student ID should be 7 digits (e.g., 2530001)
        const pattern = /^\d{7}$/;
        return pattern.test(studentId);
    }

    validatePhoneNumber(phone) {
        // Simple phone number validation - just check if not empty
        return phone.trim().length > 0;
    }

    // formatPhoneNumber removed - no formatting to avoid issues

    async handleLogin() {
        // Validate all fields
        const studentId = document.getElementById('studentId').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const classLevel = document.getElementById('classLevel').value;

        if (!this.validateForm()) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Send login request
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: studentId,
                    phoneNumber: phoneNumber,
                    classLevel: classLevel
                })
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📋 Response data:', result);

            if (result.success) {
                // Store session data
                sessionStorage.setItem('studentData', JSON.stringify(result.student));

                // Show success animation
                this.showSuccessAnimation();

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                const errorMsg = result.error || result.message || 'فشل في تسجيل الدخول. يرجى التحقق من البيانات.';
                this.showError(errorMsg);
                if (window.toast) {
                    window.toast.error(errorMsg, 'فشل تسجيل الدخول');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm() {
        const fields = ['studentId', 'phoneNumber', 'classLevel'];
        let isValid = true;

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showError('يرجى التحقق من صحة البيانات المدخلة.');
        }

        return isValid;
    }

    setLoadingState(loading) {
        if (loading) {
            this.loginText.style.display = 'none';
            this.loadingText.style.display = 'inline-flex';
            this.loginButton.disabled = true;
        } else {
            this.loginText.style.display = 'inline-flex';
            this.loadingText.style.display = 'none';
            this.loginButton.disabled = false;
        }
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showSuccessAnimation() {
        // Change button to success state
        this.loginButton.innerHTML = `
            <i class="fas fa-check me-2"></i>
            تم تسجيل الدخول بنجاح
        `;
        this.loginButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        // Add success animation
        this.loginButton.style.animation = 'pulse 0.5s ease-in-out';
    }
}

// Utility functions
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;

    // Add toast styles
    const style = document.createElement('style');
    style.textContent = `
        .toast-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .toast-success { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
        .toast-error { background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); }
        .toast-info { background: linear-gradient(135deg, #17a2b8 0%, #3498db 100%); }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
