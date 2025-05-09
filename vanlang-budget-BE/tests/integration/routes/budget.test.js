/**
 * @jest-environment node
 */

import request from 'supertest';
import { startServer, stopServer, clearDatabase } from '../../setup.js';
import User from '../../../src/models/userModel.js';
import { createTokenPair } from '../../../src/utils/jwtUtils.js';

let app;
let token;
let userId;

// Setup trước khi test
beforeAll(async () => {
    app = await startServer();

    // Tạo một người dùng test
    const user = await User.create({
        email: 'budget-test@example.com',
        password: 'Password123!',
        firstName: 'Budget',
        lastName: 'Test',
        isEmailVerified: true
    });

    userId = user._id;
    const { accessToken } = createTokenPair(userId);
    token = accessToken;
});

// Cleanup sau khi test
afterAll(async () => {
    await stopServer();
});

// Xóa collections sau mỗi test
afterEach(async () => {
    await clearDatabase();

    // Tạo lại user sau mỗi test
    const user = await User.create({
        email: 'budget-test@example.com',
        password: 'Password123!',
        firstName: 'Budget',
        lastName: 'Test',
        isEmailVerified: true
    });

    userId = user._id;
    const { accessToken } = createTokenPair(userId);
    token = accessToken;
});

describe('Budget API Integration Tests', () => {
    // Test tạo ngân sách mới
    test('Tạo ngân sách mới', async () => {
        const budgetData = {
            name: 'Ngân sách tháng 5',
            amount: 5000000,
            startDate: '2023-05-01',
            endDate: '2023-05-31',
            description: 'Ngân sách cho tháng 5/2023'
        };

        const response = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.name).toBe(budgetData.name);
        expect(response.body.data.amount).toBe(budgetData.amount);
    });

    // Test lấy tất cả ngân sách
    test('Lấy tất cả ngân sách của người dùng', async () => {
        // Tạo một vài ngân sách trước
        const budgetData1 = {
            name: 'Ngân sách tháng 5',
            amount: 5000000,
            startDate: '2023-05-01',
            endDate: '2023-05-31',
            description: 'Ngân sách cho tháng 5/2023'
        };

        const budgetData2 = {
            name: 'Ngân sách tháng 6',
            amount: 7000000,
            startDate: '2023-06-01',
            endDate: '2023-06-30',
            description: 'Ngân sách cho tháng 6/2023'
        };

        await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData1);

        await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData2);

        // Lấy tất cả ngân sách
        const response = await request(app)
            .get('/api/budgets')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    // Test lấy ngân sách theo ID
    test('Lấy ngân sách theo ID', async () => {
        // Tạo ngân sách trước
        const budgetData = {
            name: 'Ngân sách tháng 7',
            amount: 6000000,
            startDate: '2023-07-01',
            endDate: '2023-07-31',
            description: 'Ngân sách cho tháng 7/2023'
        };

        const createResponse = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData);

        const budgetId = createResponse.body.data._id;

        // Lấy ngân sách theo ID
        const response = await request(app)
            .get(`/api/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data._id).toBe(budgetId);
        expect(response.body.data.name).toBe(budgetData.name);
    });

    // Test cập nhật ngân sách
    test('Cập nhật ngân sách', async () => {
        // Tạo ngân sách trước
        const budgetData = {
            name: 'Ngân sách tháng 8',
            amount: 8000000,
            startDate: '2023-08-01',
            endDate: '2023-08-31',
            description: 'Ngân sách cho tháng 8/2023'
        };

        const createResponse = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData);

        const budgetId = createResponse.body.data._id;

        // Cập nhật ngân sách
        const updateData = {
            name: 'Ngân sách tháng 8 (đã cập nhật)',
            amount: 9000000
        };

        const response = await request(app)
            .put(`/api/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data._id).toBe(budgetId);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.amount).toBe(updateData.amount);
    });

    // Test xóa ngân sách
    test('Xóa ngân sách', async () => {
        // Tạo ngân sách trước
        const budgetData = {
            name: 'Ngân sách tháng 9',
            amount: 9000000,
            startDate: '2023-09-01',
            endDate: '2023-09-30',
            description: 'Ngân sách cho tháng 9/2023'
        };

        const createResponse = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send(budgetData);

        const budgetId = createResponse.body.data._id;

        // Xóa ngân sách
        const response = await request(app)
            .delete(`/api/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);

        // Kiểm tra xem ngân sách đã bị xóa chưa
        const getResponse = await request(app)
            .get(`/api/budgets/${budgetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(getResponse.status).toBe(404);
    });
}); 