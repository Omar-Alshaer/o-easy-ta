/**
 * O-EASY-TA Student Portal - Student Data API
 * Get complete student data including stats and activities
 */

const { db } = require('../lib/database');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

/**
 * Send JSON response
 */
function sendResponse(res, data, status = 200) {
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Send error response
 */
function sendError(res, message, status = 400) {
  sendResponse(res, { success: false, error: message }, status);
}

/**
 * Main handler
 */
async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.keys(corsHeaders).forEach(key => {
      res.setHeader(key, corsHeaders[key]);
    });
    res.writeHead(200);
    return res.end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const { studentId } = req.query;

    if (!studentId) {
      return sendError(res, 'Missing studentId parameter');
    }

    // Get student info with group details
    const studentQuery = `
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
    `;

    const student = await db.query(studentQuery, [studentId]);

    if (!student || student.length === 0) {
      return sendError(res, 'Student not found', 404);
    }

    const studentInfo = student[0];

    // Get stats and activities
    const [stats, activities] = await Promise.all([
      db.getStudentStats(studentId),
      db.getRecentActivities(studentId)
    ]);

    // Add asset paths
    const studentData = {
      ...studentInfo,
      photo_url: db.getStudentPhotoPath(studentId),
      qr_code_url: db.getStudentQRPath(studentId),
      id_card_url: db.getStudentIDCardPath(studentId),
      stats,
      activities
    };

    // Return student data
    sendResponse(res, {
      success: true,
      data: studentData
    });

  } catch (error) {
    console.error('Student data error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

// Export for both CommonJS and ES modules
module.exports = { default: handler };
module.exports.default = handler;
