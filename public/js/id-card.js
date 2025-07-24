/**
 * O-EASY-TA Student Portal - ID Card System
 * Handles ID card display and download functionality
 */

class IDCardSystem {
    constructor() {
        this.studentData = null;
        this.idCardPath = null;
        this.barcodePath = null;
        this.init();
    }

    async init() {
        // Check if user is logged in
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Load student data and ID card
        await this.loadStudentData();
        this.updateStudentInfo();
        await this.loadIDCard();
        await this.loadBarcode();
    }

    checkAuth() {
        const studentData = sessionStorage.getItem('studentData');
        if (!studentData) {
            return false;
        }
        
        try {
            this.studentData = JSON.parse(studentData);
            return true;
        } catch (error) {
            console.error('Error parsing student data:', error);
            return false;
        }
    }

    async loadStudentData() {
        try {
            const response = await fetch('api/student-data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: this.studentData.student_id
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.studentData = { ...this.studentData, ...result.data };
                sessionStorage.setItem('studentData', JSON.stringify(this.studentData));
            }
        } catch (error) {
            console.error('Error loading student data:', error);
        }
    }

    updateStudentInfo() {
        // Update student information
        document.getElementById('studentName').textContent = this.studentData.full_name || 'غير محدد';
        document.getElementById('studentId').textContent = this.studentData.student_id || '---';
        document.getElementById('classLevel').textContent = this.studentData.class_level || 'غير محدد';
        document.getElementById('phoneNumber').textContent = this.studentData.phone_number || 'غير محدد';
        // Display group with schedule info
        const groupInfo = this.studentData.group_name || 'غير محدد';
        const scheduleInfo = this.studentData.day_of_week && this.studentData.start_time && this.studentData.end_time
            ? ` (${this.studentData.day_of_week} ${this.studentData.start_time}-${this.studentData.end_time})`
            : '';
        document.getElementById('groupName').textContent = groupInfo + scheduleInfo;
        
        // Format and display creation date
        if (this.studentData.created_date) {
            const date = new Date(this.studentData.created_date);
            document.getElementById('createdDate').textContent = date.toLocaleDateString('ar-EG');
        } else {
            document.getElementById('createdDate').textContent = 'غير محدد';
        }
    }

    async loadIDCard() {
        const studentId = this.studentData.student_id;

        // Try different possible paths for ID card
        const possiblePaths = [
            `/data/id_cards/${studentId}_id_card.png`,
            `/data/id_cards/${studentId}.png`,
            `/data/id_cards/id_card_${studentId}.png`
        ];

        let cardFound = false;

        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    this.idCardPath = path;
                    this.displayIDCard();
                    cardFound = true;
                    break;
                }
            } catch (error) {
                console.error(`Error checking path ${path}:`, error);
            }
        }

        if (!cardFound) {
            this.showIDCardError('لم يتم العثور على بطاقة الهوية');
        }
    }

    displayIDCard() {
        const container = document.getElementById('idCardDisplay');
        const loadingPlaceholder = document.getElementById('loadingPlaceholder');
        
        // Create image element
        const img = document.createElement('img');
        img.src = this.idCardPath;
        img.alt = 'بطاقة هوية الطالب';
        img.className = 'id-card-image';
        img.onclick = () => this.viewFullscreen();
        
        // Handle image load
        img.onload = () => {
            loadingPlaceholder.style.display = 'none';
            container.appendChild(img);
            
            // Add fade-in animation
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 100);
        };
        
        // Handle image error
        img.onerror = () => {
            this.showIDCardError('فشل في تحميل بطاقة الهوية');
        };
    }

    showIDCardError(message) {
        const container = document.getElementById('idCardDisplay');
        const loadingPlaceholder = document.getElementById('loadingPlaceholder');
        
        loadingPlaceholder.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <p class="text-muted">${message}</p>
                <button class="btn btn-primary mt-2" onclick="location.reload()">
                    <i class="fas fa-refresh me-2"></i>
                    إعادة المحاولة
                </button>
            </div>
        `;
    }

    async loadBarcode() {
        const studentId = this.studentData.student_id;

        // Try different possible paths for barcode
        const possiblePaths = [
            `/data/barcodes/${studentId}.png`,
            `/data/barcodes/${studentId}.jpg`,
            `/data/barcodes/${studentId}.jpeg`
        ];

        const barcodeImage = document.getElementById('barcodeImage');
        const barcodeLoading = document.getElementById('barcodeLoading');

        let barcodeFound = false;

        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    this.barcodePath = path;
                    barcodeImage.src = path;
                    barcodeImage.onload = () => {
                        barcodeLoading.style.display = 'none';
                        barcodeImage.style.display = 'block';
                    };
                    barcodeFound = true;
                    break;
                }
            } catch (error) {
                console.error(`Error checking barcode path ${path}:`, error);
            }
        }

        if (!barcodeFound) {
            this.showBarcodeError();
        }
    }

    showBarcodeError() {
        const barcodeLoading = document.getElementById('barcodeLoading');
        barcodeLoading.innerHTML = `
            <i class="fas fa-exclamation-triangle text-warning"></i>
            لم يتم العثور على الباركود
        `;
    }

    viewFullscreen() {
        if (!this.idCardPath) {
            this.showNotification('بطاقة الهوية غير متاحة', 'error');
            return;
        }

        const fullscreenImage = document.getElementById('fullscreenImage');
        fullscreenImage.src = this.idCardPath;
        
        const modal = new bootstrap.Modal(document.getElementById('fullscreenModal'));
        modal.show();
    }

    downloadCard() {
        if (!this.idCardPath) {
            this.showNotification('بطاقة الهوية غير متاحة للتحميل', 'error');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = this.idCardPath;
        link.download = `بطاقة_هوية_${this.studentData.student_id}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('تم تحميل بطاقة الهوية بنجاح', 'success');
    }

    printCard() {
        if (!this.idCardPath) {
            this.showNotification('بطاقة الهوية غير متاحة للطباعة', 'error');
            return;
        }

        // Open print dialog
        window.print();
        
        this.showNotification('تم فتح نافذة الطباعة', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: white;
                    font-weight: 500;
                    z-index: 9999;
                    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 4.7s;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    max-width: 400px;
                }
                
                .notification-success { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
                .notification-error { background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); }
                .notification-info { background: linear-gradient(135deg, #17a2b8 0%, #3498db 100%); }
                .notification-warning { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); }
                
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
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Global functions for button clicks
function viewFullscreen() {
    if (window.idCardSystem) {
        window.idCardSystem.viewFullscreen();
    }
}

function downloadCard() {
    if (window.idCardSystem) {
        window.idCardSystem.downloadCard();
    }
}

function printCard() {
    if (window.idCardSystem) {
        window.idCardSystem.printCard();
    }
}

// Initialize ID card system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.idCardSystem = new IDCardSystem();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effect to info items
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click effect to action buttons
    const actionButtons = document.querySelectorAll('.btn-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
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

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + D for download
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            downloadCard();
        }
        
        // Ctrl/Cmd + P for print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printCard();
        }
        
        // F for fullscreen
        if (e.key === 'f' || e.key === 'F') {
            viewFullscreen();
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            const modal = bootstrap.Modal.getInstance(document.getElementById('fullscreenModal'));
            if (modal) {
                modal.hide();
            }
        }
    });
});
