/**
 * O-EASY-TA Student Portal - Login API
 * Simple authentication endpoint
 */

const { db } = require('../lib/database');

// CORS headers with UTF-8 support
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
 * Parse request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    // Parse request body
    const body = await parseBody(req);
    console.log('📝 Request body:', body);

    const { studentId, phoneNumber, classLevel } = body;
    console.log('🔍 Login attempt:', { studentId, phoneNumber, classLevel });

    // Validate input
    if (!studentId || !phoneNumber) {
      console.log('❌ Missing fields:', { studentId, phoneNumber });
      return sendError(res, 'Missing required fields: studentId, phoneNumber');
    }

    // Authenticate student
    const student = await db.authenticateStudent(studentId, phoneNumber, classLevel);

    if (!student) {
      return sendError(res, 'Invalid credentials or student not found', 401);
    }

    // Return success with student data
    sendResponse(res, {
      success: true,
      student: {
        student_id: student.student_id,
        full_name: student.full_name,
        class_level: student.class_level,
        group_name: student.group_name,
        day_of_week: student.day_of_week,
        start_time: student.start_time,
        end_time: student.end_time,
        photo_url: student.photo_url,
        qr_code_url: student.qr_code_url,
        id_card_url: student.id_card_url
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

// Export for both CommonJS and ES modules
module.exports = { default: handler };
module.exports.default = handler;
