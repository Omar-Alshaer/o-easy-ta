/**
 * O-EASY-TA Student Portal - Database Manager
 * Simple SQLite database connection for student data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database and assets paths
const DB_PATH = path.join(process.cwd(), 'public', 'data', 'o_easy_ta.db');
const STUDENTS_PHOTOS_PATH = path.join(process.cwd(), 'public', 'data', 'students');
const BARCODES_PATH = path.join(process.cwd(), 'public', 'data', 'barcodes');
const ID_CARDS_PATH = path.join(process.cwd(), 'public', 'data', 'id_cards');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found:', DB_PATH);
        return;
      }

      this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err.message);
        } else {
          console.log('✅ Connected to SQLite database');
        }
      });
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
  }

  /**
   * Execute a query and return results as Promise
   */
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Query error:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get student photo path
   */
  getStudentPhotoPath(studentId) {
    const extensions = ['.png', '.jpg', '.jpeg'];
    for (const ext of extensions) {
      const photoPath = path.join(STUDENTS_PHOTOS_PATH, `${studentId}${ext}`);
      if (fs.existsSync(photoPath)) {
        return `/data/students/${studentId}${ext}`;
      }
    }
    return null;
  }

  /**
   * Get student QR code path
   */
  getStudentQRPath(studentId) {
    const extensions = ['.png', '.jpg', '.jpeg'];
    for (const ext of extensions) {
      const qrPath = path.join(BARCODES_PATH, `${studentId}${ext}`);
      if (fs.existsSync(qrPath)) {
        return `/data/barcodes/${studentId}${ext}`;
      }
    }
    return null;
  }

  /**
   * Get student ID card path
   */
  getStudentIDCardPath(studentId) {
    const extensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    const patterns = [`${studentId}_id_card`, `${studentId}`, `id_card_${studentId}`];

    for (const pattern of patterns) {
      for (const ext of extensions) {
        const cardPath = path.join(ID_CARDS_PATH, `${pattern}${ext}`);
        if (fs.existsSync(cardPath)) {
          return `/data/id_cards/${pattern}${ext}`;
        }
      }
    }
    return null;
  }

  /**
   * Student authentication
   */
  async authenticateStudent(studentId, phoneNumber, classLevel) {
    try {


      // Get student with their group information
      const sql = `
        SELECT
          s.*,
          g.group_name,
          g.day_of_week,
          g.start_time,
          g.end_time,
          g.location
        FROM students s
        LEFT JOIN group_enrollments ge ON s.student_id = ge.student_id AND ge.is_active = 1
        LEFT JOIN groups g ON ge.group_id = g.group_id AND g.is_active = 1
        WHERE s.student_id = ?
        AND (s.phone_number = ? OR s.parent_phone = ?)
        LIMIT 1
      `;

      const results = await this.query(sql, [studentId, phoneNumber, phoneNumber]);

      if (results.length > 0) {
        const student = results[0];
        // Add asset paths
        student.photo_url = this.getStudentPhotoPath(studentId);
        student.qr_code_url = this.getStudentQRPath(studentId);
        student.id_card_url = this.getStudentIDCardPath(studentId);
        return student;
      }

      return null;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStats(studentId) {
    try {
      const stats = {};

      // Total attendance
      const attendanceQuery = `
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) as present_sessions
        FROM attendance 
        WHERE student_id = ?
      `;
      const attendanceResult = await this.query(attendanceQuery, [studentId]);
      const attendance = attendanceResult[0] || { total_sessions: 0, present_sessions: 0 };
      
      stats.attendance = {
        total: attendance.total_sessions,
        present: attendance.present_sessions,
        percentage: attendance.total_sessions > 0 
          ? Math.round((attendance.present_sessions / attendance.total_sessions) * 100) 
          : 0
      };

      // Total exams and average grade
      const gradesQuery = `
        SELECT 
          COUNT(*) as total_exams,
          AVG(CASE WHEN is_absent = 0 THEN percentage ELSE NULL END) as avg_percentage,
          SUM(CASE WHEN is_absent = 1 THEN 1 ELSE 0 END) as absent_exams
        FROM student_grades 
        WHERE student_id = ?
      `;
      const gradesResult = await this.query(gradesQuery, [studentId]);
      const grades = gradesResult[0] || { total_exams: 0, avg_percentage: 0, absent_exams: 0 };
      
      stats.exams = {
        total: grades.total_exams,
        average: grades.avg_percentage ? Math.round(grades.avg_percentage) : 0,
        absent: grades.absent_exams
      };

      // Payment status
      const paymentsQuery = `
        SELECT 
          COUNT(*) as total_months,
          SUM(amount_due) as total_due,
          SUM(amount_paid) as total_paid,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_months,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_months
        FROM student_payments 
        WHERE student_id = ?
      `;
      const paymentsResult = await this.query(paymentsQuery, [studentId]);
      const payments = paymentsResult[0] || { 
        total_months: 0, total_due: 0, total_paid: 0, paid_months: 0, pending_months: 0 
      };
      
      stats.payments = {
        totalDue: payments.total_due || 0,
        totalPaid: payments.total_paid || 0,
        outstanding: (payments.total_due || 0) - (payments.total_paid || 0),
        paidMonths: payments.paid_months,
        pendingMonths: payments.pending_months
      };

      return stats;
    } catch (error) {
      console.error('❌ Stats error:', error);
      return {
        attendance: { total: 0, present: 0, percentage: 0 },
        exams: { total: 0, average: 0, absent: 0 },
        payments: { totalDue: 0, totalPaid: 0, outstanding: 0, paidMonths: 0, pendingMonths: 0 }
      };
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(studentId) {
    try {
      const activities = [];

      // Recent attendance
      const attendanceQuery = `
        SELECT 
          'attendance' as type,
          attendance_date as date,
          is_present,
          g.group_name
        FROM attendance a
        JOIN groups g ON a.group_id = g.group_id
        WHERE a.student_id = ?
        ORDER BY attendance_date DESC
        LIMIT 5
      `;
      const attendanceResults = await this.query(attendanceQuery, [studentId]);
      
      attendanceResults.forEach(row => {
        activities.push({
          type: 'attendance',
          date: row.date,
          title: row.is_present ? 'حضور' : 'غياب',
          description: `${row.group_name}`,
          status: row.is_present ? 'success' : 'warning'
        });
      });

      // Recent grades
      const gradesQuery = `
        SELECT 
          'grade' as type,
          e.exam_date as date,
          e.exam_name,
          sg.percentage,
          sg.is_absent
        FROM student_grades sg
        JOIN exams e ON sg.exam_id = e.exam_id
        WHERE sg.student_id = ?
        ORDER BY e.exam_date DESC
        LIMIT 5
      `;
      const gradesResults = await this.query(gradesQuery, [studentId]);
      
      gradesResults.forEach(row => {
        activities.push({
          type: 'grade',
          date: row.date,
          title: row.exam_name,
          description: row.is_absent ? 'غائب' : `${row.percentage}%`,
          status: row.is_absent ? 'danger' : (row.percentage >= 85 ? 'success' : row.percentage >= 65 ? 'warning' : 'danger')
        });
      });

      // Recent payments
      const paymentsQuery = `
        SELECT 
          'payment' as type,
          payment_date as date,
          payment_month,
          amount_paid,
          payment_status
        FROM student_payments
        WHERE student_id = ? AND payment_date IS NOT NULL
        ORDER BY payment_date DESC
        LIMIT 5
      `;
      const paymentsResults = await this.query(paymentsQuery, [studentId]);
      
      paymentsResults.forEach(row => {
        activities.push({
          type: 'payment',
          date: row.date,
          title: `دفع شهر ${row.payment_month}`,
          description: `${row.amount_paid} جنيه`,
          status: row.payment_status === 'paid' ? 'success' : 'warning'
        });
      });

      // Sort by date and return latest 10
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    } catch (error) {
      console.error('❌ Activities error:', error);
      return [];
    }
  }

  /**
   * Get complete student data
   */
  async getStudentData(studentId) {
    try {
      // Basic student info
      const studentQuery = `
        SELECT s.*, g.group_name, g.day_of_week, g.start_time, g.end_time
        FROM students s
        LEFT JOIN group_enrollments ge ON s.student_id = ge.student_id AND ge.is_active = 1
        LEFT JOIN groups g ON ge.group_id = g.group_id AND g.is_active = 1
        WHERE s.student_id = ?
      `;
      const studentResult = await this.query(studentQuery, [studentId]);
      
      if (studentResult.length === 0) {
        return null;
      }

      const student = studentResult[0];

      // Get stats and activities
      const [stats, activities] = await Promise.all([
        this.getStudentStats(studentId),
        this.getRecentActivities(studentId)
      ]);

      return {
        ...student,
        stats,
        activities
      };

    } catch (error) {
      console.error('❌ Student data error:', error);
      return null;
    }
  }

  /**
   * Get detailed attendance data for attendance page
   */
  async getAttendanceData(studentId) {
    try {
      const attendanceQuery = `
        SELECT
          a.attendance_date as date,
          a.is_present,
          a.notes,
          a.group_id as student_group_id,
          a.att_group as attended_group_id,
          g1.group_name as student_group_name,
          g1.day_of_week as student_day,
          g1.start_time as student_start_time,
          g1.end_time as student_end_time,
          g2.group_name as attended_group_name,
          g2.day_of_week as attended_day,
          g2.start_time as attended_start_time,
          g2.end_time as attended_end_time
        FROM attendance a
        LEFT JOIN groups g1 ON a.group_id = g1.group_id
        LEFT JOIN groups g2 ON a.att_group = g2.group_id
        WHERE a.student_id = ?
        ORDER BY a.attendance_date DESC
      `;

      const results = await this.query(attendanceQuery, [studentId]);

      return results.map(record => {
        const isCompensation = record.student_group_id !== record.attended_group_id;

        return {
          date: record.date,
          day: record.attended_day || record.student_day || 'غير محدد',
          time: (record.attended_start_time && record.attended_end_time)
            ? `${record.attended_start_time} - ${record.attended_end_time}`
            : (record.student_start_time && record.student_end_time)
            ? `${record.student_start_time} - ${record.student_end_time}`
            : 'غير محدد',
          studentGroup: record.student_group_name || 'غير محدد',
          attendedGroup: record.attended_group_name || record.student_group_name || 'غير محدد',
          attendanceType: isCompensation ? 'تعويض' : 'حضور طبيعي',
          status: record.is_present ? 'present' : 'absent',
          notes: record.notes || ''
        };
      });
    } catch (error) {
      console.error('❌ Attendance data error:', error);
      return [];
    }
  }

  /**
   * Get detailed grades data for grades page
   */
  async getGradesData(studentId) {
    try {
      const gradesQuery = `
        SELECT
          sg.graded_date as date,
          sg.marks_obtained as grade,
          sg.percentage,
          sg.grade_letter,
          e.exam_name as subject,
          e.exam_type as type,
          e.total_marks as totalMarks,
          sg.remarks as notes
        FROM student_grades sg
        JOIN exams e ON sg.exam_id = e.exam_id
        WHERE sg.student_id = ? AND sg.is_absent = 0
        ORDER BY sg.graded_date DESC
      `;

      const results = await this.query(gradesQuery, [studentId]);

      return results.map(record => ({
        date: record.date,
        subject: record.subject || 'عام',
        type: record.type || 'امتحان',
        grade: record.grade,
        totalMarks: record.totalMarks,
        percentage: Math.round(record.percentage),
        notes: record.notes || ''
      }));
    } catch (error) {
      console.error('❌ Grades data error:', error);
      return [];
    }
  }

  /**
   * Get detailed payments data for payments page
   */
  async getPaymentsData(studentId) {
    try {
      const paymentsQuery = `
        SELECT
          sp.payment_month as month,
          sp.amount_due as amount,
          sp.amount_paid as paidAmount,
          sp.payment_status as status,
          sp.payment_date as paidDate,
          sp.created_date as dueDate,
          pt.payment_method as method,
          sp.notes
        FROM student_payments sp
        LEFT JOIN payment_transactions pt ON sp.payment_id = pt.payment_id
        WHERE sp.student_id = ?
        ORDER BY sp.payment_month DESC
      `;

      const results = await this.query(paymentsQuery, [studentId]);

      return results.map(record => ({
        month: record.month,
        amount: record.amount,
        paidAmount: record.paidAmount || 0,
        dueDate: record.dueDate,
        paidDate: record.paidDate,
        status: record.status,
        method: record.method || null,
        notes: record.notes || ''
      }));
    } catch (error) {
      console.error('❌ Payments data error:', error);
      return [];
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

// Create and export database instance
const db = new Database();

module.exports = { db };
