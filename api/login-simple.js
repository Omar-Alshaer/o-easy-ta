/**
 * Simple login API for testing without database
 */

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
  res.writeHead(status);
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

// Mock student data
const mockStudents = {
  '2510001': {
    student_id: '2510001',
    full_name: 'عمر رضا منصور',
    phone_number: '01234567890',
    parent_phone: '01234567890',
    class_level: 'الصف الأول الثانوي',
    group_name: 'مجموعة الأحد',
    day_of_week: 'الأحد',
    start_time: '10:00',
    end_time: '12:00',
    photo_url: '/data/students/2510001.png',
    qr_code_url: '/data/barcodes/2510001.png',
    id_card_url: '/data/id_cards/2510001_id_card.png'
  },
  '2510002': {
    student_id: '2510002',
    full_name: 'محمود رضا الشاعر',
    phone_number: '01234567891',
    parent_phone: '01234567891',
    class_level: 'الصف الثاني الثانوي',
    group_name: 'مجموعة الاثنين',
    day_of_week: 'الاثنين',
    start_time: '14:00',
    end_time: '16:00',
    photo_url: '/data/students/2510002.png',
    qr_code_url: '/data/barcodes/2510002.png',
    id_card_url: '/data/id_cards/2510002_id_card.png'
  },
  '2510003': {
    student_id: '2510003',
    full_name: 'يوسف مصطفي صديق',
    phone_number: '01234567892',
    parent_phone: '01234567892',
    class_level: 'الصف الثالث الثانوي',
    group_name: 'مجموعة الثلاثاء',
    day_of_week: 'الثلاثاء',
    start_time: '16:00',
    end_time: '18:00',
    photo_url: '/data/students/2510003.png',
    qr_code_url: '/data/barcodes/2510003.png',
    id_card_url: '/data/id_cards/2510003_id_card.png'
  }
};

/**
 * Main handler
 */
async function handler(req, res) {
  console.log('🔍 Simple login API called:', req.method, req.url);

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

    // Check if student exists in mock data
    const student = mockStudents[studentId];
    
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return sendError(res, 'رقم الطالب غير موجود', 401);
    }

    // Check phone number (allow any phone for testing)
    const isPhoneValid = phoneNumber.length >= 10; // Simple validation
    
    if (!isPhoneValid) {
      console.log('❌ Invalid phone number:', phoneNumber);
      return sendError(res, 'رقم الهاتف غير صحيح', 401);
    }

    console.log('✅ Authentication successful for:', student.full_name);

    // Return success with student data
    sendResponse(res, {
      success: true,
      student: student
    });

  } catch (error) {
    console.error('❌ Simple login error:', error);
    console.error('❌ Error stack:', error.stack);
    
    sendError(res, 'حدث خطأ داخلي في الخادم', 500);
  }
}

// Export for Vercel
module.exports = handler;
module.exports.default = handler;
