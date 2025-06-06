// Debug script để test chatbot trực tiếp
import fetch from 'node-fetch';

async function debugChatbot() {
    try {
        console.log('🔍 Debug Chatbot - Starting...');

        // 1. Test health check
        console.log('\n1. Testing health check...');
        const healthResponse = await fetch('http://localhost:4000/api/chatbot/health');
        const healthData = await healthResponse.json();
        console.log('Health:', healthData);

        // 2. Login với user có dữ liệu thật
        console.log('\n2. Login with user who has real data...');
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'phamnhathoang214@gmail.com',
                password: 'hoang123'
            })
        });

        console.log('Login response status:', loginResponse.status);

        const loginData = await loginResponse.json();
        if (!loginData.token) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }

        const token = loginData.token;
        console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
        console.log('User:', loginData.user);

        // 3. Test get user data
        console.log('\n3. Testing get user data...');
        const userResponse = await fetch('http://localhost:4000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userResponse.json();
        console.log('User data:', userData);

        // 4. Test get financial data
        console.log('\n4. Testing get financial data...');

        // Test expenses
        const expensesResponse = await fetch('http://localhost:4000/api/expenses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const expensesData = await expensesResponse.json();
        console.log('Expenses count:', Array.isArray(expensesData) ? expensesData.length : 'Not an array');

        // Test income
        const incomeResponse = await fetch('http://localhost:4000/api/income', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const incomeData = await incomeResponse.json();
        console.log('Income count:', Array.isArray(incomeData) ? incomeData.length : 'Not an array');

        // Test loans
        const loansResponse = await fetch('http://localhost:4000/api/loans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const loansData = await loansResponse.json();
        console.log('Loans count:', Array.isArray(loansData) ? loansData.length : 'Not an array');

        // Test investments
        const investmentsResponse = await fetch('http://localhost:4000/api/investments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const investmentsData = await investmentsResponse.json();
        console.log('Investments count:', Array.isArray(investmentsData) ? investmentsData.length : 'Not an array');

        // 5. Test enhanced chatbot
        console.log('\n5. Testing enhanced chatbot...');
        const chatResponse = await fetch('http://localhost:4000/api/chatbot/enhanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'tài chính của tôi thế nào?',
                language: 'vi'
            })
        });

        console.log('Chatbot response status:', chatResponse.status);
        const chatData = await chatResponse.json();
        console.log('✅ Chatbot response:');
        console.log('Success:', chatData.success);
        console.log('Response:', chatData.response);

        if (chatData.metadata) {
            console.log('Metadata:', chatData.metadata);
        }

        // 6. Test getUserFinancialData trực tiếp
        console.log('\n6. Testing financial data API...');
        const financialResponse = await fetch(`http://localhost:4000/api/dashboard/overview`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const financialData = await financialResponse.json();
        console.log('Financial data from dashboard:', financialData);

        // 7. Test basic chatbot
        console.log('\n7. Testing basic chatbot...');
        const basicChatResponse = await fetch('http://localhost:4000/api/chatbot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'Tôi có bao nhiều khoản chi tiêu?'
            })
        });

        console.log('Basic chatbot response status:', basicChatResponse.status);
        const basicChatData = await basicChatResponse.json();
        console.log('Basic chatbot response:', basicChatData);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

debugChatbot();
