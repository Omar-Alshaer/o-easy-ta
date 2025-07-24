/**
 * Attendance Page JavaScript
 * Handles attendance records display and statistics
 */

class AttendancePage {
    constructor() {
        this.studentData = null;
        this.attendanceData = [];
        this.init();
    }

    async init() {
        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });

        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Load attendance data
        await this.loadAttendanceData();
        this.displayStatistics();
        this.displayAttendanceTable();

        // Show welcome message
        this.showWelcomeMessage();
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

    async loadAttendanceData() {
        try {
            const response = await fetch(`/api/attendance?studentId=${this.studentData.student_id}`);
            const result = await response.json();

            if (result.success && result.data) {
                this.attendanceData = result.data.records;
                this.attendanceStats = result.data.statistics;
            } else {
                this.attendanceData = [];
                this.attendanceStats = { total: 0, present: 0, absent: 0, percentage: 0 };
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
            this.attendanceData = [];
            this.attendanceStats = { total: 0, present: 0, absent: 0, percentage: 0 };
        }
    }

    generateAttendanceData(studentData) {
        // If we have real attendance data from database, use it
        if (studentData.attendance && studentData.attendance.records) {
            return studentData.attendance.records;
        }

        // Otherwise generate sample data based on student info
        return this.generateSampleData();
    }

    generateSampleData() {
        const sessions = [];
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 2 months ago

        for (let i = 0; i < 24; i++) {
            const sessionDate = new Date(startDate);
            sessionDate.setDate(startDate.getDate() + (i * 3)); // Every 3 days

            if (sessionDate > today) break;

            const isPresent = Math.random() > 0.2; // 80% attendance rate
            
            sessions.push({
                date: sessionDate.toISOString().split('T')[0],
                day: this.getDayName(sessionDate.getDay()),
                time: '16:00 - 18:00',
                subject: 'الرياضيات',
                status: isPresent ? 'present' : 'absent',
                notes: isPresent ? '' : (Math.random() > 0.5 ? 'غياب بعذر' : 'غياب بدون عذر')
            });
        }

        return sessions.reverse(); // Most recent first
    }

    getDayName(dayIndex) {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[dayIndex];
    }

    displayStatistics() {
        // Use real statistics from API
        const stats = this.attendanceStats || { total: 0, present: 0, absent: 0, percentage: 0 };

        // Update statistics cards
        document.getElementById('presentCount').textContent = stats.present;
        document.getElementById('absentCount').textContent = stats.absent;
        document.getElementById('totalSessions').textContent = stats.total;
        document.getElementById('attendancePercentage').textContent = `${stats.percentage}%`;

        // Add color coding based on percentage
        const percentageCard = document.querySelector('.stat-card.percentage');
        if (stats.percentage >= 90) {
            percentageCard.querySelector('.icon').style.background = 'var(--success-color)';
        } else if (stats.percentage >= 75) {
            percentageCard.querySelector('.icon').style.background = 'var(--warning-color)';
        } else {
            percentageCard.querySelector('.icon').style.background = 'var(--danger-color)';
        }
    }

    displayAttendanceTable() {
        const container = document.getElementById('attendanceTableContainer');
        
        if (this.attendanceData.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد بيانات حضور</h5>
                    <p class="text-muted">لم يتم تسجيل أي حصص حتى الآن</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>اليوم</th>
                            <th>الوقت</th>
                            <th>المجموعة الأساسية</th>
                            <th>مجموعة الحضور</th>
                            <th>نوع الحضور</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.attendanceData.map(session => `
                            <tr>
                                <td>${this.formatDate(session.date)}</td>
                                <td>${session.day}</td>
                                <td>${session.time}</td>
                                <td>
                                    <span class="badge bg-info text-white">
                                        <i class="fas fa-users me-1"></i>
                                        ${session.studentGroup}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${session.attendanceType === 'تعويض' ? 'bg-warning text-dark' : 'bg-success text-white'}">
                                        <i class="fas fa-${session.attendanceType === 'تعويض' ? 'exchange-alt' : 'user-check'} me-1"></i>
                                        ${session.attendedGroup}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${session.attendanceType === 'تعويض' ? 'bg-warning text-dark' : 'bg-primary text-white'}">
                                        <i class="fas fa-${session.attendanceType === 'تعويض' ? 'exchange-alt' : 'calendar-check'} me-1"></i>
                                        ${session.attendanceType}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-badge ${session.status === 'present' ? 'status-present' : 'status-absent'}">
                                        <i class="fas fa-${session.status === 'present' ? 'check' : 'times'} me-1"></i>
                                        ${session.status === 'present' ? 'حاضر' : 'غائب'}
                                    </span>
                                </td>
                                <td>
                                    ${session.notes || '-'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showWelcomeMessage() {
        if (!this.studentData || !window.toast) return;

        const studentName = this.studentData.full_name;

        // Show welcome toast after a short delay
        setTimeout(() => {
            window.toast.info(`مرحباً ${studentName}! 📅`, 'سجل الحضور');
        }, 800);

        // Show attendance info
        setTimeout(() => {
            const totalDays = this.attendanceData.length;
            const presentDays = this.attendanceData.filter(record => record.status === 'present').length;
            const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            if (attendanceRate >= 90) {
                window.toast.success(`معدل حضورك ممتاز: ${attendanceRate}%! 🌟`, 'إحصائيات الحضور');
            } else if (attendanceRate >= 75) {
                window.toast.info(`معدل حضورك جيد: ${attendanceRate}%`, 'إحصائيات الحضور');
            } else {
                window.toast.warning(`معدل حضورك: ${attendanceRate}% - يحتاج تحسين`, 'إحصائيات الحضور');
            }
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttendancePage();
});
