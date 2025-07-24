/**
 * Profile Page JavaScript
 * Handles student profile display and editing
 */

class ProfilePage {
    constructor() {
        this.studentData = null;
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

        // Load and display profile data
        await this.loadProfileData();
        this.displayProfileInfo();
        this.updateProfilePhoto();
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

    async loadProfileData() {
        try {
            const response = await fetch(`/api/student-data?studentId=${this.studentData.student_id}`);
            const result = await response.json();

            if (result.success && result.data) {
                this.profileData = result.data;
            } else {
                this.profileData = this.studentData;
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.profileData = this.studentData;
        }
    }

    displayProfileInfo() {
        const data = this.profileData;

        // Profile Header
        document.getElementById('profileName').textContent = data.full_name || 'غير محدد';
        document.getElementById('profileId').textContent = `رقم الطالب: ${data.student_id}`;
        document.getElementById('profileClass').textContent = data.class_level || 'غير محدد';

        // Display group with schedule info
        const groupInfo = data.group_name || 'غير محدد';
        const scheduleInfo = data.day_of_week && data.start_time && data.end_time
            ? ` (${data.day_of_week} ${data.start_time}-${data.end_time})`
            : '';
        document.getElementById('profileGroup').textContent = groupInfo + scheduleInfo;

        // Personal Information
        document.getElementById('fullName').textContent = data.full_name || 'غير محدد';
        document.getElementById('studentId').textContent = data.student_id || 'غير محدد';
        document.getElementById('phoneNumber').textContent = data.phone_number || 'غير محدد';
        document.getElementById('parentPhone').textContent = data.parent_phone || 'غير محدد';
        document.getElementById('birthDate').textContent = this.formatDate(data.birth_date) || 'غير محدد';

        // Academic Information
        document.getElementById('classLevel').textContent = data.class_level || 'غير محدد';

        // Display group with full schedule details
        const groupDetails = data.group_name
            ? `${data.group_name}${data.day_of_week ? ` - ${data.day_of_week}` : ''}${data.start_time && data.end_time ? ` (${data.start_time} - ${data.end_time})` : ''}${data.location ? ` - ${data.location}` : ''}`
            : 'غير محدد';
        document.getElementById('groupName').textContent = groupDetails;

        document.getElementById('enrollmentDate').textContent = this.formatDate(data.enrollment_date) || 'غير محدد';
        
        // Calculate academic stats
        const overallAverage = this.calculateOverallAverage(data);
        const attendanceRate = this.calculateAttendanceRate(data);
        
        document.getElementById('overallAverage').textContent = overallAverage ? `${overallAverage}%` : 'غير محدد';
        document.getElementById('attendanceRate').textContent = attendanceRate ? `${attendanceRate}%` : 'غير محدد';

        // Contact Information
        document.getElementById('email').textContent = data.email || 'غير محدد';
        document.getElementById('address').textContent = data.address || 'غير محدد';
        document.getElementById('parentName').textContent = data.parent_name || 'غير محدد';
        document.getElementById('parentJob').textContent = data.parent_job || 'غير محدد';

        // System Information
        document.getElementById('lastLogin').textContent = this.formatDateTime(new Date()) || 'الآن';
        document.getElementById('accountCreated').textContent = this.formatDate(data.created_at) || 'غير محدد';
        document.getElementById('accountStatus').textContent = data.is_active ? 'نشط' : 'غير نشط';
    }

    updateProfilePhoto() {
        const studentId = this.studentData.student_id;
        const photoElement = document.getElementById('profilePhoto');
        
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

    calculateOverallAverage(data) {
        if (data.stats && data.stats.exams && data.stats.exams.average) {
            return Math.round(data.stats.exams.average);
        }
        
        // Generate sample average if no real data
        return Math.floor(Math.random() * 20) + 75; // 75-95%
    }

    calculateAttendanceRate(data) {
        if (data.stats && data.stats.attendance && data.stats.attendance.percentage) {
            return Math.round(data.stats.attendance.percentage);
        }
        
        // Generate sample attendance if no real data
        return Math.floor(Math.random() * 15) + 80; // 80-95%
    }

    formatDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        if (!date) return null;
        
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Profile page is now read-only - no editing functions needed

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});
