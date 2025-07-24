/**
 * Payments API Endpoint
 * Returns detailed payments data for a student
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

    // Get detailed payments data
    const paymentsData = await db.getPaymentsData(studentId);

    // Calculate statistics
    const totalPayments = paymentsData.length;
    const paidPayments = paymentsData.filter(payment => payment.status === 'paid');
    const pendingPayments = paymentsData.filter(payment => payment.status === 'pending');
    const overduePayments = paymentsData.filter(payment => {
      if (payment.status === 'pending' && payment.dueDate) {
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        return dueDate < today;
      }
      return false;
    });

    const totalPaid = paidPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    const totalOutstanding = paymentsData.reduce((sum, payment) => {
      if (payment.status !== 'paid') {
        return sum + (payment.amount - (payment.paidAmount || 0));
      }
      return sum;
    }, 0);
    const totalAmount = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);

    // Return payments data with statistics
    sendResponse(res, {
      success: true,
      data: {
        records: paymentsData,
        statistics: {
          total: totalPayments,
          paid: paidPayments.length,
          pending: pendingPayments.length,
          overdue: overduePayments.length,
          totalPaid: totalPaid,
          totalOutstanding: totalOutstanding,
          totalAmount: totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Payments API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

// Export for both CommonJS and ES modules
module.exports = { default: handler };
module.exports.default = handler;
