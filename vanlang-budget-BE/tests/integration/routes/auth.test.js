/**
 * @jest-environment node
 */

import request from 'supertest';
import { startServer, stopServer, clearDatabase } from '../../setup.js';
import User from '../../../src/models/userModel.js';

let app;

// Setup trước khi test
beforeAll(async () => {
    app = await startServer();
});

// Cleanup sau khi test
afterAll(async () => {
    await stopServer();
});

// Xóa database sau mỗi test
afterEach(async () => {
    await clearDatabase();
});

describe('Auth API Integration Test', () => {
    // Test đăng ký
    test('Đăng ký người dùng mới', async () => {
        const userData = {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User',
            phoneNumber: '0123456789'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userData.email);
    });

    // Test đăng nhập
    test('Đăng nhập với thông tin hợp lệ', async () => {
        // Tạo user trước
        const userData = {
            email: 'login@example.com',
            password: 'Password123!',
            firstName: 'Login',
            lastName: 'Test',
            isEmailVerified: true
        };

        await User.create(userData);

        // Thực hiện đăng nhập
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('token');
        expect(loginResponse.body).toHaveProperty('user');
        expect(loginResponse.body.user.email).toBe(userData.email);
    });

    // Test đăng nhập thất bại
    test('Đăng nhập thất bại với password sai', async () => {
        // Tạo user trước
        const userData = {
            email: 'failed@example.com',
            password: 'Password123!',
            firstName: 'Failed',
            lastName: 'Test',
            isEmailVerified: true
        };

        await User.create(userData);

        // Thực hiện đăng nhập với password sai
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: 'WrongPassword123!'
            });

        expect(loginResponse.status).toBe(401);
    });
}); 