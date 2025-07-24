/**
 * Reports Page JavaScript
 * Handles reports generation and charts display
 */

class ReportsPage {
    constructor() {
        this.studentData = null;
        this.charts = {};
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

        // Set default date range
        this.setDefaultDateRange();

        // Load and display reports
        await this.loadReportData();
        this.generateAllCharts();
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

    setDefaultDateRange() {
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        document.getElementById('fromDate').value = threeMonthsAgo.toISOString().split('T')[0];
        document.getElementById('toDate').value = today.toISOString().split('T')[0];
    }

    async loadReportData() {
        try {
            // Load real data from multiple APIs
            const [attendanceResponse, gradesResponse, paymentsResponse] = await Promise.all([
                fetch(`/api/attendance?studentId=${this.studentData.student_id}`),
                fetch(`/api/grades?studentId=${this.studentData.student_id}`),
                fetch(`/api/payments?studentId=${this.studentData.student_id}`)
            ]);

            const attendanceData = await attendanceResponse.json();
            const gradesData = await gradesResponse.json();
            const paymentsData = await paymentsResponse.json();

            this.reportData = {
                attendance: this.processAttendanceData(attendanceData.success ? attendanceData.data : null),
                grades: this.processGradesData(gradesData.success ? gradesData.data : null),
                payments: this.processPaymentsData(paymentsData.success ? paymentsData.data : null)
            };

            // Update summary cards with real data
            this.updateSummaryCards();
        } catch (error) {
            console.error('Error loading report data:', error);
            this.reportData = this.generateSampleReportData();
        }
    }

    processAttendanceData(attendanceData) {
        if (!attendanceData || !attendanceData.records) {
            return this.generateAttendanceData();
        }

        // Group attendance by month
        const monthlyData = {};
        attendanceData.records.forEach(record => {
            const date = new Date(record.date);
            const monthKey = date.toLocaleDateString('ar-EG', { month: 'short' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { total: 0, present: 0 };
            }

            monthlyData[monthKey].total++;
            if (record.status === 'present') {
                monthlyData[monthKey].present++;
            }
        });

        return Object.keys(monthlyData).map(month => ({
            month: month,
            percentage: Math.round((monthlyData[month].present / monthlyData[month].total) * 100)
        }));
    }

    processGradesData(gradesData) {
        if (!gradesData || !gradesData.records) {
            return this.generateGradesData();
        }

        return gradesData.records.map((record, index) => ({
            exam: `امتحان ${index + 1}`,
            subject: record.subject,
            grade: record.percentage
        }));
    }

    processPaymentsData(paymentsData) {
        if (!paymentsData || !paymentsData.statistics) {
            return this.generatePaymentData();
        }

        const stats = paymentsData.statistics;
        return [
            { status: 'مدفوع', count: stats.paid, amount: stats.totalPaid },
            { status: 'متأخر', count: stats.overdue, amount: stats.totalOutstanding },
            { status: 'مستحق', count: stats.pending, amount: 0 }
        ];
    }

    updateSummaryCards() {
        // Update summary cards with real data
        if (this.reportData.attendance && this.reportData.attendance.length > 0) {
            const avgAttendance = Math.round(
                this.reportData.attendance.reduce((sum, item) => sum + item.percentage, 0) /
                this.reportData.attendance.length
            );
            document.getElementById('totalAttendance').textContent = `${avgAttendance}%`;
        }

        if (this.reportData.grades && this.reportData.grades.length > 0) {
            const avgGrade = Math.round(
                this.reportData.grades.reduce((sum, item) => sum + item.grade, 0) /
                this.reportData.grades.length
            );
            document.getElementById('academicAverage').textContent = `${avgGrade}%`;
        }

        if (this.reportData.payments) {
            const paidPayments = this.reportData.payments.find(p => p.status === 'مدفوع');
            const overduePayments = this.reportData.payments.find(p => p.status === 'متأخر');

            if (overduePayments && overduePayments.count > 0) {
                document.getElementById('paymentStatus').textContent = 'متأخر';
            } else {
                document.getElementById('paymentStatus').textContent = 'محدث';
            }
        }
    }

    generateSampleReportData() {
        return {
            attendance: this.generateAttendanceData(),
            grades: this.generateGradesData(),
            subjects: this.generateSubjectData(),
            payments: this.generatePaymentData()
        };
    }

    generateAttendanceData() {
        const data = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            
            const attendance = Math.floor(Math.random() * 20) + 75; // 75-95%
            data.push({
                month: date.toLocaleDateString('ar-EG', { month: 'short' }),
                percentage: attendance
            });
        }
        
        return data;
    }

    generateGradesData() {
        const data = [];
        const subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'];
        
        for (let i = 0; i < 10; i++) {
            const grade = Math.floor(Math.random() * 30) + 65; // 65-95
            data.push({
                exam: `امتحان ${i + 1}`,
                subject: subjects[Math.floor(Math.random() * subjects.length)],
                grade: grade
            });
        }
        
        return data;
    }

    generateSubjectData() {
        return [
            { subject: 'الرياضيات', average: 85 },
            { subject: 'الفيزياء', average: 78 },
            { subject: 'الكيمياء', average: 82 },
            { subject: 'الأحياء', average: 88 },
            { subject: 'اللغة العربية', average: 75 }
        ];
    }

    generatePaymentData() {
        return [
            { status: 'مدفوع', count: 5, amount: 2500 },
            { status: 'متأخر', count: 1, amount: 500 },
            { status: 'مستحق', count: 1, amount: 500 }
        ];
    }

    generateAllCharts() {
        this.createAttendanceChart();
        this.createGradesChart();
        this.createSubjectChart();
        this.createPaymentChart();
    }

    createAttendanceChart() {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        
        if (this.charts.attendance) {
            this.charts.attendance.destroy();
        }

        const data = this.reportData.attendance;
        
        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month),
                datasets: [{
                    label: 'نسبة الحضور (%)',
                    data: data.map(item => item.percentage),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createGradesChart() {
        const ctx = document.getElementById('gradesChart').getContext('2d');
        
        if (this.charts.grades) {
            this.charts.grades.destroy();
        }

        const data = this.reportData.grades;
        
        this.charts.grades = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.exam),
                datasets: [{
                    label: 'الدرجة (%)',
                    data: data.map(item => item.grade),
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createSubjectChart() {
        const ctx = document.getElementById('subjectChart').getContext('2d');
        
        if (this.charts.subject) {
            this.charts.subject.destroy();
        }

        const data = this.reportData.subjects;
        
        this.charts.subject = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.map(item => item.subject),
                datasets: [{
                    label: 'متوسط الدرجات',
                    data: data.map(item => item.average),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#e74c3c'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createPaymentChart() {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        if (this.charts.payment) {
            this.charts.payment.destroy();
        }

        const data = this.reportData.payments;
        
        this.charts.payment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.status),
                datasets: [{
                    data: data.map(item => item.amount),
                    backgroundColor: ['#27ae60', '#e74c3c', '#f39c12'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Global functions
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    console.log('Generating report:', { reportType, fromDate, toDate });
    
    // Here you would typically filter the data based on the selected criteria
    // For now, we'll just show an alert
    alert(`تم إنشاء تقرير ${reportType} من ${fromDate} إلى ${toDate}`);
}

function downloadChart(chartId) {
    const canvas = document.getElementById(chartId);
    const url = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `${chartId}_report.png`;
    link.href = url;
    link.click();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReportsPage();
});
