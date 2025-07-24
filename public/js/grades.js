/**
 * Grades Page JavaScript
 * Handles grades display, statistics, and performance charts
 */

class GradesPage {
    constructor() {
        this.studentData = null;
        this.gradesData = [];
        this.performanceChart = null;
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

        // Load grades data
        await this.loadGradesData();
        this.displayStatistics();
        this.displayPerformanceChart();
        this.displayGradesTable();
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

    async loadGradesData() {
        try {
            const response = await fetch(`/api/grades?studentId=${this.studentData.student_id}`);
            const result = await response.json();

            if (result.success && result.data) {
                this.gradesData = result.data.records;
                this.gradesStats = result.data.statistics;
            } else {
                this.gradesData = [];
                this.gradesStats = { total: 0, average: 0, highest: 0, lowest: 0 };
            }
        } catch (error) {
            console.error('Error loading grades data:', error);
            this.gradesData = [];
            this.gradesStats = { total: 0, average: 0, highest: 0, lowest: 0 };
        }
    }

    generateGradesData(studentData) {
        // If we have real grades data from database, use it
        if (studentData.exams && studentData.exams.records) {
            return studentData.exams.records;
        }

        // Otherwise generate sample data
        return this.generateSampleData();
    }

    generateSampleData() {
        const exams = [];
        const examTypes = ['امتحان شهري', 'امتحان نصف الفصل', 'امتحان نهاية الفصل', 'اختبار قصير'];
        const subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'];
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const examDate = new Date(today);
            examDate.setDate(today.getDate() - (i * 7)); // Weekly exams

            const grade = Math.floor(Math.random() * 40) + 60; // Grades between 60-100
            const totalMarks = 100;

            exams.push({
                date: examDate.toISOString().split('T')[0],
                subject: subjects[Math.floor(Math.random() * subjects.length)],
                type: examTypes[Math.floor(Math.random() * examTypes.length)],
                grade: grade,
                totalMarks: totalMarks,
                percentage: Math.round((grade / totalMarks) * 100),
                notes: grade >= 85 ? 'ممتاز' : grade >= 75 ? 'جيد جداً' : grade >= 65 ? 'جيد' : 'مقبول'
            });
        }

        return exams.reverse(); // Chronological order
    }

    displayStatistics() {
        // Use real statistics from API
        const stats = this.gradesStats || { total: 0, average: 0, highest: 0, lowest: 0 };

        // Update statistics cards
        document.getElementById('averageGrade').textContent = `${stats.average}%`;
        document.getElementById('highestGrade').textContent = `${stats.highest}%`;
        document.getElementById('lowestGrade').textContent = `${stats.lowest}%`;
        document.getElementById('totalExams').textContent = stats.total;

        // Color coding for average grade
        const averageCard = document.querySelector('.stat-card.average');
        if (stats.average >= 85) {
            averageCard.querySelector('.icon').style.background = 'var(--success-color)';
        } else if (stats.average >= 75) {
            averageCard.querySelector('.icon').style.background = 'var(--secondary-color)';
        } else if (stats.average >= 65) {
            averageCard.querySelector('.icon').style.background = 'var(--warning-color)';
        } else {
            averageCard.querySelector('.icon').style.background = 'var(--danger-color)';
        }
    }

    displayPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        const labels = this.gradesData.map(exam => this.formatDate(exam.date));
        const data = this.gradesData.map(exam => exam.percentage);

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الدرجة (%)',
                    data: data,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#2c3e50'
                    }
                }
            }
        });
    }

    displayGradesTable() {
        const container = document.getElementById('gradesTableContainer');
        
        if (this.gradesData.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد درجات</h5>
                    <p class="text-muted">لم يتم تسجيل أي امتحانات حتى الآن</p>
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
                            <th>المادة</th>
                            <th>نوع الامتحان</th>
                            <th>الدرجة</th>
                            <th>النسبة المئوية</th>
                            <th>التقدير</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.gradesData.map(exam => `
                            <tr>
                                <td>${this.formatDate(exam.date)}</td>
                                <td>${exam.subject}</td>
                                <td>${exam.type}</td>
                                <td>${exam.grade}/${exam.totalMarks}</td>
                                <td>
                                    <span class="grade-badge ${this.getGradeClass(exam.percentage)}">
                                        ${exam.percentage}%
                                    </span>
                                </td>
                                <td>${this.getGradeText(exam.percentage)}</td>
                                <td>${exam.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    getGradeClass(percentage) {
        if (percentage >= 85) return 'grade-excellent';
        if (percentage >= 75) return 'grade-good';
        if (percentage >= 65) return 'grade-average';
        return 'grade-poor';
    }

    getGradeText(percentage) {
        if (percentage >= 85) return 'ممتاز';
        if (percentage >= 75) return 'جيد جداً';
        if (percentage >= 65) return 'جيد';
        return 'مقبول';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GradesPage();
});
