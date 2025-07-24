/**
 * Grades API Endpoint
 * Returns detailed grades data for a student
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
  try {
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

    // Get student ID from query parameters
    const studentId = req.query.studentId;

    if (!studentId) {
      return sendError(res, 'Missing required parameter: studentId');
    }

    // Get detailed grades data
    const gradesData = await db.getGradesData(studentId);

    // Calculate statistics
    const totalExams = gradesData.length;
    const grades = gradesData.map(exam => exam.percentage);
    const averageGrade = totalExams > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / totalExams) : 0;
    const highestGrade = totalExams > 0 ? Math.max(...grades) : 0;
    const lowestGrade = totalExams > 0 ? Math.min(...grades) : 0;

    // Return grades data with statistics
    sendResponse(res, {
      success: true,
      data: {
        records: gradesData,
        statistics: {
          total: totalExams,
          average: averageGrade,
          highest: highestGrade,
          lowest: lowestGrade
        }
      }
    });

  } catch (error) {
    console.error('Grades API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

// Export for both CommonJS and ES modules
module.exports = { default: handler };
module.exports.default = handler;
