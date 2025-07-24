/**
 * Payments Page JavaScript
 * Handles payment records display and statistics
 */

class PaymentsPage {
    constructor() {
        this.studentData = null;
        this.paymentsData = [];
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

        // Load payments data
        await this.loadPaymentsData();
        this.displayStatistics();
        this.displayPaymentsTable();
        this.checkPaymentAlerts();

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

    async loadPaymentsData() {
        try {
            const response = await fetch(`/api/payments?studentId=${this.studentData.student_id}`);
            const result = await response.json();

            if (result.success && result.data) {
                this.paymentsData = result.data.records;
                this.paymentsStats = result.data.statistics;
            } else {
                this.paymentsData = [];
                this.paymentsStats = { total: 0, paid: 0, pending: 0, overdue: 0, totalPaid: 0, totalOutstanding: 0, totalAmount: 0 };
            }
        } catch (error) {
            console.error('Error loading payments data:', error);
            this.paymentsData = [];
            this.paymentsStats = { total: 0, paid: 0, pending: 0, overdue: 0, totalPaid: 0, totalOutstanding: 0, totalAmount: 0 };
        }
    }

    generatePaymentsData(studentData) {
        // If we have real payments data from database, use it
        if (studentData.payments && studentData.payments.records) {
            return studentData.payments.records;
        }

        // Otherwise generate sample data
        return this.generateSampleData();
    }

    generateSampleData() {
        const payments = [];
        const monthlyFee = 500; // 500 EGP per month
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1); // 6 months ago

        for (let i = 0; i < 7; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(startDate.getMonth() + i);

            const isPaid = i < 5 || Math.random() > 0.3; // Most months paid
            const dueDate = new Date(paymentDate);
            dueDate.setDate(15); // Due on 15th of each month

            let status = 'paid';
            let paidDate = null;

            if (isPaid) {
                paidDate = new Date(dueDate);
                paidDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 10) - 5); // ±5 days
                status = 'paid';
            } else if (dueDate < today) {
                status = 'overdue';
            } else {
                status = 'pending';
            }

            payments.push({
                month: paymentDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
                amount: monthlyFee,
                dueDate: dueDate.toISOString().split('T')[0],
                paidDate: paidDate ? paidDate.toISOString().split('T')[0] : null,
                status: status,
                method: isPaid ? (Math.random() > 0.5 ? 'نقداً' : 'تحويل بنكي') : null,
                notes: status === 'overdue' ? 'متأخر عن الموعد' : ''
            });
        }

        return payments;
    }

    displayStatistics() {
        // Use real statistics from API
        const stats = this.paymentsStats || { total: 0, paid: 0, pending: 0, overdue: 0, totalPaid: 0, totalOutstanding: 0, totalAmount: 0 };

        // Update statistics cards
        document.getElementById('paidAmount').textContent = stats.totalPaid.toLocaleString();
        document.getElementById('outstandingAmount').textContent = stats.totalOutstanding.toLocaleString();
        document.getElementById('totalAmount').textContent = stats.totalAmount.toLocaleString();
        document.getElementById('paidMonths').textContent = stats.paid;

        // Color coding for outstanding amount
        const outstandingCard = document.querySelector('.stat-card.outstanding');
        if (stats.totalOutstanding > 0) {
            outstandingCard.querySelector('.icon').style.background = 'var(--danger-color)';
        } else {
            outstandingCard.querySelector('.icon').style.background = 'var(--success-color)';
        }
    }

    checkPaymentAlerts() {
        const stats = this.paymentsStats || { overdue: 0, pending: 0 };

        if (stats.overdue > 0) {
            const alertElement = document.getElementById('paymentAlert');
            const messageElement = document.getElementById('alertMessage');

            messageElement.textContent = `يوجد ${stats.overdue} مدفوعات متأخرة يجب سدادها فوراً`;
            alertElement.style.display = 'block';
        } else if (stats.pending > 0) {
            const alertElement = document.getElementById('paymentAlert');
            const messageElement = document.getElementById('alertMessage');

            alertElement.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
            messageElement.textContent = `يوجد ${stats.pending} مدفوعات مستحقة قريباً`;
            alertElement.style.display = 'block';
        }
    }

    displayPaymentsTable() {
        const container = document.getElementById('paymentsTableContainer');
        
        if (this.paymentsData.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-credit-card fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد بيانات مدفوعات</h5>
                    <p class="text-muted">لم يتم تسجيل أي مدفوعات حتى الآن</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>الشهر</th>
                            <th>المبلغ</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>تاريخ الدفع</th>
                            <th>الحالة</th>
                            <th>طريقة الدفع</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.paymentsData.map(payment => `
                            <tr>
                                <td>${payment.month}</td>
                                <td>${payment.amount.toLocaleString()} جنيه</td>
                                <td>${this.formatDate(payment.dueDate)}</td>
                                <td>${payment.paidDate ? this.formatDate(payment.paidDate) : '-'}</td>
                                <td>
                                    <span class="status-badge status-${payment.status}">
                                        <i class="fas fa-${this.getStatusIcon(payment.status)} me-1"></i>
                                        ${this.getStatusText(payment.status)}
                                    </span>
                                </td>
                                <td>${payment.method || '-'}</td>
                                <td>${payment.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'paid': return 'check-circle';
            case 'pending': return 'clock';
            case 'overdue': return 'exclamation-triangle';
            default: return 'question-circle';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'paid': return 'مدفوع';
            case 'pending': return 'مستحق';
            case 'overdue': return 'متأخر';
            default: return 'غير محدد';
        }
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
            window.toast.info(`مرحباً ${studentName}! 💳`, 'المدفوعات والمستحقات');
        }, 800);

        // Show payment status
        setTimeout(() => {
            if (this.paymentsData && this.paymentsData.length > 0) {
                const paidPayments = this.paymentsData.filter(payment => payment.payment_status === 'paid').length;
                const totalPayments = this.paymentsData.length;
                const pendingPayments = totalPayments - paidPayments;

                if (pendingPayments === 0) {
                    window.toast.success('جميع مدفوعاتك محدثة! 🎉', 'حالة المدفوعات');
                } else if (pendingPayments === 1) {
                    window.toast.warning('لديك دفعة واحدة معلقة', 'حالة المدفوعات');
                } else {
                    window.toast.warning(`لديك ${pendingPayments} دفعات معلقة`, 'حالة المدفوعات');
                }
            } else {
                window.toast.info('لا توجد مدفوعات مسجلة بعد', 'حالة المدفوعات');
            }
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PaymentsPage();
});
