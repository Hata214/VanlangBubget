import axios from 'axios';

async function clearCache() {
  try {
    // Get a fresh token first by logging in
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'test@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Got fresh token');

    // Clear cache
    const clearResponse = await axios.delete('http://localhost:4000/api/enhanced-chatbot/cache', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Cache cleared:', clearResponse.data);

    // Test chatbot with fresh data
    const chatResponse = await axios.post('http://localhost:4000/api/enhanced-chatbot', {
      message: 'Tổng chi tiết của tôi là bao nhiêu?'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🤖 Chatbot response:', chatResponse.data.response);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

clearCache();
