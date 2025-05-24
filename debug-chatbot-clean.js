// Debug script để test chatbot trực tiếp
const axios = require('axios');

async function debugChatbot() {
    try {
        console.log('🔍 Debug Chatbot - Starting...');

        // 1. Test health check
        console.log('\n1. Testing health check...');
        const healthResponse = await axios.get('http://localhost:4000/api/chatbot/health');
        console.log('Health:', healthResponse.data);

        // 2. Thử đăng ký user trước
        console.log('\n2. Trying to register user first...');
        try {
            const registerResponse = await axios.post('http://localhost:4000/api/auth/register', {
                email: 'phamnhathoang214@gmail.com',
                password: 'hoang123',
                firstName: 'Hoang',
                lastName: 'Pham',
                phoneNumber: '0123456789'
            });
            console.log('Register successful:', registerResponse.status);
        } catch (regError) {
            console.log('Register failed (user might already exist):', regError.response?.status);
        }

        // 3. Login với superadmin
        console.log('\n3. Login with superadmin...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'superadmin@control.vn',
            password: 'Admin123!'
        });

        console.log('Login response status:', loginResponse.status);
        const loginData = loginResponse.data;
        if (!loginData.token) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }

        const token = loginData.token;
        console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

        // 4. Test get user data
        console.log('\n4. Testing get user data...');
        const userResponse = await axios.get('http://localhost:4000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('User data:', userResponse.data);

        // 5. Tạo dữ liệu test
        console.log('\n5. Creating test data...');

        // Tạo expense
        try {
            const expenseData = {
                amount: 500000,
                description: 'Chi tiêu test cho chatbot',
                category: 'food',
                date: new Date().toISOString()
            };
            const createExpenseResponse = await axios.post('http://localhost:4000/api/expenses', expenseData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Created expense:', createExpenseResponse.status);
        } catch (error) {
            console.log('❌ Failed to create expense:', error.response?.status);
        }

        // Tạo income
        try {
            const incomeData = {
                amount: 2000000,
                description: 'Thu nhập test cho chatbot',
                category: 'salary',
                date: new Date().toISOString()
            };
            const createIncomeResponse = await axios.post('http://localhost:4000/api/incomes', incomeData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Created income:', createIncomeResponse.status);
        } catch (error) {
            console.log('❌ Failed to create income:', error.response?.status);
        }

        // 6. Test get financial data
        console.log('\n6. Testing get financial data...');

        // Test expenses
        try {
            const expensesResponse = await axios.get('http://localhost:4000/api/expenses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Expenses response:', expensesResponse.data);
            console.log('Expenses count:', expensesResponse.data.data?.length || expensesResponse.data.length);
        } catch (error) {
            console.log('❌ Failed to get expenses:', error.response?.status);
        }

        // Test income
        try {
            const incomeResponse = await axios.get('http://localhost:4000/api/incomes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Income response:', incomeResponse.data);
            console.log('Income count:', incomeResponse.data.data?.length || incomeResponse.data.length);
        } catch (error) {
            console.log('❌ Failed to get income:', error.response?.status);
        }

        // Test loans
        try {
            const loansResponse = await axios.get('http://localhost:4000/api/loans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Loans count:', loansResponse.data.length);
        } catch (error) {
            console.log('❌ Failed to get loans:', error.response?.status);
        }

        // Test investments
        try {
            const investmentsResponse = await axios.get('http://localhost:4000/api/investments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Investments count:', investmentsResponse.data.length);
        } catch (error) {
            console.log('❌ Failed to get investments:', error.response?.status);
        }

        // 7. Test chatbot với token thật
        console.log('\n7. Testing chatbot with real token...');

        // Test legacy chatbot endpoint
        try {
            const legacyChatResponse = await axios.post('http://localhost:4000/api/chatbot/chatbot', {
                message: 'Tôi có bao nhiều khoản chi tiêu?'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Legacy chatbot response status:', legacyChatResponse.status);
            console.log('Legacy chatbot response:', legacyChatResponse.data);
        } catch (error) {
            console.log('❌ Legacy chatbot failed:', error.response?.status, error.response?.data);
        }

        // Test enhanced chatbot endpoint với nhiều câu hỏi khác nhau
        const testQuestions = [
            'Tôi có bao nhiều khoản chi tiêu?',
            'Chi tiêu của tôi tháng này là bao nhiêu?',
            'Tổng chi tiêu tháng 5 của tôi',
            'Phân tích chi tiêu của tôi'
        ];

        for (const question of testQuestions) {
            try {
                console.log(`\n🤖 Testing question: "${question}"`);
                const enhancedChatResponse = await axios.post('http://localhost:4000/api/chatbot/enhanced', {
                    message: question,
                    language: 'vi'
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('✅ Enhanced chatbot response status:', enhancedChatResponse.status);
                console.log('Response:', enhancedChatResponse.data.response);
                console.log('Intent detected:', enhancedChatResponse.data.metadata?.intent);
                console.log('Confidence:', enhancedChatResponse.data.metadata?.confidence);
            } catch (error) {
                console.log('❌ Enhanced chatbot failed:', error.response?.status, error.response?.data);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugChatbot();
