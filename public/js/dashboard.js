/**
 * O-EASY-TA Student Portal - Dashboard System
 * Handles dashboard data loading and display
 */

class Dashboard {
    constructor() {
        this.studentData = null;
        this.init();
    }

    async init() {
        // Check if user is logged in
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Load student data
        await this.loadStudentData();
        
        // Initialize dashboard components
        this.updateUserInfo();
        this.loadDashboardStats();
        this.loadRecentActivity();
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
            const response = await fetch(`/api/student-data?studentId=${this.studentData.student_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
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

    updateUserInfo() {
        // Update header info
        document.getElementById('studentName').textContent = this.studentData.full_name || 'الطالب';
        document.getElementById('studentId').textContent = `رقم الطالب: ${this.studentData.student_id}`;
        document.getElementById('studentClass').textContent = `الصف: ${this.studentData.class_level || 'غير محدد'}`;

        // Display group with schedule info
        const groupInfo = this.studentData.group_name || 'غير محدد';
        const scheduleInfo = this.studentData.day_of_week && this.studentData.start_time && this.studentData.end_time
            ? ` (${this.studentData.day_of_week} ${this.studentData.start_time}-${this.studentData.end_time})`
            : '';
        document.getElementById('studentGroup').textContent = `المجموعة: ${groupInfo}${scheduleInfo}`;

        // Update welcome section
        document.getElementById('welcomeName').textContent = this.studentData.full_name || 'الطالب';

        // Update student photo
        const photoElement = document.getElementById('studentPhoto');
        this.updateStudentPhoto(photoElement);
    }

    getImageExtension(photoPath) {
        if (!photoPath) return 'png';
        const extension = photoPath.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif'].includes(extension) ? extension : 'png';
    }

    updateStudentPhoto(photoElement) {
        const studentId = this.studentData.student_id;

        // Try different possible paths for student photo
        const possiblePaths = [
            `/data/students/${studentId}.png`,
            `/data/students/${studentId}.jpg`,
            `/data/students/${studentId}.jpeg`
        ];

        this.tryLoadPhoto(possiblePaths, 0, photoElement);
    }

    tryLoadPhoto(paths, index, photoElement) {
        if (index >= paths.length) {
            // No photo found, keep default
            photoElement.src = 'icons/O-EASY.png';
            return;
        }

        const img = new Image();
        img.onload = () => {
            photoElement.src = paths[index];
        };
        img.onerror = () => {
            // Try next path
            this.tryLoadPhoto(paths, index + 1, photoElement);
        };
        img.src = paths[index];
    }

    async loadDashboardStats() {
        try {
            // Use data from loadStudentData instead of separate API call
            if (this.studentData && this.studentData.stats) {
                this.displayStats(this.studentData.stats);
                return;
            }

            const response = await fetch(`/api/student-data?studentId=${this.studentData.student_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.displayStats(result.data.stats);
            } else {
                this.showDefaultStats();
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showDefaultStats();
        }
    }

    updateStatsCards(stats) {
        // Attendance Rate
        const attendanceRate = stats.attendance_rate || 0;
        document.getElementById('attendanceRate').textContent = `${attendanceRate.toFixed(1)}%`;
        
        const attendanceChange = document.getElementById('attendanceChange');
        if (attendanceRate >= 90) {
            attendanceChange.className = 'stat-change positive';
            attendanceChange.innerHTML = '<i class="fas fa-arrow-up"></i> أداء ممتاز';
        } else if (attendanceRate >= 75) {
            attendanceChange.className = 'stat-change positive';
            attendanceChange.innerHTML = '<i class="fas fa-arrow-up"></i> أداء جيد';
        } else {
            attendanceChange.className = 'stat-change negative';
            attendanceChange.innerHTML = '<i class="fas fa-arrow-down"></i> يحتاج تحسين';
        }

        // Average Grade
        const averageGrade = stats.average_grade || 0;
        document.getElementById('averageGrade').textContent = averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : 'لا توجد درجات';
        
        const gradeChange = document.getElementById('gradeChange');
        if (averageGrade >= 85) {
            gradeChange.className = 'stat-change positive';
            gradeChange.innerHTML = '<i class="fas fa-star"></i> ممتاز';
        } else if (averageGrade >= 70) {
            gradeChange.className = 'stat-change positive';
            gradeChange.innerHTML = '<i class="fas fa-thumbs-up"></i> جيد';
        } else if (averageGrade > 0) {
            gradeChange.className = 'stat-change negative';
            gradeChange.innerHTML = '<i class="fas fa-arrow-up"></i> يحتاج تحسين';
        } else {
            gradeChange.className = 'stat-change';
            gradeChange.innerHTML = '<i class="fas fa-info-circle"></i> لا توجد درجات';
        }

        // Payment Status
        const paymentStatus = stats.payment_status || 'غير محدد';
        const paymentAmount = stats.pending_amount || 0;
        
        if (paymentAmount > 0) {
            document.getElementById('paymentStatus').textContent = `${paymentAmount} ج.م`;
            document.getElementById('paymentChange').innerHTML = '<i class="fas fa-exclamation-triangle"></i> مستحق';
            document.getElementById('paymentChange').className = 'stat-change negative';
        } else {
            document.getElementById('paymentStatus').textContent = 'مكتمل';
            document.getElementById('paymentChange').innerHTML = '<i class="fas fa-check-circle"></i> محدث';
            document.getElementById('paymentChange').className = 'stat-change positive';
        }

        // Class Rank
        const classRank = stats.class_rank || 0;
        if (classRank > 0) {
            document.getElementById('classRank').textContent = `#${classRank}`;
            
            const rankChange = document.getElementById('rankChange');
            if (classRank <= 3) {
                rankChange.className = 'stat-change positive';
                rankChange.innerHTML = '<i class="fas fa-trophy"></i> متفوق';
            } else if (classRank <= 10) {
                rankChange.className = 'stat-change positive';
                rankChange.innerHTML = '<i class="fas fa-star"></i> ممتاز';
            } else {
                rankChange.className = 'stat-change';
                rankChange.innerHTML = '<i class="fas fa-arrow-up"></i> استمر';
            }
        } else {
            document.getElementById('classRank').textContent = '--';
            document.getElementById('rankChange').innerHTML = '<i class="fas fa-info-circle"></i> غير محدد';
        }
    }

    displayStats(stats) {
        if (!stats) {
            this.showDefaultStats();
            return;
        }

        // Update attendance stats
        if (stats.attendance) {
            const attendanceEl = document.getElementById('attendancePercentage') || document.getElementById('attendanceRate');
            if (attendanceEl) attendanceEl.textContent = `${stats.attendance.percentage || 0}%`;

            const totalSessionsEl = document.getElementById('totalSessions');
            if (totalSessionsEl) totalSessionsEl.textContent = stats.attendance.total || 0;
        }

        // Update exam stats
        if (stats.exams) {
            const averageGradeEl = document.getElementById('averageGrade');
            if (averageGradeEl) averageGradeEl.textContent = `${stats.exams.average || 0}%`;

            const totalExamsEl = document.getElementById('totalExams');
            if (totalExamsEl) totalExamsEl.textContent = stats.exams.total || 0;
        }

        // Update payment stats
        if (stats.payments) {
            const paymentStatusEl = document.getElementById('paymentStatus') || document.getElementById('outstandingAmount');
            if (paymentStatusEl) {
                if (stats.payments.outstanding > 0) {
                    paymentStatusEl.textContent = `${stats.payments.outstanding} جنيه متأخر`;
                } else {
                    paymentStatusEl.textContent = 'مدفوع بالكامل';
                }
            }

            const paidMonthsEl = document.getElementById('paidMonths');
            if (paidMonthsEl) paidMonthsEl.textContent = stats.payments.paidMonths || 0;
        }

        // Class rank (placeholder)
        const classRankEl = document.getElementById('classRank');
        if (classRankEl) classRankEl.textContent = '--';
    }

    showDefaultStats() {
        document.getElementById('attendanceRate').textContent = '--';
        document.getElementById('averageGrade').textContent = '--';
        document.getElementById('paymentStatus').textContent = '--';
        document.getElementById('classRank').textContent = '--';
    }

    async loadRecentActivity() {
        try {
            // Use data from loadStudentData instead of separate API call
            if (this.studentData && this.studentData.activities) {
                this.displayRecentActivity(this.studentData.activities);
                return;
            }

            const response = await fetch(`/api/student-data?studentId=${this.studentData.student_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success && result.data.activities && result.data.activities.length > 0) {
                this.displayRecentActivity(result.data.activities);
            } else {
                this.showNoActivity();
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.showNoActivity();
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivities');
        container.innerHTML = '';

        activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            container.appendChild(activityElement);
        });
    }

    createActivityElement(activity) {
        const div = document.createElement('div');
        div.className = 'activity-item';

        const iconClass = this.getActivityIcon(activity.type);
        const iconColor = this.getActivityColor(activity.type);

        div.innerHTML = `
            <div class="activity-icon" style="background: ${iconColor}">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${this.formatActivityTime(activity.date)}</div>
            </div>
        `;

        return div;
    }

    getActivityIcon(type) {
        const icons = {
            'attendance': 'fas fa-calendar-check',
            'grade': 'fas fa-star',
            'payment': 'fas fa-credit-card',
            'exam': 'fas fa-file-alt',
            'default': 'fas fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    getActivityColor(type) {
        const colors = {
            'attendance': 'var(--gradient-success)',
            'grade': 'var(--gradient-info)',
            'payment': 'var(--gradient-warning)',
            'exam': 'var(--gradient-danger)',
            'default': 'var(--gradient-primary)'
        };
        return colors[type] || colors.default;
    }

    formatActivityTime(dateString) {
        if (!dateString) return 'غير محدد';

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'غير محدد';
            }

            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'اليوم';
            } else if (diffDays === 1) {
                return 'أمس';
            } else if (diffDays < 7) {
                return `منذ ${diffDays} أيام`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
            } else {
                return date.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            console.error('Error formatting activity time:', error);
            return 'غير محدد';
        }
    }

    showNoActivity() {
        const container = document.getElementById('recentActivities');
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">لا توجد أنشطة حديثة</p>
            </div>
        `;
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;

    // Add notification styles
    const style = document.createElement('style');
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
        
        .notification-success { background: var(--gradient-success); }
        .notification-error { background: var(--gradient-danger); }
        .notification-info { background: var(--gradient-info); }
        .notification-warning { background: var(--gradient-warning); }
        
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

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click effects to action buttons
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
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
                background: rgba(46, 134, 171, 0.3);
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
});
